use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tauri::{AppHandle, Manager};
use tauri_plugin_store::StoreExt;
use tauri_plugin_dialog::DialogExt;
use std::fs;
use fs_extra::dir::get_size;

// ✅ 精準匹配您當前前端 AppSettings 的 5 個基礎字段
#[derive(Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase", default)]
pub struct AppSettings {
    pub language: String,
    pub theme: String,
    pub scale: f64,
    pub download_path: String,
    pub auto_update: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            language: "zh-TW".into(),
            theme: "dark".into(),
            scale: 1.0,
            download_path: "".into(),
            auto_update: true,
        }
    }
}

#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct AppSettingsPatch {
    pub language: Option<String>,
    pub theme: Option<String>,
    pub scale: Option<f64>,
    pub download_path: Option<String>,
    pub auto_update: Option<bool>,
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
    if let Some(v) = patch.theme { current.theme = v; }
    if let Some(v) = patch.scale { current.scale = v; }
    if let Some(v) = patch.download_path { current.download_path = v; }
    if let Some(v) = patch.auto_update { current.auto_update = v; }

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
