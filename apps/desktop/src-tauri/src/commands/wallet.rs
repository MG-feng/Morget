use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Serialize, Deserialize, Clone)]
pub struct WalletInfo { pub balance: i32, pub transactions: Vec<Transaction> }
#[derive(Serialize, Deserialize, Clone)]
pub struct Transaction { pub id: i32, pub amount: i32, pub reason: String, pub created_at: String }

#[tauri::command]
pub async fn wallet_get_info() -> Result<WalletInfo, String> {
    // Mock: 返回模擬錢包數據
    Ok(WalletInfo {
        balance: 250,
        transactions: vec![Transaction { id: 1, amount: 50, reason: "Welcome Bonus".into(), created_at: "2026-09-16T10:00:00Z".into() }]
    })
}
