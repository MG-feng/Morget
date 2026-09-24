//! 本地安全存儲：將敏感數據（token / user info）以 AES-256-GCM 加密後寫入應用數據目錄。
//!
//! 設計說明（修復 keyring 依賴缺失 + 明文存儲問題）：
//! - 主密鑰為隨機生成的 32 字節，保存在 OS 用戶目錄下權限受限的 `master.key`
//!   （Windows: %APPDATA%，Unix: 0o600）。不再依賴外部系統鑰匙環服務。
//! - 每條記錄使用隨機 nonce，密文格式：nonce(12B) || ciphertext(tag 附加)。
//! - 讀取失敗（密鑰丟失/數據損壞）時返回 None，絕不降級為明文讀取。

use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Nonce};
use rand::Rng;
use std::fs;
use std::path::{Path, PathBuf};

pub struct SecureStore {
    dir: PathBuf,
    key: Option<[u8; 32]>,
}

impl SecureStore {
    /// `base_dir` 應為應用的私有數據目錄（app_data_dir）。
    pub fn open(base_dir: &Path) -> Self {
        let dir = base_dir.join("secure");
        let _ = fs::create_dir_all(&dir);
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let _ = fs::set_permissions(&dir, fs::Permissions::from_mode(0o700));
        }
        let key_path = dir.join("master.key");
        let key = if let Ok(bytes) = fs::read(&key_path) {
            if bytes.len() == 32 {
                let mut k = [0u8; 32];
                k.copy_from_slice(&bytes);
                Some(k)
            } else {
                None
            }
        } else {
            let mut k = [0u8; 32];
            if rand::thread_rng().try_fill(&mut k).is_ok() {
                if write_key_restricted(&key_path, &k).is_ok() {
                    Some(k)
                } else {
                    None
                }
            } else {
                None
            }
        };
        Self { dir, key }
    }

    fn entry_path(&self, key_name: &str) -> PathBuf {
        // 只允許安全字符作為條目名，防止路徑穿越
        let safe: String = key_name
            .chars()
            .filter(|c| c.is_ascii_alphanumeric() || *c == '_' || *c == '-')
            .collect();
        self.dir.join(format!("{}.enc", safe))
    }

    pub fn set_password(&self, key_name: &str, value: &str) -> Result<(), String> {
        let key = self.key.ok_or("SecureStore unavailable")?;
        let cipher = Aes256Gcm::new_from_slice(&key).map_err(|e| e.to_string())?;
        let mut nonce_bytes = [0u8; 12];
        rand::thread_rng().fill(&mut nonce_bytes);
        let ct = cipher
            .encrypt(Nonce::from_slice(&nonce_bytes), value.as_bytes())
            .map_err(|_| "加密失敗".to_string())?;
        let mut blob = nonce_bytes.to_vec();
        blob.extend_from_slice(&ct);
        let path = self.entry_path(key_name);
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let mut opts = fs::OpenOptions::new();
            opts.create(true).write(true).truncate(true).mode(0o600);
            let mut f = opts.open(&path).map_err(|e| e.to_string())?;
            std::io::Write::write_all(&mut f, &blob).map_err(|e| e.to_string())?;
        }
        #[cfg(not(unix))]
        fs::write(&path, &blob).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn get_password(&self, key_name: &str) -> Option<String> {
        let key = self.key.as_ref()?;
        let blob = fs::read(self.entry_path(key_name)).ok()?;
        if blob.len() < 13 {
            return None;
        }
        let (nonce, ct) = blob.split_at(12);
        let cipher = Aes256Gcm::new_from_slice(key).ok()?;
        let pt = cipher.decrypt(Nonce::from_slice(nonce), ct).ok()?;
        String::from_utf8(pt).ok()
    }

    pub fn delete_credential(&self, key_name: &str) {
        let _ = fs::remove_file(self.entry_path(key_name));
    }
}

#[cfg(unix)]
fn write_key_restricted(path: &Path, k: &[u8; 32]) -> std::io::Result<()> {
    use std::io::Write;
    use std::os::unix::fs::OpenOptionsExt;
    let mut f = std::fs::OpenOptions::new()
        .create_new(true)
        .write(true)
        .mode(0o600)
        .open(path)?;
    f.write_all(k)
}

#[cfg(not(unix))]
fn write_key_restricted(path: &Path, k: &[u8; 32]) -> std::io::Result<()> {
    // Windows：%APPDATA% 下的文件繼承用戶配置文件 ACL（僅當前用戶可讀），符合預期。
    fs::write(path, k)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn roundtrip_and_isolation() {
        let tmp = tempfile::tempdir().unwrap();
        let store = SecureStore::open(tmp.path());
        store.set_password("auth_token", "secret-value").unwrap();
        assert_eq!(store.get_password("auth_token").as_deref(), Some("secret-value"));

        // 落盤內容必須是密文，不能包含明文
        let raw = fs::read(store.entry_path("auth_token")).unwrap();
        assert!(!raw.windows(12).any(|w| w == b"secret-value"));

        // 不同實例（同一目錄、同一密鑰）仍可解密
        let store2 = SecureStore::open(tmp.path());
        assert_eq!(store2.get_password("auth_token").as_deref(), Some("secret-value"));

        store2.delete_credential("auth_token");
        assert_eq!(store2.get_password("auth_token"), None);
    }

    #[test]
    fn path_traversal_in_key_name_is_neutralized() {
        let tmp = tempfile::tempdir().unwrap();
        let store = SecureStore::open(tmp.path());
        // "../../evil" 會被過濾成 "evil"，只寫入 secure/ 目錄內，不會發生路徑穿越
        store.set_password("../../evil", "x").unwrap();
        assert!(store.entry_path("../../evil").starts_with(&store.dir));
        assert!(store.dir.join("evil.enc").exists());
        assert!(!tmp.path().join("evil.enc").exists());
        assert_eq!(store.get_password("../../evil").as_deref(), Some("x"));
    }
}
