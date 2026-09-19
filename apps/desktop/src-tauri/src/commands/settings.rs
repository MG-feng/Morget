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
    pub language: String, pub theme: String, pub scale: f64, pub download_path: String, pub auto_update: bool,
    pub app_auto_update: String, pub app_update_channel: String, pub plugin_auto_update: String, pub plugin_update_channel: String,
    pub auto_start: bool, pub delayed_start: bool, pub close_behavior: String,
    pub show_tray_icon: bool, pub desktop_notifications: bool, pub sound_notifications: bool,
    pub font_size: i32, pub fps_limit: i32, pub vsync: bool, pub premium_ui: bool,
    pub window_mode: String, pub hotkey_fullscreen: String,
    pub admin_mode: bool, pub proxy_mode: String, pub proxy_url: String, pub network_timeout: i32,
    pub hardware_render: String, pub adaptive_fps: bool, pub cpu_prerender_frames: i32,
    pub log_enabled: bool, pub log_max_size_mb: i32,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            language: "zh-TW".into(), theme: "dark".into(), scale: 1.0, download_path: "".into(), auto_update: true,
            app_auto_update: "notify".into(), app_update_channel: "stable".into(), plugin_auto_update: "notify".into(), plugin_update_channel: "stable".into(),
            auto_start: false, delayed_start: false, close_behavior: "exit".into(),
            show_tray_icon: true, desktop_notifications: true, sound_notifications: false,
            font_size: 14, fps_limit: 60, vsync: false, premium_ui: false,
            window_mode: "window".into(), hotkey_fullscreen: "F11".into(),
            admin_mode: false, proxy_mode: "system".into(), proxy_url: "".into(), network_timeout: 30,
            hardware_render: "gpu".into(), adaptive_fps: true, cpu_prerender_frames: 3,
            log_enabled: true, log_max_size_mb: 100,
        }
    }
}

#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct AppSettingsPatch {
    pub language: Option<String>, pub theme: Option<String>, pub scale: Option<f64>, pub download_path: Option<String>, pub auto_update: Option<bool>,
    pub app_auto_update: Option<String>, pub app_update_channel: Option<String>, pub plugin_auto_update: Option<String>, pub plugin_update_channel: Option<String>,
    pub auto_start: Option<bool>, pub delayed_start: Option<bool>, pub close_behavior: Option<String>,
    pub show_tray_icon: Option<bool>, pub desktop_notifications: Option<bool>, pub sound_notifications: Option<bool>,
    pub font_size: Option<i32>, pub fps_limit: Option<i32>, pub vsync: Option<bool>, pub premium_ui: Option<bool>,
    pub window_mode: Option<String>, pub hotkey_fullscreen: Option<String>,
    pub admin_mode: Option<bool>, pub proxy_mode: Option<String>, pub proxy_url: Option<String>, pub network_timeout: Option<i32>,
    pub hardware_render: Option<String>, pub adaptive_fps: Option<bool>, pub cpu_prerender_frames: Option<i32>,
    pub log_enabled: Option<bool>, pub log_max_size_mb: Option<i32>,
}

#[tauri::command] pub fn settings_get(app: AppHandle) -> Result<AppSettings, String> { let store = app.store("settings.json").map_err(|e| e.to_string())?; let stored = store.get("app_settings").unwrap_or(json!({})); Ok(serde_json::from_value(stored).unwrap_or_default()) }
#[tauri::command] pub fn settings_set(app: AppHandle, settings: Value) -> Result<Value, String> { let store = app.store("settings.json").map_err(|e| e.to_string())?; let mut c = settings_get(app.clone())?; let p: AppSettingsPatch = serde_json::from_value(settings).map_err(|e| e.to_string())?; if let Some(v) = p.language { c.language = v; } if let Some(v) = p.theme { c.theme = v; } if let Some(v) = p.scale { c.scale = v; } if let Some(v) = p.download_path { c.download_path = v; } if let Some(v) = p.auto_update { c.auto_update = v; } if let Some(v) = p.app_auto_update { c.app_auto_update = v; } if let Some(v) = p.app_update_channel { c.app_update_channel = v; } if let Some(v) = p.plugin_auto_update { c.plugin_auto_update = v; } if let Some(v) = p.plugin_update_channel { c.plugin_update_channel = v; } if let Some(v) = p.auto_start { c.auto_start = v; } if let Some(v) = p.delayed_start { c.delayed_start = v; } if let Some(v) = p.close_behavior { c.close_behavior = v; } if let Some(v) = p.show_tray_icon { c.show_tray_icon = v; } if let Some(v) = p.desktop_notifications { c.desktop_notifications = v; } if let Some(v) = p.sound_notifications { c.sound_notifications = v; } if let Some(v) = p.font_size { c.font_size = v; } if let Some(v) = p.fps_limit { c.fps_limit = v; } if let Some(v) = p.vsync { c.vsync = v; } if let Some(v) = p.premium_ui { c.premium_ui = v; } if let Some(v) = p.window_mode { c.window_mode = v; } if let Some(v) = p.hotkey_fullscreen { c.hotkey_fullscreen = v; } if let Some(v) = p.admin_mode { c.admin_mode = v; } if let Some(v) = p.proxy_mode { c.proxy_mode = v; } if let Some(v) = p.proxy_url { c.proxy_url = v; } if let Some(v) = p.network_timeout { c.network_timeout = v; } if let Some(v) = p.hardware_render { c.hardware_render = v; } if let Some(v) = p.adaptive_fps { c.adaptive_fps = v; } if let Some(v) = p.cpu_prerender_frames { c.cpu_prerender_frames = v; } if let Some(v) = p.log_enabled { c.log_enabled = v; } if let Some(v) = p.log_max_size_mb { c.log_max_size_mb = v; } store.set("app_settings", serde_json::to_value(c).unwrap()); let _ = store.save(); Ok(json!({"success": true})) }
#[tauri::command] pub async fn settings_select_directory(app: AppHandle) -> Result<Option<String>, String> { let (tx, rx) = tokio::sync::oneshot::channel(); app.dialog().file().pick_folder(move |r| { let _ = tx.send(r); }); match rx.await { Ok(Some(tauri_plugin_dialog::FilePath::Path(p))) => Ok(Some(p.to_string_lossy().into_owned())), Ok(Some(tauri_plugin_dialog::FilePath::Url(u))) => Ok(Some(u.to_string())), Ok(None) => Ok(None), Err(e) => Err(e.to_string()) } }
#[tauri::command] pub fn settings_get_cache_size(app: AppHandle) -> Result<f64, String> { let d = app.path().app_cache_dir().map_err(|e| e.to_string())?; if d.exists() { Ok((get_size(&d).unwrap_or(0) as f64) / 1048576.0) } else { Ok(0.0) } }
#[tauri::command] pub fn settings_clear_cache(app: AppHandle) -> Result<Value, String> { let d = app.path().app_cache_dir().map_err(|e| e.to_string())?; let mut m = 0.0; if d.exists() { m = (get_size(&d).unwrap_or(0) as f64) / 1048576.0; let _ = fs::remove_dir_all(&d); let _ = fs::create_dir_all(&d); } Ok(json!({"success": true, "freedMB": m})) }
#[tauri::command] pub fn settings_set_auto_start(app: AppHandle, enabled: bool) -> Result<(), String> { let exe = std::env::current_exe().map_err(|e| e.to_string())?; let key = r"HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run"; if enabled { let _ = std::process::Command::new("reg").args(["add", key, "/v", "Morget", "/t", "REG_SZ", "/d", &exe.to_string_lossy(), "/f"]).output(); } else { let _ = std::process::Command::new("reg").args(["delete", key, "/v", "Morget", "/f"]).output(); } let store = app.store("settings.json").map_err(|e| e.to_string())?; let mut s: AppSettings = serde_json::from_value(store.get("app_settings").unwrap_or(json!({}))).unwrap_or_default(); s.auto_start = enabled; store.set("app_settings", serde_json::to_value(s).unwrap()); let _ = store.save(); Ok(()) }
#[tauri::command] pub fn settings_set_close_behavior(app: AppHandle, behavior: String) -> Result<(), String> { let store = app.store("settings.json").map_err(|e| e.to_string())?; let mut s: AppSettings = serde_json::from_value(store.get("app_settings").unwrap_or(json!({}))).unwrap_or_default(); s.close_behavior = behavior; store.set("app_settings", serde_json::to_value(s).unwrap()); let _ = store.save(); Ok(()) }
#[tauri::command] pub fn settings_set_tray_icon(app: AppHandle, enabled: bool) -> Result<(), String> { let store = app.store("settings.json").map_err(|e| e.to_string())?; let mut s: AppSettings = serde_json::from_value(store.get("app_settings").unwrap_or(json!({}))).unwrap_or_default(); s.show_tray_icon = enabled; store.set("app_settings", serde_json::to_value(s).unwrap()); let _ = store.save(); Ok(()) }
#[tauri::command] pub async fn settings_test_notification() -> Result<(), String> { let _ = std::process::Command::new("powershell").args(["-NoProfile", "-Command", "Add-Type -AssemblyName System.Windows.Forms; $n = New-Object System.Windows.Forms.NotifyIcon; $n.Icon = [System.Drawing.SystemIcons]::Information; $n.Visible = $true; $n.ShowBalloonTip(3000, 'Morget', '測試通知', [System.Windows.Forms.ToolTipIcon]::Info)"]).output(); Ok(()) }
#[tauri::command] pub async fn settings_test_sound() -> Result<(), String> { let _ = std::process::Command::new("powershell").args(["-NoProfile", "-Command", "(New-Object Media.SoundPlayer 'C:\\Windows\\Media\\Windows Notify System Generic.wav').PlaySync()"]).output(); Ok(()) }
#[tauri::command] pub fn settings_toggle_fullscreen(app: AppHandle) -> Result<(), String> { if let Some(w) = app.get_webview_window("main") { let f = w.is_fullscreen().map_err(|e| e.to_string())?; w.set_fullscreen(!f).map_err(|e| e.to_string())?; } Ok(()) }
#[tauri::command] pub fn settings_set_window_mode(app: AppHandle, mode: String) -> Result<(), String> { if let Some(w) = app.get_webview_window("main") { w.set_fullscreen(mode == "fullscreen").map_err(|e| e.to_string())?; } let store = app.store("settings.json").map_err(|e| e.to_string())?; let mut s: AppSettings = serde_json::from_value(store.get("app_settings").unwrap_or(json!({}))).unwrap_or_default(); s.window_mode = mode; store.set("app_settings", serde_json::to_value(s).unwrap()); let _ = store.save(); Ok(()) }
#[tauri::command] pub fn settings_check_admin() -> Result<bool, String> { let o = std::process::Command::new("net").arg("session").stdout(std::process::Stdio::null()).stderr(std::process::Stdio::null()).status(); match o { Ok(s) => Ok(s.success()), Err(_) => Ok(false) } }
#[tauri::command] pub fn settings_reset_all(app: AppHandle) -> Result<(), String> { let store = app.store("settings.json").map_err(|e| e.to_string())?; store.set("app_settings", serde_json::to_value(AppSettings::default()).unwrap()); let _ = store.save(); Ok(()) }
#[tauri::command] pub fn settings_factory_reset(app: AppHandle) -> Result<(), String> { let d = app.path().app_data_dir().map_err(|e| e.to_string())?; if d.exists() { let _ = fs::remove_dir_all(&d); } Ok(()) }
