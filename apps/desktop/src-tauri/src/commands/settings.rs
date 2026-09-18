use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tauri::{AppHandle, Manager};
use tauri_plugin_store::StoreExt;
use tauri_plugin_dialog::DialogExt;
use std::fs;
use fs_extra::dir::get_size;

#[derive(Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase", default)]
pub struct AppSettings {
    // 常規
    pub language: String,
    pub app_auto_update: String,
    pub app_update_channel: String,
    pub plugin_auto_update: String,
    pub plugin_update_channel: String,
    // 行為
    pub auto_start: bool,
    pub delayed_start: bool,
    pub close_behavior: String,
    // 通知
    pub show_tray_icon: bool,
    pub desktop_notifications: bool,
    pub sound_notifications: bool,
    // 外觀
    pub theme: String,
    pub scale: f64,
    pub font_size: i32,
    pub fps_limit: i32,
    pub vsync: bool,
    pub premium_ui: bool,
    // 視窗
    pub window_mode: String,
    pub hotkey_fullscreen: String,
    // 高級
    pub admin_mode: bool,
    pub proxy_mode: String,
    pub proxy_url: String,
    pub network_timeout: i32,
    pub network_limit: String,
    pub hardware_render: String,
    pub adaptive_fps: bool,
    pub cpu_prerender_frames: i32,
    pub log_enabled: bool,
    pub log_max_size_mb: i32,
    // 存儲
    pub download_path: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            language: "zh-TW".into(),
            app_auto_update: "notify".into(),
            app_update_channel: "stable".into(),
            plugin_auto_update: "notify".into(),
            plugin_update_channel: "stable".into(),
            auto_start: false, delayed_start: false, close_behavior: "exit".into(),
            show_tray_icon: true, desktop_notifications: true, sound_notifications: false,
            theme: "dark".into(), scale: 1.0, font_size: 14, fps_limit: 60, vsync: false, premium_ui: false,
            window_mode: "window".into(), hotkey_fullscreen: "F11".into(),
            admin_mode: false, proxy_mode: "system".into(), proxy_url: "".into(),
            network_timeout: 30, network_limit: "unlimited".into(),
            hardware_render: "gpu".into(), adaptive_fps: true, cpu_prerender_frames: 3,
            log_enabled: true, log_max_size_mb: 100,
            download_path: "".into(),
        }
    }
}

#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct AppSettingsPatch {
    pub language: Option<String>,
    pub app_auto_update: Option<String>,
    pub app_update_channel: Option<String>,
    pub plugin_auto_update: Option<String>,
    pub plugin_update_channel: Option<String>,
    pub auto_start: Option<bool>,
    pub delayed_start: Option<bool>,
    pub close_behavior: Option<String>,
    pub show_tray_icon: Option<bool>,
    pub desktop_notifications: Option<bool>,
    pub sound_notifications: Option<bool>,
    pub theme: Option<String>,
    pub scale: Option<f64>,
    pub font_size: Option<i32>,
    pub fps_limit: Option<i32>,
    pub vsync: Option<bool>,
    pub premium_ui: Option<bool>,
    pub window_mode: Option<String>,
    pub hotkey_fullscreen: Option<String>,
    pub admin_mode: Option<bool>,
    pub proxy_mode: Option<String>,
    pub proxy_url: Option<String>,
    pub network_timeout: Option<i32>,
    pub network_limit: Option<String>,
    pub hardware_render: Option<String>,
    pub adaptive_fps: Option<bool>,
    pub cpu_prerender_frames: Option<i32>,
    pub log_enabled: Option<bool>,
    pub log_max_size_mb: Option<i32>,
    pub download_path: Option<String>,
}

#[tauri::command]
pub fn settings_get(app: AppHandle) -> Result<AppSettings, String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    let stored = store.get("app_settings").unwrap_or(json!({}));
    let settings: AppSettings = serde_json::from_value(stored).unwrap_or_default();
    Ok(settings)
}

#[tauri::command]
pub fn settings_set(app: AppHandle, settings: Value) -> Result<Value, String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    let mut current = settings_get(app.clone())?;
    let patch: AppSettingsPatch = serde_json::from_value(settings).map_err(|e| format!("Invalid: {}", e))?;

    if let Some(v) = patch.language { current.language = v; }
    if let Some(v) = patch.app_auto_update { current.app_auto_update = v; }
    if let Some(v) = patch.app_update_channel { current.app_update_channel = v; }
    if let Some(v) = patch.plugin_auto_update { current.plugin_auto_update = v; }
    if let Some(v) = patch.plugin_update_channel { current.plugin_update_channel = v; }
    if let Some(v) = patch.auto_start { current.auto_start = v; }
    if let Some(v) = patch.delayed_start { current.delayed_start = v; }
    if let Some(v) = patch.close_behavior { current.close_behavior = v; }
    if let Some(v) = patch.show_tray_icon { current.show_tray_icon = v; }
    if let Some(v) = patch.desktop_notifications { current.desktop_notifications = v; }
    if let Some(v) = patch.sound_notifications { current.sound_notifications = v; }
    if let Some(v) = patch.theme { current.theme = v; }
    if let Some(v) = patch.scale { current.scale = v; }
    if let Some(v) = patch.font_size { current.font_size = v; }
    if let Some(v) = patch.fps_limit { current.fps_limit = v; }
    if let Some(v) = patch.vsync { current.vsync = v; }
    if let Some(v) = patch.premium_ui { current.premium_ui = v; }
    if let Some(v) = patch.window_mode { current.window_mode = v; }
    if let Some(v) = patch.hotkey_fullscreen { current.hotkey_fullscreen = v; }
    if let Some(v) = patch.admin_mode { current.admin_mode = v; }
    if let Some(v) = patch.proxy_mode { current.proxy_mode = v; }
    if let Some(v) = patch.proxy_url { current.proxy_url = v; }
    if let Some(v) = patch.network_timeout { current.network_timeout = v; }
    if let Some(v) = patch.network_limit { current.network_limit = v; }
    if let Some(v) = patch.hardware_render { current.hardware_render = v; }
    if let Some(v) = patch.adaptive_fps { current.adaptive_fps = v; }
    if let Some(v) = patch.cpu_prerender_frames { current.cpu_prerender_frames = v; }
    if let Some(v) = patch.log_enabled { current.log_enabled = v; }
    if let Some(v) = patch.log_max_size_mb { current.log_max_size_mb = v; }
    if let Some(v) = patch.download_path { current.download_path = v; }

    store.set("app_settings", serde_json::to_value(current).unwrap());
    let _ = store.save();
    Ok(json!({"success": true}))
}

// 開機自啟動 - 真正寫入註冊表
#[tauri::command]
pub fn settings_set_auto_start(app: AppHandle, enabled: bool) -> Result<(), String> {
    let exe = std::env::current_exe().map_err(|e| e.to_string())?;
    let key = r"HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run";
    let name = "Morget";
    if enabled {
        let out = std::process::Command::new("reg")
            .args(["add", key, "/v", name, "/t", "REG_SZ", "/d", &exe.to_string_lossy(), "/f"])
            .output().map_err(|e| e.to_string())?;
        if !out.status.success() { return Err("註冊開機自啟動失敗".into()); }
    } else {
        let _ = std::process::Command::new("reg")
            .args(["delete", key, "/v", name, "/f"])
            .output();
    }
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    let mut s: AppSettings = serde_json::from_value(store.get("app_settings").unwrap_or(json!({}))).unwrap_or_default();
    s.auto_start = enabled;
    store.set("app_settings", serde_json::to_value(s).unwrap());
    let _ = store.save();
    Ok(())
}

// 關閉行為 - 設置窗口關閉事件
#[tauri::command]
pub fn settings_set_close_behavior(app: AppHandle, behavior: String) -> Result<(), String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    let mut s: AppSettings = serde_json::from_value(store.get("app_settings").unwrap_or(json!({}))).unwrap_or_default();
    s.close_behavior = behavior.clone();
    store.set("app_settings", serde_json::to_value(s).unwrap());
    let _ = store.save();
    // 應用關閉行為到窗口
    if let Some(win) = app.get_webview_window("main") {
        if behavior == "minimize" {
            let _ = win.on_window_event(move |event| {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = win.minimize();
                }
            });
        }
    }
    Ok(())
}

// 系統托盤圖標
#[tauri::command]
pub fn settings_set_tray_icon(app: AppHandle, enabled: bool) -> Result<(), String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    let mut s: AppSettings = serde_json::from_value(store.get("app_settings").unwrap_or(json!({}))).unwrap_or_default();
    s.show_tray_icon = enabled;
    store.set("app_settings", serde_json::to_value(s).unwrap());
    let _ = store.save();
    // 托盤圖標需要重啟應用才能完全生效，但這裡保存設置
    Ok(())
}

// 桌面通知測試 - 調用 Windows 通知
#[tauri::command]
pub async fn settings_test_notification() -> Result<(), String> {
    let script = r#"
Add-Type -AssemblyName System.Windows.Forms
$notify = New-Object System.Windows.Forms.NotifyIcon
$notify.Icon = [System.Drawing.SystemIcons]::Information
$notify.BalloonTipTitle = 'Morget'
$notify.BalloonTipText = '這是一條測試通知'
$notify.Visible = $true
$notify.ShowBalloonTip(3000)
Start-Sleep -Seconds 3
$notify.Dispose()
"#;
    std::process::Command::new("powershell")
        .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script])
        .output().map_err(|e| format!("通知發送失敗: {}", e))?;
    Ok(())
}

// 聲音測試 - 播放系統聲音
#[tauri::command]
pub async fn settings_test_sound() -> Result<(), String> {
    let script = r#"(New-Object Media.SoundPlayer 'C:\Windows\Media\Windows Notify System Generic.wav').PlaySync()"#;
    std::process::Command::new("powershell")
        .args(["-NoProfile", "-Command", script])
        .output().map_err(|e| format!("聲音播放失敗: {}", e))?;
    Ok(())
}

// 全屏切換
#[tauri::command]
pub fn settings_toggle_fullscreen(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("main") {
        let is_fs = win.is_fullscreen().map_err(|e| e.to_string())?;
        win.set_fullscreen(!is_fs).map_err(|e| e.to_string())?;
    }
    Ok(())
}

// 設置視窗模式
#[tauri::command]
pub fn settings_set_window_mode(app: AppHandle, mode: String) -> Result<(), String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    let mut s: AppSettings = serde_json::from_value(store.get("app_settings").unwrap_or(json!({}))).unwrap_or_default();
    s.window_mode = mode.clone();
    store.set("app_settings", serde_json::to_value(s).unwrap());
    let _ = store.save();
    if let Some(win) = app.get_webview_window("main") {
        if mode == "fullscreen" {
            win.set_fullscreen(true).map_err(|e| e.to_string())?;
        } else {
            win.set_fullscreen(false).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

// 管理員權限檢查
#[tauri::command]
pub fn settings_check_admin() -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        let out = std::process::Command::new("net")
            .arg("session")
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .status();
        match out {
            Ok(s) => Ok(s.success()),
            Err(_) => Ok(false),
        }
    }
    #[cfg(not(target_os = "windows"))]
    { Ok(false) }
}

// 重置所有設置
#[tauri::command]
pub fn settings_reset_all(app: AppHandle) -> Result<(), String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    store.set("app_settings", serde_json::to_value(AppSettings::default()).unwrap());
    let _ = store.save();
    Ok(())
}

// 恢復出廠設置 - 清空所有數據
#[tauri::command]
pub fn settings_factory_reset(app: AppHandle) -> Result<(), String> {
    let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    if data_dir.exists() {
        let _ = fs::remove_dir_all(&data_dir);
    }
    Ok(())
}

#[tauri::command]
pub async fn settings_select_directory(app: AppHandle) -> Result<Option<String>, String> {
    let (tx, rx) = tokio::sync::oneshot::channel();
    app.dialog().file().pick_folder(move |result| { let _ = tx.send(result); });
    match rx.await {
        Ok(Some(tauri_plugin_dialog::FilePath::Path(p))) => Ok(Some(p.to_string_lossy().into_owned())),
        Ok(Some(tauri_plugin_dialog::FilePath::Url(u))) => Ok(Some(u.to_string())),
        Ok(None) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn settings_pick_plugin_file(app: AppHandle) -> Result<Option<String>, String> {
    let (tx, rx) = tokio::sync::oneshot::channel();
    app.dialog().file().add_filter("Morget Plugin", &["mgpn", "mgp"]).pick_file(move |result| { let _ = tx.send(result); });
    match rx.await {
        Ok(Some(tauri_plugin_dialog::FilePath::Path(p))) => Ok(Some(p.to_string_lossy().into_owned())),
        Ok(Some(tauri_plugin_dialog::FilePath::Url(u))) => Ok(Some(u.to_string())),
        Ok(None) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn settings_get_cache_size(app: AppHandle) -> Result<f64, String> {
    let cache_dir = app.path().app_cache_dir().map_err(|e| e.to_string())?;
    if cache_dir.exists() { Ok((get_size(&cache_dir).unwrap_or(0) as f64) / (1024.0 * 1024.0)) } else { Ok(0.0) }
}

#[tauri::command]
pub fn settings_clear_cache(app: AppHandle) -> Result<Value, String> {
    let cache_dir = app.path().app_cache_dir().map_err(|e| e.to_string())?;
    let mut freed_mb = 0.0;
    if cache_dir.exists() {
        freed_mb = (get_size(&cache_dir).unwrap_or(0) as f64) / (1024.0 * 1024.0);
        let _ = fs::remove_dir_all(&cache_dir);
        let _ = fs::create_dir_all(&cache_dir);
    }
    Ok(json!({"success": true, "freedMB": freed_mb}))
}
