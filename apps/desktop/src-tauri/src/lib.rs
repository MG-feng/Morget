//! Morget Core - Tauri 后端入口
//!
//! 职责：
//! 1. 注册所有 IPC 命令 —— 这是前端包唯一被允许的后端调用形式（API 接口层）
//! 2. 应用启动时把设置真正落地到运行时（FPS / VSync / 缩放 / 窗口模式 / 开机自启 / 托盘…）
//! 3. 管理跨功能共享状态（插件管理器、认证状态、运行时生效值）

pub mod commands;
pub mod core;

use serde::Serialize;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_store::StoreExt;

use crate::core::plugin_manager::PluginManager;
use commands::auth::AuthState;
use commands::plugin::AppState;

/// 运行时真实生效值（FPS / VSync / 缩放 / 全屏），供任意前端包回显
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeState {
    pub fps_limit: i32,
    pub vsync: bool,
    pub scale_factor: f64,
    pub is_fullscreen: bool,
    /// FPS/VSync 控制在本平台是否受支持（Windows WebView2 支持；其他平台 false，绝不假装生效）
    pub fps_control_supported: bool,
}

pub struct RuntimeStateHolder(pub Mutex<RuntimeState>);

/// 读取持久化设置（store 不可用/损坏时回退默认值，保证启动不崩）
pub fn load_settings(app: &AppHandle) -> commands::settings::AppSettings {
    app
        .store("settings.json")
        .ok()
        .and_then(|s| s.get("app_settings"))
        .and_then(|v| serde_json::from_value::<commands::settings::AppSettings>(v).ok())
        .unwrap_or_default()
}

fn broadcast_runtime(app: &AppHandle) {
    if let Some(h) = app.try_state::<RuntimeStateHolder>() {
        if let Ok(rt) = h.0.lock() {
            let _ = app.emit("runtime-changed", rt.clone());
        }
    }
}

/// 把 FPS 限制与垂直同步真正应用到 WebView 渲染表面。
/// 语义：vsync=true 由显示器刷新率决定帧率；vsync=false 且 fps>0 限帧到 fps；
/// vsync=false 且 fps==0 完全不限帧。失败返回错误码，调用方可诚实展示原因。
pub fn apply_fps_and_vsync(app: &AppHandle, fps: i32, vsync: bool) -> Result<(), String> {
    let w = app
        .get_webview_window("main")
        .ok_or("WINDOW_NOT_FOUND: 主窗口不存在")?;
    #[cfg(target_os = "windows")]
    {
        let policy = if vsync {
            tauri::webview::WindowsWebViewSurfaceVsyncPollingInterval::Vsync
        } else if fps > 0 {
            tauri::webview::WindowsWebViewSurfaceVsyncPollingInterval::Fixed(fps as u32)
        } else {
            tauri::webview::WindowsWebViewSurfaceVsyncPollingInterval::Unlimited
        };
        w.set_vsync_polling_interval(Some(policy))
            .map_err(|e| format!("FPS_APPLY_ERROR: {}", e))?;
        if let Some(h) = app.try_state::<RuntimeStateHolder>() {
            if let Ok(mut rt) = h.0.lock() {
                rt.fps_limit = fps;
                rt.vsync = vsync;
            }
        }
        broadcast_runtime(app);
        Ok(())
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = w;
        Err("PLATFORM_NOT_SUPPORTED: FPS/VSync 控制在当前平台不可用（仅 Windows WebView2 支持）".to_string())
    }
}

/// 界面缩放：通过原生 zoom 倍率作用于整个 WebView（与字体大小相互独立、可叠加）
pub fn apply_scale(app: &AppHandle, scale: f64) -> Result<(), String> {
    let scale = scale.clamp(0.8, 1.5);
    let w = app
        .get_webview_window("main")
        .ok_or("WINDOW_NOT_FOUND: 主窗口不存在")?;
    w.set_zoom(tauri::ZoomFactor(scale))
        .map_err(|e| format!("SCALE_APPLY_ERROR: {}", e))?;
    if let Some(h) = app.try_state::<RuntimeStateHolder>() {
        if let Ok(mut rt) = h.0.lock() {
            rt.scale_factor = scale;
        }
    }
    broadcast_runtime(app);
    Ok(())
}

/// 窗口模式：window / fullscreen
pub fn apply_window_mode(app: &AppHandle, mode: &str) -> Result<(), String> {
    let w = app
        .get_webview_window("main")
        .ok_or("WINDOW_NOT_FOUND: 主窗口不存在")?;
    let fullscreen = mode == "fullscreen";
    w.set_fullscreen(fullscreen)
        .map_err(|e| format!("WINDOW_MODE_ERROR: {}", e))?;
    if let Some(h) = app.try_state::<RuntimeStateHolder>() {
        if let Ok(mut rt) = h.0.lock() {
            rt.is_fullscreen = fullscreen;
        }
    }
    broadcast_runtime(app);
    Ok(())
}

/// 开机自启动：真实写入/删除 Windows 注册表 Run 键；非 Windows 返回错误码而不是假装成功
pub fn set_autostart(enabled: bool) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        let exe = std::env::current_exe().map_err(|e| format!("AUTOSTART_EXE_ERROR: {}", e))?;
        let key = r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run";
        let out = if enabled {
            std::process::Command::new("reg")
                .args([
                    "add", key, "/v", "Morget", "/t", "REG_SZ", "/d",
                    &format!("\"{}\"", exe.display()), "/f",
                ])
                .creation_flags(CREATE_NO_WINDOW)
                .output()
        } else {
            std::process::Command::new("reg")
                .args(["delete", key, "/v", "Morget", "/f"])
                .creation_flags(CREATE_NO_WINDOW)
                .output()
        };
        match out {
            Ok(o) if o.status.success() => Ok(()),
            // reg delete 对不存在的值会报错，这属于幂等成功（本来就没开自启）
            Ok(o) if !enabled && reg_not_found(&o) => Ok(()),
            Ok(o) => Err(format!(
                "AUTOSTART_REGISTRY_ERROR: {}",
                String::from_utf8_lossy(&o.stderr).trim()
            )),
            Err(e) => Err(format!("AUTOSTART_SPAWN_ERROR: {}", e)),
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = enabled;
        Err("PLATFORM_NOT_SUPPORTED: 开机自启动目前仅支持 Windows".to_string())
    }
}

#[cfg(target_os = "windows")]
fn reg_not_found(output: &std::process::Output) -> bool {
    let s = String::from_utf8_lossy(&output.stderr);
    s.contains("找不到") || s.to_lowercase().contains("not found") || s.contains("ERROR:")
}

/// 系统通知测试：使用 tauri-plugin-notification 真实发送（失败时报错，不模拟）
pub fn send_test_notification(app: &AppHandle) -> Result<(), String> {
    use tauri_plugin_notification::NotificationExt;
    app.notification()
        .builder()
        .title("Morget")
        .body("這是一條來自 Morget 的測試通知")
        .show()
        .map_err(|e| format!("NOTIFICATION_ERROR: {}", e))
}

/// 声音测试：Windows 下真实播放系统提示音；其他平台返回错误码
pub fn play_test_sound(app: &AppHandle) -> Result<(), String> {
    let settings = load_settings(app);
    if !settings.sound_notifications {
        return Err("SOUND_DISABLED: 請先開啟「聲音通知」再測試".to_string());
    }
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        let script = "(New-Object Media.SoundPlayer 'C:\\Windows\\Media\\Windows Notify System Generic.wav').PlaySync()";
        let out = std::process::Command::new("powershell")
            .args(["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-Command", script])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
            .map_err(|e| format!("SOUND_SPAWN_ERROR: {}", e))?;
        if out.status.success() {
            Ok(())
        } else {
            Err(format!(
                "SOUND_PLAY_ERROR: {}",
                String::from_utf8_lossy(&out.stderr).trim()
            ))
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        Err("PLATFORM_NOT_SUPPORTED: 声音测试目前仅支持 Windows".to_string())
    }
}

/// 管理员检测（Windows：net session；其他平台：euid==0）
pub fn check_admin() -> bool {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        std::process::Command::new("net")
            .arg("session")
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .creation_flags(CREATE_NO_WINDOW)
            .status()
            .map(|s| s.success())
            .unwrap_or(false)
    }
    #[cfg(not(target_os = "windows"))]
    {
        extern "C" {
            fn geteuid() -> u32;
        }
        unsafe { geteuid() == 0 }
    }
}

/// 代理配置：reqwest 必须显式构造 client 才会走代理。
/// 所有出站 HTTP 请求都必须经过这个函数，代理/超时设置才是“真实生效”的。
pub fn build_http_client(
    timeout_secs: i32,
    proxy_mode: &str,
    proxy_url: &str,
) -> Result<reqwest::Client, String> {
    let mut builder = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(timeout_secs.max(1) as u64));
    match proxy_mode {
        "direct" => {
            builder = builder.no_proxy();
        }
        "custom" => {
            let url = proxy_url.trim();
            if url.is_empty() {
                return Err("PROXY_URL_REQUIRED: 自定义代理需要填写代理地址".to_string());
            }
            builder = builder
                .proxy(reqwest::Proxy::all(url).map_err(|e| format!("PROXY_INVALID: {}", e))?);
        }
        // "system"：继承 HTTPS_PROXY/HTTP_PROXY 等环境变量（reqwest 默认行为）
        _ => {}
    }
    builder.build().map_err(|e| e.to_string())
}

/// 按设置创建/移除系统托盘图标
pub fn update_tray(app: &AppHandle, enabled: bool) -> Result<(), String> {
    use tauri::menu::{Menu, MenuItem};
    use tauri::tray::TrayIconBuilder;

    if enabled {
        if app.tray_by_id("morget-tray").is_some() {
            return Ok(()); // 已存在则不重复创建
        }
        let show = MenuItem::with_id(app, "tray-show", "顯示 Morget", true, None::<&str>)
            .map_err(|e| e.to_string())?;
        let quit =
            MenuItem::with_id(app, "tray-quit", "退出", true, None::<&str>).map_err(|e| e.to_string())?;
        let menu = Menu::with_items(app, &[&show, &quit]).map_err(|e| e.to_string())?;
        let icon = app
            .default_window_icon()
            .cloned()
            .ok_or("TRAY_ICON_MISSING: 打包资源中缺少默认图标")?;
        TrayIconBuilder::with_id("morget-tray")
            .menu(&menu)
            .tooltip("Morget")
            .icon(icon)
            .on_menu_event(|app, event| match event.id.as_ref() {
                "tray-show" => {
                    if let Some(w) = app.get_webview_window("main") {
                        let _ = w.unminimize();
                        let _ = w.show();
                        let _ = w.set_focus();
                    }
                }
                "tray-quit" => app.exit(0),
                _ => {}
            })
            .build(app)
            .map_err(|e| format!("TRAY_CREATE_ERROR: {}", e))?;
        Ok(())
    } else {
        if let Some(tray) = app.tray_by_id("morget-tray") {
            tray.remove().map_err(|e| format!("TRAY_REMOVE_ERROR: {}", e))?;
        }
        Ok(())
    }
}

/// 设置变更事件载荷（广播给所有前端包，保持多包同步）
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingsChangedEvent {
    pub changed_keys: Vec<String>,
    pub settings: commands::settings::AppSettings,
}

pub fn emit_settings_changed(
    app: &AppHandle,
    changed_keys: Vec<String>,
    settings: &commands::settings::AppSettings,
) {
    let _ = app.emit(
        "settings-changed",
        SettingsChangedEvent { changed_keys, settings: settings.clone() },
    );
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    // Deep-link（morget:// OAuth 回调）：单实例转发命令行中的协议 URL
    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            if let Some(url) = args.iter().find(|a| a.starts_with("morget://")) {
                let _ = app.emit("deep-link", url.clone());
            }
        }));
    }

    builder = builder
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .manage(AppState {
            plugin_manager: Mutex::new(None), // setup 中以真实 app_data_dir 初始化
        })
        .manage(AuthState::new())
        .manage(RuntimeStateHolder(Mutex::new(RuntimeState {
            fps_limit: 60,
            vsync: false,
            scale_factor: 1.0,
            is_fullscreen: false,
            fps_control_supported: cfg!(target_os = "windows"),
        })))
        .setup(|app| {
            let handle = app.handle().clone();

            // 用真实的 app_data_dir 初始化插件目录
            {
                let data_dir = handle.path().app_data_dir().map_err(|e| e.to_string())?;
                let state = handle.state::<AppState>();
                let mut slot = state.plugin_manager.lock().map_err(|_| "Lock error".to_string())?;
                *slot = Some(PluginManager::new(data_dir));
            }

            let settings = load_settings(&handle);

            // ---- 启动时把所有设置真正应用到运行时（失败只记录，不阻塞启动）----
            if let Err(e) = apply_fps_and_vsync(&handle, settings.fps_limit, settings.vsync) {
                eprintln!("[Morget] fps/vsync sync failed: {}", e);
            }
            if let Err(e) = apply_scale(&handle, settings.scale) {
                eprintln!("[Morget] scale sync failed: {}", e);
            }
            if let Err(e) = apply_window_mode(&handle, &settings.window_mode) {
                eprintln!("[Morget] window mode sync failed: {}", e);
            }
            if let Err(e) = set_autostart(settings.auto_start) {
                eprintln!("[Morget] autostart sync failed: {}", e);
            }
            if let Err(e) = update_tray(&handle, settings.show_tray_icon) {
                eprintln!("[Morget] tray sync failed: {}", e);
            }

            // 深链接协议注册（尽力而为）
            #[cfg(desktop)]
            {
                use tauri_plugin_deep_link::DeepLinkExt;
                let _ = handle.deep_link().register_all();
            }

            Ok(())
        })
        // 关闭窗口行为：minimize 时隐藏到托盘而不是退出
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let app = window.app_handle();
                let settings = load_settings(app);
                if settings.close_behavior == "minimize" && settings.show_tray_icon {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        });

    builder = builder.invoke_handler(tauri::generate_handler![
        // 插件
        commands::plugin::plugin_list,
        commands::plugin::plugin_install_via_dialog,
        commands::plugin::plugin_uninstall,
        commands::plugin::plugin_toggle,
        // 设置
        commands::settings::settings_get,
        commands::settings::settings_set,
        commands::settings::settings_select_directory,
        commands::settings::settings_get_cache_size,
        commands::settings::settings_clear_cache,
        commands::settings::settings_set_auto_start,
        commands::settings::settings_set_close_behavior,
        commands::settings::settings_set_tray_icon,
        commands::settings::settings_test_notification,
        commands::settings::settings_test_sound,
        commands::settings::settings_toggle_fullscreen,
        commands::settings::settings_set_window_mode,
        commands::settings::settings_check_admin,
        commands::settings::settings_reset_all,
        commands::settings::settings_factory_reset,
        commands::settings::settings_get_runtime_state,
        // 前端包管理
        commands::frontend::frontend_get_config,
        commands::frontend::frontend_set_config,
        commands::frontend::frontend_list,
        commands::frontend::frontend_get_app_info,
        // 市场（未接入时诚实返回错误码）
        commands::market::market_search,
        commands::market::market_report_view,
        commands::market::market_download,
        commands::market::market_status,
        // 认证
        commands::auth::auth_get_state,
        commands::auth::auth_login,
        commands::auth::auth_callback,
        commands::auth::auth_logout,
        // GitHub
        commands::github::github_auth,
        commands::github::github_get_repos,
        commands::github::github_upload_plugin,
        // 钱包
        commands::wallet::wallet_get_info,
    ]);

    builder
        .run(tauri::generate_context!())
        .expect("error while running Morget");
}
