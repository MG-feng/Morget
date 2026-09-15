use crate::core::plugin_manager::{PluginInfo, PluginManager, PluginStateStore};
use serde_json::json;
use tauri::State;
use tauri_plugin_store::StoreExt;
use tauri_plugin_dialog::DialogExt;

pub struct AppState {
    pub plugin_manager: std::sync::Mutex<PluginManager>,
}

struct TauriStoreAdapter<'a> {
    store: &'a tauri_plugin_store::Store<tauri::Wry>,
}

impl<'a> PluginStateStore for TauriStoreAdapter<'a> {
    fn get_bool(&self, key: &str) -> Option<bool> {
        self.store.get(key).and_then(|v| v.as_bool())
    }
    fn set_bool(&self, key: &str, value: bool) {
        let _ = self.store.set(key, serde_json::Value::Bool(value));
    }
    fn delete(&self, key: &str) {
        let _ = self.store.delete(key);
    }
    fn save(&self) -> Result<(), String> {
        self.store.save().map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub fn plugin_list(
    state: State<AppState>,
    app: tauri::AppHandle,
) -> Result<Vec<PluginInfo>, String> {
    let manager = state.plugin_manager.lock().map_err(|_| "Lock error".to_string())?;
    let store = app.store("plugins_state.json").map_err(|e| e.to_string())?;
    let adapter = TauriStoreAdapter { store: &*store };
    manager.scan_plugins(&adapter)
}

#[tauri::command]
pub async fn plugin_install_via_dialog(
    state: State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let (tx, rx) = tokio::sync::oneshot::channel();
    app.dialog()
        .file()
        .add_filter("Morget Plugin", &["mgpn", "mgp"])
        .pick_file(move |result| {
            let _ = tx.send(result);
        });

    let file_path = match rx.await {
        Ok(Some(tauri_plugin_dialog::FilePath::Path(p))) => p,
        Ok(Some(tauri_plugin_dialog::FilePath::Url(_))) => return Err("URL not supported".to_string()),
        Ok(None) => return Ok(json!({"success": false, "cancelled": true})),
        Err(e) => return Err(e.to_string()),
    };

    let path_str = file_path.to_string_lossy().to_string();
    let manager = state.plugin_manager.lock().map_err(|_| "Lock error".to_string())?;
    
    match manager.install_plugin(&path_str) {
        Ok((id, name)) => Ok(json!({
            "success": true,
            "pluginId": id,
            "pluginName": name
        })),
        Err(e) => Ok(json!({"success": false, "error": e})),
    }
}

#[tauri::command]
pub fn plugin_uninstall(
    state: State<AppState>,
    app: tauri::AppHandle,
    plugin_id: String,
) -> Result<serde_json::Value, String> {
    let manager = state.plugin_manager.lock().map_err(|_| "Lock error".to_string())?;
    let store = app.store("plugins_state.json").map_err(|e| e.to_string())?;
    let adapter = TauriStoreAdapter { store: &*store };
    match manager.uninstall_plugin(&plugin_id, &adapter) {
        Ok(_) => Ok(json!({"success": true})),
        Err(e) => Ok(json!({"success": false, "error": e})),
    }
}

#[tauri::command]
pub fn plugin_toggle(
    state: State<AppState>,
    app: tauri::AppHandle,
    plugin_id: String,
    enabled: bool,
) -> Result<serde_json::Value, String> {
    let manager = state.plugin_manager.lock().map_err(|_| "Lock error".to_string())?;
    if !manager.plugin_exists(&plugin_id) {
        return Ok(json!({"success": false, "error": "Plugin not found"}));
    }
    let store = app.store("plugins_state.json").map_err(|e| e.to_string())?;
    let adapter = TauriStoreAdapter { store: &*store };
    adapter.set_bool(&plugin_id, enabled);
    adapter.save()?;
    Ok(json!({"success": true}))
}
