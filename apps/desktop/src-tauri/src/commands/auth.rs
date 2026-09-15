use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::State;
use keyring::Entry;
use sha2::{Sha256, Digest};
use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};
use rand::Rng;
use tauri_plugin_opener::OpenerExt;

// ✅ 終極優化：使用 match 確保在任何 Rust 版本下均為合法的 const fn
const WORKOS_CLIENT_ID: &str = match option_env!("WORKOS_CLIENT_ID") {
    Some(id) => id,
    None => "client_REPLACE_ME_WITH_REAL_ID",
};

const REDIRECT_URI: &str = "morget://auth/callback";

pub struct AuthState {
    pub verifier: std::sync::Mutex<Option<String>>,
    pub state: std::sync::Mutex<Option<String>>,
}

impl AuthState {
    pub fn new() -> Self {
        Self {
            verifier: std::sync::Mutex::new(None),
            state: std::sync::Mutex::new(None),
        }
    }
}

#[derive(Serialize, Deserialize, Clone)]
pub struct UserInfo {
    pub id: String,
    pub email: String,
    pub name: Option<String>,
}

#[tauri::command]
pub fn auth_get_state() -> Result<serde_json::Value, String> {
    let entry = Entry::new("com.morget.core", "auth_token").map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(_token) => {
            let user_entry = Entry::new("com.morget.core", "user_info").map_err(|e| e.to_string())?;
            if let Ok(user_json) = user_entry.get_password() {
                if let Ok(user) = serde_json::from_str::<UserInfo>(&user_json) {
                    return Ok(json!({"isLoggedIn": true, "user": user}));
                }
            }
            Ok(json!({"isLoggedIn": true}))
        }
        Err(_) => Ok(json!({"isLoggedIn": false})),
    }
}

#[tauri::command]
pub fn auth_login(app: tauri::AppHandle, state: State<AuthState>) -> Result<serde_json::Value, String> {
    let mut rng = rand::thread_rng();
    let verifier: String = (0..64).map(|_| rng.sample(rand::distributions::Alphanumeric) as char).collect();
    let challenge = URL_SAFE_NO_PAD.encode(Sha256::digest(verifier.as_bytes()));
    let csrf_state: String = (0..32).map(|_| rng.sample(rand::distributions::Alphanumeric) as char).collect();

    *state.verifier.lock().unwrap() = Some(verifier);
    *state.state.lock().unwrap() = Some(csrf_state.clone());

    let auth_url = format!(
        "https://api.workos.com/user_management/authorize?response_type=code&client_id={}&redirect_uri={}&state={}&code_challenge={}&code_challenge_method=S256",
        urlencoding::encode(WORKOS_CLIENT_ID),
        urlencoding::encode(REDIRECT_URI),
        urlencoding::encode(&csrf_state),
        urlencoding::encode(&challenge)
    );

    app.opener().open_url(&auth_url, None::<&str>).map_err(|e| e.to_string())?;
    Ok(json!({"success": true}))
}

#[tauri::command]
pub async fn auth_callback(
    state: State<'_, AuthState>,
    code: String,
    callback_state: String,
) -> Result<serde_json::Value, String> {
    let expected_state = state.state.lock().unwrap().clone();
    if expected_state.as_deref() != Some(&callback_state) {
        return Err("State mismatch (CSRF)".to_string());
    }
    
    *state.state.lock().unwrap() = None;
    let verifier = state.verifier.lock().unwrap().take().ok_or("Missing verifier")?;

    let client = reqwest::Client::new();
    let res = client.post("https://api.workos.com/user_management/authenticate")
        .json(&json!({
            "client_id": WORKOS_CLIENT_ID,
            "code": code,
            "grant_type": "authorization_code",
            "code_verifier": verifier
        }))
        .send().await.map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(format!("WorkOS auth failed: {}", res.text().await.unwrap_or_default()));
    }

    let token_data: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    let access_token = token_data["access_token"].as_str().ok_or("No token")?;

    let entry = Entry::new("com.morget.core", "auth_token").map_err(|e| e.to_string())?;
    entry.set_password(access_token).map_err(|e| e.to_string())?;

    if let Some(user_info) = extract_user_from_trusted_jwt(access_token) {
        let user_entry = Entry::new("com.morget.core", "user_info").map_err(|e| e.to_string())?;
        let _ = user_entry.set_password(&serde_json::to_string(&user_info).unwrap_or_default());
        
        // TODO: Phase 3 在此處調用 Cloudflare Worker 同步用戶到 Neon
    }

    Ok(json!({"success": true}))
}

#[tauri::command]
pub fn auth_logout(state: State<AuthState>) -> Result<(), String> {
    *state.verifier.lock().unwrap() = None;
    *state.state.lock().unwrap() = None;
    
    let entry = Entry::new("com.morget.core", "auth_token").map_err(|e| e.to_string())?;
    let _ = entry.delete_credential();
    let user_entry = Entry::new("com.morget.core", "user_info").map_err(|e| e.to_string())?;
    let _ = user_entry.delete_credential();
    Ok(())
}

fn extract_user_from_trusted_jwt(token: &str) -> Option<UserInfo> {
    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() != 3 { return None; }
    let payload = URL_SAFE_NO_PAD.decode(parts[1]).ok()?;
    let claims: serde_json::Value = serde_json::from_slice(&payload).ok()?;
    Some(UserInfo {
        id: claims["sub"].as_str()?.to_string(),
        email: claims["email"].as_str().unwrap_or("").to_string(),
        name: claims["first_name"].as_str().map(|s| s.to_string()),
    })
}
