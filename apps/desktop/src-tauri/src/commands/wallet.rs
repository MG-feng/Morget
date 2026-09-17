use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct WalletInfo { pub balance: i32, pub transactions: Vec<Transaction> }

#[derive(Serialize, Deserialize, Clone)]
pub struct Transaction { pub id: i32, pub amount: i32, pub reason: String, pub created_at: String }

#[tauri::command]
pub async fn wallet_get_info() -> Result<WalletInfo, String> {
    Err("AUTH_REQUIRED".to_string())
}
