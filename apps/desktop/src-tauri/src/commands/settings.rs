use serde_json::{json, Value};
use tauri::Manager;
use tauri_plugin_store::StoreExt;
use tauri_plugin_dialog::DialogExt;
use std::fs;
use fs_extra::dir::get_size;

#[tauri::command]
pub fn settings_get(app: tauri::AppHandle) -> Result<Value, String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    let settings = store.get("app_settings").unwrap_or_else(|| {
        json!({ "language": "zh-TW", "theme": "dark", "scale": 1.0, "downloadPath": "", "autoUpdate": true })
    });
    Ok(settings)
}

#[tauri::command]
pub fn settings_set(app: tauri::AppHandle, settings: Value) -> Result<Value, String> {
    let store = app.store("settings.json").map_err(|e| e.to_string())?;
    let mut current = store.get("app_settings").unwrap_or_else(|| Value::Object(serde_json::Map::new()));
    if let Some(current_obj) = current.as_object_mut() {
        if let Some(new_obj) = settings.as_object() {
            for (k, v) in new_obj { current_obj.insert(k.clone(), v.clone()); }
        }
    } else { current = settings; }
    store.set("app_settings", current);
    let _ = store.save();
    Ok(json!({"success": true}))
}

#[tauri::command]
pub async fn settings_select_directory(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let path = app.dialog().file().blocking_pick_folder();
    Ok(path.map(|p| p.path.to_string_lossy().to_string()))
}

#[tauri::command]
pub fn settings_get_cache_size(app: tauri::AppHandle) -> Result<f64, String> {
    let cache_dir = app.path().app_cache_dir().map_err(|e| e.to_string())?;
    if cache_dir.exists() {
        let size = get_size(&cache_dir).unwrap_or(0);
        Ok((size as f64) / (1024.0 * 1024.0))
    } else { Ok(0.0) }
}

#[tauri::command]
pub fn settings_clear_cache(app: tauri::AppHandle) -> Result<Value, String> {
    let cache_dir = app.path().app_cache_dir().map_err(|e| e.to_string())?;
    let mut freed_mb = 0.0;
    if cache_dir.exists() {
        let size = get_size(&cache_dir).unwrap_or(0);
        freed_mb = (size as f64) / (1024.0 * 1024.0);
        let _ = fs::remove_dir_all(&cache_dir);
        let _ = fs::create_dir_all(&cache_dir);
    }
    Ok(json!({"success": true, "freedMB": freed_mb}))
}