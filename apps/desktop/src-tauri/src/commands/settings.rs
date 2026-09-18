use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tauri::Manager;
use tauri_plugin_store::StoreExt;
use tauri_plugin_dialog::DialogExt;
use std::fs;
use fs_extra::dir::get_size;

#[derive(Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase", default)]
pub struct AppSettings {
    pub language: String, pub auto_update: bool, pub theme: String, pub scale: f64,
    pub loading_mode: String, pub gpu_mode: String, pub fps: i32, pub vsync: bool,
    #[serde(rename = "premiumUI")] // 🐛 修復：強制匹配前端的 premiumUI
    pub premium_ui: bool, 
    pub download_path: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            language: "zh-TW".into(), auto_update: true, theme: "dark".into(), scale: 1.0,
            loading_mode: "stream".into(), gpu_mode: "auto".into(), fps: 60, vsync: false,
            premium_ui: false, download_path: "".into(),
        }
    }
}

#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct AppSettingsPatch {
    pub language: Option<String>, pub auto_update: Option<bool>, pub theme: Option<String>,
    pub scale: Option<f64>, pub loading_mode: Option<String>, pub gpu_mode: Option<String>,
    pub fps: Option<i32>, pub vsync: Option<bool>, 
    #[serde(rename = "premiumUI")] // 🐛 修復：強制匹配前端的 premiumUI
    pub premium_ui: Option<bool>, 
    pub download_path: Option<String>,
}

#[tauri::command]
pub fn settings_get(app: tauri::AppHandle) -> Result<AppSettings, String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    let stored = store.get("app_settings").unwrap_or(json!({}));
    let settings: AppSettings = serde_json::from_value(stored).unwrap_or_default();
    Ok(settings)
}

#[tauri::command]
pub fn settings_set(app: tauri::AppHandle, settings: Value) -> Result<Value, String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    let mut current = settings_get(app.clone())?;
    let patch: AppSettingsPatch = serde_json::from_value(settings).map_err(|e| format!("Invalid format: {}", e))?;
    
    if let Some(v) = patch.language { if !["zh-TW", "zh-CN", "en-US"].contains(&v.as_str()) { return Err("Invalid language".into()); } current.language = v; }
    if let Some(v) = patch.auto_update { current.auto_update = v; }
    if let Some(v) = patch.theme { if !["dark", "light", "system"].contains(&v.as_str()) { return Err("Invalid theme".into()); } current.theme = v; }
    if let Some(v) = patch.scale { if !v.is_finite() || v < 0.5 || v > 2.0 { return Err("scale must be between 0.5 and 2.0".into()); } current.scale = v; }
    if let Some(v) = patch.loading_mode { if !["stream", "full"].contains(&v.as_str()) { return Err("Invalid loading mode".into()); } current.loading_mode = v; }
    if let Some(v) = patch.gpu_mode { if !["auto", "integrated", "dedicated"].contains(&v.as_str()) { return Err("Invalid gpu mode".into()); } current.gpu_mode = v; }
    if let Some(v) = patch.fps { if v < 0 || v > 300 { return Err("fps must be between 0 and 300".into()); } current.fps = v; }
    if let Some(v) = patch.vsync { current.vsync = v; }
    if let Some(v) = patch.premium_ui { current.premium_ui = v; } // 這裡會正確接收前端的 premiumUI
    if let Some(v) = patch.download_path { current.download_path = v; }

    store.set("app_settings", serde_json::to_value(current).unwrap());
    let _ = store.save();
    Ok(json!({"success": true}))
}

#[tauri::command]
pub async fn settings_select_directory(app: tauri::AppHandle) -> Result<Option<String>, String> {
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
pub async fn settings_pick_plugin_file(app: tauri::AppHandle) -> Result<Option<String>, String> {
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
pub fn settings_get_cache_size(app: tauri::AppHandle) -> Result<f64, String> {
    let cache_dir = app.path().app_cache_dir().map_err(|e| e.to_string())?;
    if cache_dir.exists() { Ok((get_size(&cache_dir).unwrap_or(0) as f64) / (1024.0 * 1024.0)) } else { Ok(0.0) }
}

#[tauri::command]
pub fn settings_clear_cache(app: tauri::AppHandle) -> Result<Value, String> {
    let cache_dir = app.path().app_cache_dir().map_err(|e| e.to_string())?;
    let mut freed_mb = 0.0;
    if cache_dir.exists() {
        freed_mb = (get_size(&cache_dir).unwrap_or(0) as f64) / (1024.0 * 1024.0);
        let _ = fs::remove_dir_all(&cache_dir);
        let _ = fs::create_dir_all(&cache_dir);
    }
    Ok(json!({"success": true, "freedMB": freed_mb}))
}
