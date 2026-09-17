use serde::{Deserialize, Serialize};
use serde_json::json;

// 必須在編譯時透過環境變量注入真實 URL，否則為空
const WORKER_URL: &str = option_env!("MORGET_WORKER_URL").unwrap_or("");

#[derive(Serialize, Deserialize, Clone)]
pub struct MarketPlugin { pub id: i32, pub name: String, pub description: String, pub author: String, pub views: i32, pub likes: i32, pub downloads: i32, pub versions: Vec<MarketVersion> }
#[derive(Serialize, Deserialize, Clone)]
pub struct MarketVersion { pub id: i32, pub version: String, pub url: String }

fn check_api_configured() -> Result<(), String> {
    if WORKER_URL.is_empty() || WORKER_URL.contains("your-name") {
        return Err("MARKET_NOT_CONFIGURED".to_string());
    }
    Ok(())
}

#[tauri::command]
pub async fn market_search(query: String) -> Result<Vec<MarketPlugin>, String> {
    check_api_configured()?;
    let client = reqwest::Client::builder().timeout(std::time::Duration::from_secs(5)).build().map_err(|e| e.to_string())?;
    let url = format!("{}/api/plugins?q={}", WORKER_URL, urlencoding::encode(&query));
    let res = client.get(&url).send().await.map_err(|e| format!("Network error: {}", e))?;
    if !res.status().is_success() { return Err(format!("API error: {}", res.status())); }
    res.json().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn market_report_view(_plugin_id: i32, duration_sec: i32) -> Result<serde_json::Value, String> {
    check_api_configured()?;
    if duration_sec < 10 { return Ok(json!({"success": true, "g_coins_earned": 0})); }
    // TODO: Phase 5 接入真實 JWT Token 與 Worker 記賬邏輯
    Err("AUTH_REQUIRED".to_string())
}

#[tauri::command]
pub async fn market_download(_plugin_id: i32, _version_id: i32) -> Result<serde_json::Value, String> {
    check_api_configured()?;
    // TODO: Phase 5 接入真實 JWT Token 獲取簽名下載連結
    Err("AUTH_REQUIRED".to_string())
}
