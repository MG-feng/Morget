use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct GitHubRepo { pub name: String, pub full_name: String }

#[tauri::command]
pub async fn github_auth() -> Result<serde_json::Value, String> {
    Err("GITHUB_OAUTH_NOT_IMPLEMENTED".to_string())
}

#[tauri::command]
pub async fn github_get_repos() -> Result<Vec<GitHubRepo>, String> {
    Err("AUTH_REQUIRED".to_string())
}

#[tauri::command]
pub async fn github_upload_plugin(_repo_name: String, _version: String, _file_path: String) -> Result<serde_json::Value, String> {
    Err("AUTH_REQUIRED".to_string())
}
