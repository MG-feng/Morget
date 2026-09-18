use serde::{Deserialize, Serialize};
use std::fs;
use tauri::{AppHandle, Manager}; // ✅ 修復：加入 Manager trait

#[derive(Serialize, Deserialize, Clone)]
pub struct FrontendConfig {
    pub active: String,
    pub premium_enabled: bool,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct FrontendManifest {
    pub id: String,
    pub name: String,
    pub author: String,
    pub version: String,
    pub description: String,
    pub has_premium: bool,
}

impl Default for FrontendConfig {
    fn default() -> Self {
        Self { active: "default".into(), premium_enabled: false }
    }
}

#[tauri::command]
pub fn frontend_get_config(app: AppHandle) -> Result<FrontendConfig, String> {
    let config_path = app.path().app_data_dir().map_err(|e| e.to_string())?.join("frontends").join("config.json");
    if !config_path.exists() {
        return Ok(FrontendConfig::default());
    }
    let content = fs::read_to_string(&config_path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn frontend_set_config(app: AppHandle, config: FrontendConfig) -> Result<(), String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?.join("frontends");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let config_path = dir.join("config.json");
    let json = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    fs::write(&config_path, json).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn frontend_list(app: AppHandle) -> Result<Vec<FrontendManifest>, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?.join("frontends");
    let mut result = vec![FrontendManifest {
        id: "default".into(),
        name: "Morget Default".into(),
        author: "Morget Team".into(),
        version: "1.0.0".into(),
        description: "CurseForge 風格黑藍主題".into(),
        has_premium: true,
    }];

    if dir.exists() {
        if let Ok(entries) = fs::read_dir(&dir) {
            for entry in entries.flatten() {
                let manifest_path = entry.path().join("manifest.json");
                if manifest_path.exists() {
                    if let Ok(content) = fs::read_to_string(&manifest_path) {
                        if let Ok(manifest) = serde_json::from_str::<FrontendManifest>(&content) {
                            if manifest.id != "default" {
                                result.push(manifest);
                            }
                        }
                    }
                }
            }
        }
    }
    Ok(result)
}
