use crate::core::plugin_manager::{PluginInfo, PluginManager, PluginStateStore};
use serde_json::json;
use tauri::State;
use tauri_plugin_store::StoreExt;

pub struct AppState { pub plugin_manager: std::sync::Mutex<PluginManager> }

struct TauriStoreAdapter<'a> { store: &'a tauri_plugin_store::Store<tauri::Wry> }

impl<'a> PluginStateStore for TauriStoreAdapter<'a> {
    fn get_bool(&self, key: &str) -> Option<bool> { self.store.get(key).and_then(|v| v.as_bool()) }
    fn set_bool(&self, key: &str, value: bool) { let _ = self.store.set(key, serde_json::Value::Bool(value)); }
    fn delete(&self, key: &str) { let _ = self.store.delete(key); }
    fn save(&self) -> Result<(), String> { self.store.save().map_err(|e| e.to_string()) }
}

#[tauri::command]
pub fn plugin_list(state: State<AppState>, app: tauri::AppHandle) -> Result<Vec<PluginInfo>, String> {
    let manager = state.plugin_manager.lock().map_err(|_| "Lock error".to_string())?;
    let store = app.store("plugins_state.json").map_err(|e| e.to_string())?;
    let adapter = TauriStoreAdapter { store: &*store };
    manager.scan_plugins(&adapter)
}

#[tauri::command]
pub fn plugin_install(state: State<AppState>, path: String) -> Result<serde_json::Value, String> {
    let manager = state.plugin_manager.lock().map_err(|_| "Lock error".to_string())?;
    match manager.install_plugin(&path) {
        Ok(id) => Ok(json!({"success": true, "pluginId": id})),
        Err(e) => Ok(json!({"success": false, "error": e})),
    }
}

#[tauri::command]
pub fn plugin_uninstall(state: State<AppState>, app: tauri::AppHandle, plugin_id: String) -> Result<serde_json::Value, String> {
    let manager = state.plugin_manager.lock().map_err(|_| "Lock error".to_string())?;
    let store = app.store("plugins_state.json").map_err(|e| e.to_string())?;
    let adapter = TauriStoreAdapter { store: &*store };
    match manager.uninstall_plugin(&plugin_id, &adapter) {
        Ok(_) => Ok(json!({"success": true})),
        Err(e) => Ok(json!({"success": false, "error": e})),
    }
}

#[tauri::command]
pub fn plugin_toggle(state: State<AppState>, app: tauri::AppHandle, plugin_id: String, enabled: bool) -> Result<serde_json::Value, String> {
    let manager = state.plugin_manager.lock().map_err(|_| "Lock error".to_string())?;
    if !manager.plugin_exists(&plugin_id) { return Ok(json!({"success": false, "error": "Plugin not found"})); }
    let store = app.store("plugins_state.json").map_err(|e| e.to_string())?;
    let _ = store.set(&plugin_id, serde_json::Value::Bool(enabled));
    let _ = store.save();
    Ok(json!({"success": true}))
}