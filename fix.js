const fs = require('fs');
const path = require('path');

const files = {
  'apps/desktop/src-tauri/src/core/plugin_manager.rs': `use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use zip::ZipArchive;
use zip::write::FileOptions;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "UPPERCASE")]
pub enum PluginKind { MGPN, MGP }

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginInfo {
    pub id: String, pub name: String, pub version: String,
    pub kind: PluginKind, pub description: String, pub path: String, pub is_enabled: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Manifest {
    id: String, name: String, version: String, kind: PluginKind, description: String,
}

pub trait PluginStateStore {
    fn get_bool(&self, key: &str) -> Option<bool>;
    fn set_bool(&self, key: &str, value: bool);
    fn delete(&self, key: &str);
    fn save(&self) -> Result<(), String>;
}

pub struct PluginManager { plugins_dir: PathBuf }

impl PluginManager {
    pub fn new(app_data_dir: PathBuf) -> Self {
        let plugins_dir = app_data_dir.join("plugins");
        if !plugins_dir.exists() { let _ = fs::create_dir_all(&plugins_dir); }
        Self { plugins_dir }
    }

    pub fn install_plugin(&self, source_path: &str) -> Result<String, String> {
        let path = Path::new(source_path);
        if !path.is_file() { return Err("Invalid path".to_string()); }
        let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();
        let expected_kind = match ext.as_str() {
            "mgpn" => PluginKind::MGPN, "mgp" => PluginKind::MGP,
            _ => return Err("Unsupported format".to_string()),
        };
        let file = File::open(path).map_err(|e| e.to_string())?;
        let mut archive = ZipArchive::new(file).map_err(|e| e.to_string())?;
        let mut manifest_buf = Vec::new();
        let mut manifest_file = archive.by_name("manifest.json").map_err(|_| "Missing manifest.json".to_string())?;
        manifest_file.read_to_end(&mut manifest_buf).map_err(|e| e.to_string())?;
        let manifest: Manifest = serde_json::from_slice(&manifest_buf).map_err(|e| e.to_string())?;
        if manifest.kind != expected_kind { return Err("Kind mismatch".to_string()); }
        if manifest.id.is_empty() || !manifest.id.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_') {
            return Err("Invalid ID".to_string());
        }
        let target_path = self.plugins_dir.join(format!("{}.{}", manifest.id, ext));
        let canonical_plugins_dir = self.plugins_dir.canonicalize().unwrap_or_else(|_| self.plugins_dir.clone());
        fs::copy(path, &target_path).map_err(|e| e.to_string())?;
        let canonical_target = target_path.canonicalize().unwrap_or_else(|_| target_path.clone());
        if !canonical_target.starts_with(&canonical_plugins_dir) {
            let _ = fs::remove_file(&target_path);
            return Err("Path traversal detected".to_string());
        }
        Ok(manifest.id)
    }

    pub fn plugin_exists(&self, plugin_id: &str) -> bool {
        if !plugin_id.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_') { return false; }
        self.plugins_dir.join(format!("{}.mgpn", plugin_id)).exists() || self.plugins_dir.join(format!("{}.mgp", plugin_id)).exists()
    }

    pub fn scan_plugins(&self, store: &dyn PluginStateStore) -> Result<Vec<PluginInfo>, String> {
        let mut plugins = Vec::new();
        let entries = fs::read_dir(&self.plugins_dir).map_err(|e| e.to_string())?;
        for entry in entries {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();
            if path.is_file() {
                let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();
                if ext == "mgpn" || ext == "mgp" {
                    if let Ok(info) = self.read_manifest_from_zip(&path) {
                        let is_enabled = store.get_bool(&info.id).unwrap_or(true);
                        plugins.push(PluginInfo {
                            id: info.id, name: info.name, version: info.version, kind: info.kind,
                            description: info.description, path: path.to_string_lossy().to_string(), is_enabled,
                        });
                    }
                }
            }
        }
        Ok(plugins)
    }

    fn read_manifest_from_zip(&self, path: &Path) -> Result<Manifest, String> {
        let file = File::open(path).map_err(|e| e.to_string())?;
        let mut archive = ZipArchive::new(file).map_err(|e| e.to_string())?;
        let mut manifest_file = archive.by_name("manifest.json").map_err(|_| "Missing manifest.json".to_string())?;
        let mut buf = Vec::new();
        manifest_file.read_to_end(&mut buf).map_err(|e| e.to_string())?;
        serde_json::from_slice(&buf).map_err(|e| e.to_string())
    }

    pub fn uninstall_plugin(&self, plugin_id: &str, store: &dyn PluginStateStore) -> Result<(), String> {
        if !self.plugin_exists(plugin_id) { return Err("Not found".to_string()); }
        let path_mgpn = self.plugins_dir.join(format!("{}.mgpn", plugin_id));
        let path_mgp = self.plugins_dir.join(format!("{}.mgp", plugin_id));
        if path_mgpn.exists() { fs::remove_file(path_mgpn).map_err(|e| e.to_string())?; }
        if path_mgp.exists() { fs::remove_file(path_mgp).map_err(|e| e.to_string())?; }
        store.delete(plugin_id);
        store.save()?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;
    use std::sync::Mutex;

    struct MockStore { data: Mutex<HashMap<String, bool>> }
    impl MockStore { fn new() -> Self { Self { data: Mutex::new(HashMap::new()) } } }
    impl PluginStateStore for MockStore {
        fn get_bool(&self, key: &str) -> Option<bool> { self.data.lock().unwrap().get(key).copied() }
        fn set_bool(&self, key: &str, value: bool) { self.data.lock().unwrap().insert(key.to_string(), value); }
        fn delete(&self, key: &str) { self.data.lock().unwrap().remove(key); }
        fn save(&self) -> Result<(), String> { Ok(()) }
    }

    fn create_test_zip(path: &Path, manifest_content: &str) {
        let file = File::create(path).unwrap();
        let mut zip = zip::ZipWriter::new(file);
        let options = FileOptions::default().compression_method(zip::CompressionMethod::Stored);
        zip.start_file("manifest.json", options).unwrap();
        zip.write_all(manifest_content.as_bytes()).unwrap();
        zip.finish().unwrap();
    }

    #[test]
    fn test_full_plugin_lifecycle() {
        let temp_dir = tempfile::tempdir().unwrap();
        let manager = PluginManager::new(temp_dir.path().to_path_buf());
        let mock_store = MockStore::new();
        let valid_zip = temp_dir.path().join("valid.mgpn");
        create_test_zip(&valid_zip, r#"{"id":"test-plugin","name":"Test","version":"1.0.0","kind":"MGPN","description":"Test"}"#);
        assert!(manager.install_plugin(valid_zip.to_str().unwrap()).is_ok());
        assert!(manager.plugin_exists("test-plugin"));
        mock_store.set_bool("test-plugin", false);
        assert!(manager.uninstall_plugin("test-plugin", &mock_store).is_ok());
        assert!(!manager.plugin_exists("test-plugin"));
    }

    #[test]
    fn test_security_boundaries() {
        let temp_dir = tempfile::tempdir().unwrap();
        let manager = PluginManager::new(temp_dir.path().to_path_buf());
        let traversal_zip = temp_dir.path().join("traversal.mgpn");
        create_test_zip(&traversal_zip, r#"{"id":"../../etc/passwd","name":"Hack","version":"1.0","kind":"MGPN","description":"x"}"#);
        assert!(manager.install_plugin(traversal_zip.to_str().unwrap()).unwrap_err().contains("Invalid ID"));
    }
}`,

  'apps/desktop/src-tauri/src/commands/plugin.rs': `use crate::core::plugin_manager::{PluginInfo, PluginManager, PluginStateStore};
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
}`,

  'apps/desktop/src-tauri/capabilities/main.json': `{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "description": "Morget core permissions",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "store:default",
    "dialog:default"
  ]
}`,

  'apps/desktop/vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: { port: 1420, strictPort: true },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: 'esnext',
    minify: 'esbuild',
  },
});`
};

for (const [p, c] of Object.entries(files)) {
  const full = path.join(__dirname, p);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, c, 'utf8');
  console.log('Fixed:', p);
}
console.log('Done! Now run: git add . && git commit -m "fix" && git push');