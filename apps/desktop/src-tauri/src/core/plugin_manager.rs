use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::Read;
use std::path::{Path, PathBuf};
use zip::ZipArchive;
use zip::write::FileOptions;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "UPPERCASE")]
pub enum PluginKind {
    MGPN,
    MGP,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginInfo {
    pub id: String,
    pub name: String,
    pub version: String,
    pub kind: PluginKind,
    pub description: String,
    pub path: String,
    pub is_enabled: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Manifest {
    id: String,
    name: String,
    version: String,
    kind: PluginKind,
    description: String,
}

pub trait PluginStateStore {
    fn get_bool(&self, key: &str) -> Option<bool>;
    fn set_bool(&self, key: &str, value: bool);
    fn delete(&self, key: &str);
    fn save(&self) -> Result<(), String>;
}

pub struct PluginManager {
    plugins_dir: PathBuf,
}

impl PluginManager {
    pub fn new(app_data_dir: PathBuf) -> Self {
        let plugins_dir = app_data_dir.join("plugins");
        if !plugins_dir.exists() {
            let _ = fs::create_dir_all(&plugins_dir);
        }
        Self { plugins_dir }
    }

    pub fn install_plugin(&self, source_path: &str) -> Result<(String, String), String> {
        let path = Path::new(source_path);
        if !path.is_file() {
            return Err("來源路徑無效或不是文件".to_string());
        }

        let ext = path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();
        let expected_kind = match ext.as_str() {
            "mgpn" => PluginKind::MGPN,
            "mgp" => PluginKind::MGP,
            _ => return Err("僅支援 .MGPN 或 .MGP 格式的插件包".to_string()),
        };

        let file = File::open(path).map_err(|e| e.to_string())?;
        let mut archive = ZipArchive::new(file).map_err(|e| e.to_string())?;

        let mut manifest_buf = Vec::new();
        let mut manifest_file = archive
            .by_name("manifest.json")
            .map_err(|_| "插件包內缺少 manifest.json".to_string())?;
        manifest_file
            .read_to_end(&mut manifest_buf)
            .map_err(|e| e.to_string())?;

        let manifest: Manifest =
            serde_json::from_slice(&manifest_buf).map_err(|e| format!("manifest.json 格式無效: {}", e))?;

        if manifest.kind != expected_kind {
            return Err(format!(
                "文件擴展名 .{} 與 manifest 中的 kind {:?} 不匹配",
                ext, manifest.kind
            ));
        }

        if manifest.id.is_empty()
            || !manifest
                .id
                .chars()
                .all(|c| c.is_alphanumeric() || c == '-' || c == '_')
        {
            return Err("無效的插件 ID，僅允許字母、數字、- 和 _".to_string());
        }

        let target_path = self.plugins_dir.join(format!("{}.{}", manifest.id, ext));
        fs::copy(path, &target_path).map_err(|e| format!("複製文件失敗: {}", e))?;

        Ok((manifest.id, manifest.name))
    }

    pub fn plugin_exists(&self, plugin_id: &str) -> bool {
        if !plugin_id
            .chars()
            .all(|c| c.is_alphanumeric() || c == '-' || c == '_')
        {
            return false;
        }
        self.plugins_dir.join(format!("{}.mgpn", plugin_id)).exists()
            || self.plugins_dir.join(format!("{}.mgp", plugin_id)).exists()
    }

    pub fn scan_plugins(&self, store: &dyn PluginStateStore) -> Result<Vec<PluginInfo>, String> {
        let mut plugins = Vec::new();
        let entries = fs::read_dir(&self.plugins_dir).map_err(|e| e.to_string())?;

        for entry in entries {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();

            if path.is_file() {
                let ext = path
                    .extension()
                    .and_then(|e| e.to_str())
                    .unwrap_or("")
                    .to_lowercase();
                if ext == "mgpn" || ext == "mgp" {
                    if let Ok(info) = self.read_manifest_from_zip(&path) {
                        let is_enabled = store.get_bool(&info.id).unwrap_or(true);
                        plugins.push(PluginInfo {
                            id: info.id,
                            name: info.name,
                            version: info.version,
                            kind: info.kind,
                            description: info.description,
                            path: path.to_string_lossy().to_string(),
                            is_enabled,
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
        let mut manifest_file = archive
            .by_name("manifest.json")
            .map_err(|_| "缺少 manifest.json".to_string())?;
        let mut buf = Vec::new();
        manifest_file
            .read_to_end(&mut buf)
            .map_err(|e| e.to_string())?;
        serde_json::from_slice(&buf).map_err(|e| format!("解析 manifest 失敗: {}", e))
    }

    pub fn uninstall_plugin(
        &self,
        plugin_id: &str,
        store: &dyn PluginStateStore,
    ) -> Result<(), String> {
        if !self.plugin_exists(plugin_id) {
            return Err("未找到對應的插件文件".to_string());
        }

        let path_mgpn = self.plugins_dir.join(format!("{}.mgpn", plugin_id));
        let path_mgp = self.plugins_dir.join(format!("{}.mgp", plugin_id));

        if path_mgpn.exists() {
            fs::remove_file(path_mgpn).map_err(|e| e.to_string())?;
        }
        if path_mgp.exists() {
            fs::remove_file(path_mgp).map_err(|e| e.to_string())?;
        }

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
    use std::io::Write;

    struct MockStore {
        data: Mutex<HashMap<String, bool>>,
    }

    impl MockStore {
        fn new() -> Self {
            Self {
                data: Mutex::new(HashMap::new()),
            }
        }
    }

    impl PluginStateStore for MockStore {
        fn get_bool(&self, key: &str) -> Option<bool> {
            self.data.lock().unwrap().get(key).copied()
        }
        fn set_bool(&self, key: &str, value: bool) {
            self.data
                .lock()
                .unwrap()
                .insert(key.to_string(), value);
        }
        fn delete(&self, key: &str) {
            self.data.lock().unwrap().remove(key);
        }
        fn save(&self) -> Result<(), String> {
            Ok(())
        }
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
    fn test_full_plugin_lifecycle_with_store_cleanup() {
        let temp_dir = tempfile::tempdir().unwrap();
        let manager = PluginManager::new(temp_dir.path().to_path_buf());
        let mock_store = MockStore::new();

        let valid_zip = temp_dir.path().join("valid.mgpn");
        create_test_zip(
            &valid_zip,
            r#"{"id":"test-plugin","name":"Test","version":"1.0.0","kind":"MGPN","description":"Test"}"#,
        );

        let result = manager.install_plugin(valid_zip.to_str().unwrap());
        assert!(
            result.is_ok(),
            "合法插件應安裝成功: {:?}",
            result.err()
        );
        assert!(manager.plugin_exists("test-plugin"));

        mock_store.set_bool("test-plugin", false);
        assert_eq!(mock_store.get_bool("test-plugin"), Some(false));

        let uninstall_result = manager.uninstall_plugin("test-plugin", &mock_store);
        assert!(uninstall_result.is_ok());
        assert!(!manager.plugin_exists("test-plugin"));
        assert!(mock_store.get_bool("test-plugin").is_none());
    }

    #[test]
    fn test_security_boundaries_enforcement() {
        let temp_dir = tempfile::tempdir().unwrap();
        let manager = PluginManager::new(temp_dir.path().to_path_buf());

        let traversal_zip = temp_dir.path().join("traversal.mgpn");
        create_test_zip(
            &traversal_zip,
            r#"{"id":"../../etc/passwd","name":"Hack","version":"1.0","kind":"MGPN","description":"x"}"#,
        );
        let result = manager.install_plugin(traversal_zip.to_str().unwrap());
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("無效的插件 ID"));

        let mismatch_zip = temp_dir.path().join("mismatch.mgp");
        create_test_zip(
            &mismatch_zip,
            r#"{"id":"bad-plugin","name":"Bad","version":"1.0","kind":"MGPN","description":"x"}"#,
        );
        let result = manager.install_plugin(mismatch_zip.to_str().unwrap());
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("不匹配"));
    }
}
