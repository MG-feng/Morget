use serde::{Deserialize, Serialize};
use serde_json::json;

const WORKER_URL: &str = "https://morget-market.your-name.workers.dev"; 

#[derive(Serialize, Deserialize, Clone)]
pub struct MarketPlugin { pub id: i32, pub name: String, pub description: String, pub author: String, pub views: i32, pub likes: i32, pub downloads: i32, pub versions: Vec<MarketVersion> }
#[derive(Serialize, Deserialize, Clone)]
pub struct MarketVersion { pub id: i32, pub version: String, pub url: String }

fn get_mock_plugins() -> Vec<MarketPlugin> {
    vec![
        MarketPlugin { id: 1, name: "SuperMinimap".into(), description: "極致效能的小地圖 (Mock)".into(), author: "DevMaster".into(), views: 1204, likes: 342, downloads: 89, versions: vec![MarketVersion { id: 101, version: "1.0.0".into(), url: "mock://superminimap.mgpn".into() }] },
        MarketPlugin { id: 2, name: "AutoSort".into(), description: "自動整理背包 (Mock)".into(), author: "CoderX".into(), views: 850, likes: 120, downloads: 45, versions: vec![MarketVersion { id: 102, version: "2.1.0".into(), url: "mock://autosort.mgpn".into() }] }
    ]
}

#[tauri::command]
pub async fn market_search(query: String) -> Result<Vec<MarketPlugin>, String> {
    if WORKER_URL.contains("your-name") { return Ok(get_mock_plugins()); }
    let client = reqwest::Client::builder().timeout(std::time::Duration::from_secs(3)).build().map_err(|e| e.to_string())?;
    match client.get(&format!("{}/api/plugins?q={}", WORKER_URL, urlencoding::encode(&query))).send().await {
        Ok(res) if res.status().is_success() => res.json().await.map_err(|e| e.to_string()),
        _ => Ok(get_mock_plugins())
    }
}

#[tauri::command]
pub async fn market_report_view(plugin_id: i32, duration_sec: i32) -> Result<serde_json::Value, String> {
    if duration_sec < 10 { return Ok(json!({"success": true, "g_coins_earned": 0})); }
    Ok(json!({"success": true, "g_coins_earned": 5, "message": "Mock Mode: +5 G-Coins"}))
}

#[tauri::command]
pub async fn market_download(plugin_id: i32, version_id: i32) -> Result<serde_json::Value, String> {
    Ok(json!({"success": true, "download_url": "mock://file.mgpn", "g_coins_earned": 100, "message": "Mock Mode: +100 G-Coins"}))
}
