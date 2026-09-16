use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Serialize, Deserialize, Clone)]
pub struct GitHubRepo { pub name: String, pub full_name: String }

#[tauri::command]
pub async fn github_auth() -> Result<serde_json::Value, String> {
    // Mock: 模擬 GitHub OAuth 授權成功
    Ok(json!({"success": true, "username": "MockUser", "token": "mock_github_token_123"}))
}

#[tauri::command]
pub async fn github_get_repos() -> Result<Vec<GitHubRepo>, String> {
    // Mock: 返回模擬的倉庫列表
    Ok(vec![GitHubRepo { name: "my-morget-plugin".into(), full_name: "MockUser/my-morget-plugin".into() }])
}

#[tauri::command]
pub async fn github_upload_plugin(repo_name: String, version: String, file_path: String) -> Result<serde_json::Value, String> {
    // Mock: 模擬上傳成功並創建 Release
    Ok(json!({"success": true, "message": format!("Mock: Uploaded v{} to {}", version, repo_name), "release_url": "https://github.com/mock/release/1"}))
}
