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
    pub language: String, pub auto_update: String, pub plugin_auto_update: String,
    pub auto_start: bool, pub delayed_start: bool, pub close_behavior: String,
    pub show_tray_icon: bool, pub desktop_notifications: bool, pub sound_notifications: bool,
    pub theme: String, pub scale: f64, pub fps_limit: i32, pub vsync: bool,
    pub window_mode: String, pub custom_font: String, pub font_size: i32,
    #[serde(rename = "premiumUI")] pub premium_ui: bool, pub frontend_pack: String,
    pub hotkey_fullscreen: String,
    pub admin_mode: bool, pub proxy_mode: String, pub proxy_url: String,
    pub network_timeout: i32, pub network_limit: String,
    pub hardware_render: String, pub adaptive_fps: bool, pub cpu_prerender_frames: i32,
    pub log_enabled: bool, pub log_max_size_mb: i32,
    pub download_path: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            language: "zh-TW".into(), auto_update: "prompt".into(), plugin_auto_update: "prompt".into(),
            auto_start: false, delayed_start: false, close_behavior: "exit".into(),
            show_tray_icon: true, desktop_notifications: true, sound_notifications: false,
            theme: "dark".into(), scale: 1.0, fps_limit: 60, vsync: false,
            window_mode: "window".into(), custom_font: "".into(), font_size: 14,
            premium_ui: false, frontend_pack: "default".into(),
            hotkey_fullscreen: "F11".into(),
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
    pub language: Option<String>, pub auto_update: Option<String>, pub plugin_auto_update: Option<String>,
    pub auto_start: Option<bool>, pub delayed_start: Option<bool>, pub close_behavior: Option<String>,
    pub show_tray_icon: Option<bool>, pub desktop_notifications: Option<bool>, pub sound_notifications: Option<bool>,
    pub theme: Option<String>, pub scale: Option<f64>, pub fps_limit: Option<i32>, pub vsync: Option<bool>,
    pub window_mode: Option<String>, pub custom_font: Option<String>, pub font_size: Option<i32>,
    #[serde(rename = "premiumUI")] pub premium_ui: Option<bool>, pub frontend_pack: Option<String>,
    pub hotkey_fullscreen: Option<String>,
    pub admin_mode: Option<bool>, pub proxy_mode: Option<String>, pub proxy_url: Option<String>,
    pub network_timeout: Option<i32>, pub network_limit: Option<String>,
    pub hardware_render: Option<String>, pub adaptive_fps: Option<bool>, pub cpu_prerender_frames: Option<i32>,
    pub log_enabled: Option<bool>, pub log_max_size_mb: Option<i32>,
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
    let patch: AppSettingsPatch = serde_json::from_value(settings).map_err(|e| format!("Invalid format: {}", e))?;
    
    if let Some(v) = patch.language { current.language = v; }
    if let Some(v) = patch.auto_update { current.auto_update = v; }
    if let Some(v) = patch.plugin_auto_update { current.plugin_auto_update = v; }
    if let Some(v) = patch.auto_start { current.auto_start = v; }
    if let Some(v) = patch.delayed_start { current.delayed_start = v; }
    if let Some(v) = patch.close_behavior { current.close_behavior = v; }
    if let Some(v) = patch.show_tray_icon { current.show_tray_icon = v; }
    if let Some(v) = patch.desktop_notifications { current.desktop_notifications = v; }
    if let Some(v) = patch.sound_notifications { current.sound_notifications = v; }
    if let Some(v) = patch.theme { current.theme = v; }
    if let Some(v) = patch.scale { current.scale = v; }
    if let Some(v) = patch.fps_limit { current.fps_limit = v; }
    if let Some(v) = patch.vsync { current.vsync = v; }
    if let Some(v) = patch.window_mode { current.window_mode = v; }
    if let Some(v) = patch.custom_font { current.custom_font = v; }
    if let Some(v) = patch.font_size { current.font_size = v; }
    if let Some(v) = patch.premium_ui { current.premium_ui = v; }
    if let Some(v) = patch.frontend_pack { current.frontend_pack = v; }
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

#[tauri::command]
pub async fn settings_select_directory(app: AppHandle) -> Result<Option<String>, String> {
    let (tx, rx) = tokio::sync::oneshot::channel();
    app.dialog().file().pick_folder(move |result| { let _ = tx.send(result); });
    match rx.await {
        Ok(Some(tauri_plugin_dialog::FilePath::Path(p))) => Ok(Some(p.to_string_lossy().into_owned())),
        Ok(Some(tauri_plugin_dialog::FilePath::Url(u))) => Ok(Some(u.to_string())), // ✅ 修復 E0004
        Ok(None) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

// ✅ 修復 E0433: 補齊缺失的 settings_pick_plugin_file 函數
#[tauri::command]
pub async fn settings_pick_plugin_file(app: AppHandle) -> Result<Option<String>, String> {
    let (tx, rx) = tokio::sync::oneshot::channel();
    app.dialog().file().add_filter("Morget Plugin", &["mgpn", "mgp"]).pick_file(move |result| { let _ = tx.send(result); });
    match rx.await {
        Ok(Some(tauri_plugin_dialog::FilePath::Path(p))) => Ok(Some(p.to_string_lossy().into_owned())),
        Ok(Some(tauri_plugin_dialog::FilePath::Url(u))) => Ok(Some(u.to_string())), // ✅ 修復 E0004
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

#[tauri::command]
pub async fn check_admin_privileges() -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        let status = std::process::Command::new("net").arg("session").stdout(std::process::Stdio::null()).stderr(std::process::Stdio::null()).status();
        match status {
            Ok(s) => Ok(s.success()),
            Err(_) => Ok(false),
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(false)
    }
}

#[tauri::command]
pub fn reset_all_data(app: AppHandle) -> Result<(), String> {
    let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    if data_dir.exists() {
        let _ = fs::remove_dir_all(&data_dir);
    }
    Ok(())
}
