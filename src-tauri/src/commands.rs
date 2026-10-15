use std::sync::atomic::Ordering;
use std::time::{Duration, SystemTime};

use rand::Rng;
use serde::{Deserialize, Serialize};
use tauri::Manager;

use crate::morgetConfig::MorgetConfig;
use crate::platform;
use crate::{AppState, DeleteToken};

#[derive(Serialize, Clone)]
pub struct ApiError {
    pub code: String,
    pub message: String,
}

impl ApiError {
    pub fn new(code: &str, message: &str) -> Self {
        Self {
            code: code.into(),
            message: message.into(),
        }
    }
}

#[tauri::command]
pub fn get_config(state: tauri::State<'_, AppState>) -> Result<MorgetConfig, ApiError> {
    Ok(state.config.lock().unwrap().clone())
}

#[tauri::command]
pub fn save_config(
    state: tauri::State<'_, AppState>,
    config: MorgetConfig,
) -> Result<(), ApiError> {
    crate::morgetConfig::save_config(&state.baseDir, &config)
        .map_err(|e| ApiError::new("FS_ERROR", &e.to_string()))?;

    *state.config.lock().unwrap() = config;
    Ok(())
}

#[tauri::command]
pub fn reset_config(state: tauri::State<'_, AppState>) -> Result<MorgetConfig, ApiError> {
    let cfg = MorgetConfig::default();

    crate::morgetConfig::save_config(&state.baseDir, &cfg)
        .map_err(|e| ApiError::new("FS_ERROR", &e.to_string()))?;

    *state.config.lock().unwrap() = cfg.clone();
    Ok(cfg)
}

#[tauri::command]
pub fn get_data_paths(state: tauri::State<'_, AppState>) -> Result<serde_json::Value, ApiError> {
    let b = &state.baseDir;

    Ok(serde_json::json!({
        "baseDir": b.display().to_string(),
        "pluginsDir": b.join("plugins").display().to_string(),
        "packagesDir": b.join("packages").display().to_string(),
        "cacheDir": b.join("cache").display().to_string(),
    }))
}

#[derive(Serialize)]
pub struct SystemInfo {
    pub os: String,
    pub logicalCpuThreads: usize,
    pub physicalCores: usize,
    pub totalRamMib: u64,
    pub gpus: Vec<String>,
    pub elevated: bool,
}

#[tauri::command]
pub async fn get_system_info() -> Result<SystemInfo, ApiError> {
    tauri::async_runtime::spawn_blocking(|| {
        let mut sys = sysinfo::System::new();
        sys.refresh_memory();

        let logical = std::thread::available_parallelism()
            .map(|n| n.get())
            .unwrap_or(1);

        let cores = sys.physical_core_count().unwrap_or(logical);

        SystemInfo {
            os: format!("{} ({})", std::env::consts::OS, std::env::consts::ARCH),
            logicalCpuThreads: logical,
            physicalCores: cores,
            totalRamMib: sys.total_memory() / 1024 / 1024,
            gpus: platform::detect_gpus(),
            elevated: platform::is_elevated(),
        }
    })
    .await
    .map_err(|e| ApiError::new("JOIN_ERROR", &e.to_string()))
}

#[tauri::command]
pub fn apply_window_mode(
    window: tauri::WebviewWindow,
    mode: String,
    width: u32,
    height: u32,
) -> Result<(), ApiError> {
    match mode.as_str() {
        "fullscreen" => {
            window
                .set_decorations(true)
                .map_err(|e| ApiError::new("WINDOW_ERROR", &e.to_string()))?;
            window
                .set_fullscreen(true)
                .map_err(|e| ApiError::new("WINDOW_ERROR", &e.to_string()))?;
        }
        "borderless" => {
            window
                .set_fullscreen(false)
                .map_err(|e| ApiError::new("WINDOW_ERROR", &e.to_string()))?;
            window
                .set_decorations(false)
                .map_err(|e| ApiError::new("WINDOW_ERROR", &e.to_string()))?;
        }
        _ => {
            window
                .set_fullscreen(false)
                .map_err(|e| ApiError::new("WINDOW_ERROR", &e.to_string()))?;
            window
                .set_decorations(true)
                .map_err(|e| ApiError::new("WINDOW_ERROR", &e.to_string()))?;
            window
                .set_size(tauri::LogicalSize::new(width, height))
                .map_err(|e| ApiError::new("WINDOW_ERROR", &e.to_string()))?;
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn restart_app(app: tauri::AppHandle) -> Result<(), ApiError> {
    tauri::async_runtime::spawn_blocking(|| platform::relaunch_self_after_exit())
        .await
        .map_err(|e| ApiError::new("JOIN_ERROR", &e.to_string()))?
        .map_err(|e| ApiError::new("RESTART_FAILED", &e.to_string()))?;

    app.exit(0);
    Ok(())
}

#[tauri::command]
pub fn request_close(app: tauri::AppHandle) -> Result<(), ApiError> {
    if let Some(w) = app.get_webview_window("main") {
        w.close()
            .map_err(|e| ApiError::new("WINDOW_ERROR", &e.to_string()))?;
    }

    Ok(())
}

#[tauri::command]
pub fn resolve_close_request(app: tauri::AppHandle, action: String) -> Result<(), ApiError> {
    match action.as_str() {
        "tray" => {
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.hide();
            }
        }
        "exit" => app.exit(0),
        "cancel" => {}
        _ => {}
    }

    Ok(())
}

#[tauri::command]
pub fn ack_close_request(app: tauri::AppHandle) -> Result<(), ApiError> {
    app.state::<AppState>()
        .closeAcked
        .store(true, Ordering::SeqCst);

    Ok(())
}

#[derive(Serialize)]
pub struct CloseState {
    pub gen: u64,
    pub acked: bool,
}

#[tauri::command]
pub fn get_close_state(app: tauri::AppHandle) -> Result<CloseState, ApiError> {
    let s = app.state::<AppState>();

    Ok(CloseState {
        gen: s.closeGen.load(Ordering::SeqCst),
        acked: s.closeAcked.load(Ordering::SeqCst),
    })
}

#[tauri::command]
pub async fn request_admin_relaunch(app: tauri::AppHandle) -> Result<(), ApiError> {
    if platform::is_elevated() {
        return Ok(());
    }

    if !cfg!(target_os = "windows") {
        return Err(ApiError::new(
            "ELEVATION_FAILED",
            "Online administrator relaunch is Windows-only in Phase 0",
        ));
    }

    let baseDir = app.state::<AppState>().baseDir.clone();
    let pid = std::process::id();
    let marker = baseDir.join(format!("elevate_{}.marker", pid));

    let _ = std::fs::remove_file(&marker);

    let m = marker.clone();

    let granted = tauri::async_runtime::spawn_blocking(move || {
        let ok = platform::relaunch_elevated_with_feedback(&m)
            .map_err(|e| ApiError::new("ELEVATION_FAILED", &e.to_string()))?;

        if ok {
            for _ in 0..300 {
                if m.exists() {
                    break;
                }
                std::thread::sleep(Duration::from_millis(100));
            }
        }

        Ok(ok)
    })
    .await
    .map_err(|e| ApiError::new("JOIN_ERROR", &e.to_string()))??;

    if granted {
        if marker.exists() {
            app.exit(0);
            return Ok(());
        }

        return Err(ApiError::new(
            "ELEVATION_TIMEOUT",
            "UAC consent was not confirmed within 30 seconds",
        ));
    }

    Err(ApiError::new(
        "ELEVATION_DENIED",
        "UAC was denied or elevation helper failed",
    ))
}

#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(default)]
pub struct MarketPlugin {
    pub id: String,
    pub name: String,
    pub summary: String,
    pub version: String,
    pub downloads: u64,
}

#[tauri::command]
pub async fn fetch_market_plugins(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<MarketPlugin>, ApiError> {
    let url = state
        .config
        .lock()
        .unwrap()
        .services
        .marketApiUrl
        .trim()
        .to_string();

    if url.is_empty() {
        return Err(ApiError::new(
            "SERVICE_NOT_CONFIGURED",
            "services.marketApiUrl is not configured",
        ));
    }

    tauri::async_runtime::spawn_blocking(move || {
        let resp = ureq::get(&url)
            .timeout(Duration::from_secs(15))
            .call()
            .map_err(|e| ApiError::new("NETWORK_ERROR", &e.to_string()))?;

        resp.into_json::<Vec<MarketPlugin>>()
            .map_err(|e| ApiError::new("BAD_RESPONSE", &e.to_string()))
    })
    .await
    .map_err(|e| ApiError::new("JOIN_ERROR", &e.to_string()))?
}

#[derive(Serialize)]
pub struct InstalledPluginInfo {
    pub fileName: String,
    pub kind: String,
    pub sizeBytes: u64,
    pub modifiedMs: u64,
}

#[tauri::command]
pub async fn list_installed_plugins(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<InstalledPluginInfo>, ApiError> {
    let dir = state.baseDir.join("plugins");
    let dir_clone = dir.clone();

    tauri::async_runtime::spawn_blocking(move || {
        std::fs::create_dir_all(&dir_clone)
            .map_err(|e| ApiError::new("FS_ERROR", &e.to_string()))?;

        let mut out = Vec::new();

        let entries = std::fs::read_dir(&dir_clone)
            .map_err(|e| ApiError::new("FS_ERROR", &e.to_string()))?;

        for entry in entries.flatten() {
            let p = entry.path();

            let ext = p
                .extension()
                .map(|s| s.to_string_lossy().to_lowercase())
                .unwrap_or_default();

            if ext == "mgpn" || ext == "mgp" {
                let md = p
                    .metadata()
                    .map_err(|e| ApiError::new("FS_ERROR", &e.to_string()))?;

                let modifiedMs = md
                    .modified()
                    .ok()
                    .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                    .map(|d| d.as_millis() as u64)
                    .unwrap_or(0);

                out.push(InstalledPluginInfo {
                    fileName: p
                        .file_name()
                        .unwrap_or_default()
                        .to_string_lossy()
                        .to_string(),
                    kind: if ext == "mgpn" {
                        "MGPN".into()
                    } else {
                        "MGP".into()
                    },
                    sizeBytes: md.len(),
                    modifiedMs,
                });
            }
        }

        out.sort_by(|a, b| a.fileName.cmp(&b.fileName));
        Ok(out)
    })
    .await
    .map_err(|e| ApiError::new("JOIN_ERROR", &e.to_string()))?
}

#[tauri::command]
pub async fn list_packages(
    state: tauri::State<'_, AppState>,
    kind: String,
) -> Result<Vec<String>, ApiError> {
    let dir = state.baseDir.join("packages");
    let dir_clone = dir.clone();
    let kind_clone = kind.clone();

    tauri::async_runtime::spawn_blocking(move || {
        std::fs::create_dir_all(&dir_clone)
            .map_err(|e| ApiError::new("FS_ERROR", &e.to_string()))?;

        let want = if kind_clone == "frontend" { "mgf" } else { "mgr" };
        let mut out = Vec::new();

        let entries = std::fs::read_dir(&dir_clone)
            .map_err(|e| ApiError::new("FS_ERROR", &e.to_string()))?;

        for entry in entries.flatten() {
            let p = entry.path();

            let ext = p
                .extension()
                .map(|s| s.to_string_lossy().to_lowercase())
                .unwrap_or_default();

            if ext == want {
                out.push(
                    p.file_name()
                        .unwrap_or_default()
                        .to_string_lossy()
                        .to_string(),
                );
            }
        }

        out.sort();
        Ok(out)
    })
    .await
    .map_err(|e| ApiError::new("JOIN_ERROR", &e.to_string()))?
}

#[tauri::command]
pub async fn import_package(
    state: tauri::State<'_, AppState>,
    source_path: String,
    kind: String,
) -> Result<String, ApiError> {
    let base_dir = state.baseDir.clone();
    let source_path_clone = source_path.clone();
    let kind_clone = kind.clone();

    tauri::async_runtime::spawn_blocking(move || {
        let src = std::path::PathBuf::from(&source_path_clone);

        let ext = src
            .extension()
            .map(|s| s.to_string_lossy().to_lowercase())
            .unwrap_or_default();

        let want = if kind_clone == "frontend" { "mgf" } else { "mgr" };

        if ext != want {
            return Err(ApiError::new(
                "INVALID_PACKAGE",
                &format!("expected .{}, got .{}", want, ext),
            ));
        }

        let dir = base_dir.join("packages");
        std::fs::create_dir_all(&dir)
            .map_err(|e| ApiError::new("FS_ERROR", &e.to_string()))?;

        let name = src
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();

        std::fs::copy(&src, dir.join(&name))
            .map_err(|e| ApiError::new("FS_ERROR", &e.to_string()))?;

        Ok(name)
    })
    .await
    .map_err(|e| ApiError::new("JOIN_ERROR", &e.to_string()))?
}

#[tauri::command]
pub fn set_active_package(
    state: tauri::State<'_, AppState>,
    kind: String,
    name: String,
) -> Result<(), ApiError> {
    let mut cfg = state.config.lock().unwrap().clone();

    if kind == "frontend" {
        cfg.advanced.frontendPackage = name;
    } else {
        cfg.advanced.backendPackage = name;
    }

    crate::morgetConfig::save_config(&state.baseDir, &cfg)
        .map_err(|e| ApiError::new("FS_ERROR", &e.to_string()))?;

    *state.config.lock().unwrap() = cfg;
    Ok(())
}

#[tauri::command]
pub async fn export_to_file(
    state: tauri::State<'_, AppState>,
    file_name: String,
    kind: String,
) -> Result<String, ApiError> {
    let safe_name = std::path::Path::new(&file_name)
        .file_name()
        .and_then(|s| s.to_str())
        .filter(|s| !s.is_empty())
        .unwrap_or("export.json")
        .to_string();

    let path = state.baseDir.join(safe_name);
    let cfg = state.config.lock().unwrap().clone();
    let base = state.baseDir.clone();
    let path_clone = path.clone();

    tauri::async_runtime::spawn_blocking(move || {
        let list_names = |dir: std::path::PathBuf| -> Vec<String> {
            std::fs::read_dir(dir)
                .map(|rd| {
                    rd.flatten()
                        .map(|e| e.file_name().to_string_lossy().to_string())
                        .collect()
                })
                .unwrap_or_default()
        };

        let value = match kind.as_str() {
            "settings" => {
                serde_json::to_value(&cfg).map_err(|e| ApiError::new("SERIALIZE_ERROR", &e.to_string()))?
            }
            "data" => serde_json::json!({
                "config": cfg,
                "plugins": list_names(base.join("plugins")),
                "packages": list_names(base.join("packages")),
            }),
            _ => {
                return Err(ApiError::new(
                    "BAD_ARGUMENT",
                    "kind must be settings or data",
                ))
            }
        };

        let text = serde_json::to_string_pretty(&value)
            .map_err(|e| ApiError::new("SERIALIZE_ERROR", &e.to_string()))?;

        std::fs::write(&path_clone, text)
            .map_err(|e| ApiError::new("FS_ERROR", &e.to_string()))?;

        Ok(path_clone.to_string_lossy().to_string())
    })
    .await
    .map_err(|e| ApiError::new("JOIN_ERROR", &e.to_string()))?
}

#[derive(Serialize)]
pub struct StorageEntry {
    pub id: String,
    pub path: String,
    pub sizeBytes: u64,
    pub exists: bool,
}

#[tauri::command]
pub async fn get_storage_usage(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<StorageEntry>, ApiError> {
    let b = state.baseDir.clone();

    tauri::async_runtime::spawn_blocking(move || {
        let mk = |id: &str, p: std::path::PathBuf| {
            let exists = p.exists();
            let size = if p.is_dir() {
                platform::dir_size(&p)
            } else {
                p.metadata().map(|m| m.len()).unwrap_or(0)
            };

            StorageEntry {
                id: id.into(),
                path: p.display().to_string(),
                sizeBytes: size,
                exists,
            }
        };

        let plugins = mk("plugins", b.join("plugins"));
        let packages = mk("packages", b.join("packages"));
        let cache = mk("cache", b.join("cache"));
        let config = mk("config", crate::morgetConfig::config_file_path(&b));

        let total = plugins.sizeBytes + packages.sizeBytes + cache.sizeBytes + config.sizeBytes;

        vec![
            plugins,
            packages,
            cache,
            config,
            StorageEntry {
                id: "total".into(),
                path: b.display().to_string(),
                sizeBytes: total,
                exists: true,
            },
        ]
    })
    .await
    .map_err(|e| ApiError::new("JOIN_ERROR", &e.to_string()))
}

#[tauri::command]
pub fn get_delete_token(state: tauri::State<'_, AppState>, id: String) -> Result<String, ApiError> {
    let mut rng = rand::thread_rng();

    let token_val: String = (0..16)
        .map(|_| rng.gen_range(b'a'..=b'z') as char)
        .collect();

    let token = DeleteToken {
        id: id.clone(),
        expires_at: SystemTime::now() + Duration::from_secs(60),
    };

    let mut tokens = state.deleteTokens.lock().unwrap();
    let now = SystemTime::now();

    tokens.retain(|_, v| v.expires_at > now);
    let _ = tokens.insert(token_val.clone(), token);

    Ok(token_val)
}

#[tauri::command]
pub async fn delete_storage(
    state: tauri::State<'_, AppState>,
    id: String,
    confirm_token: String,
) -> Result<(), ApiError> {
    let is_valid = {
        let mut tokens = state.deleteTokens.lock().unwrap();

        if let Some(t) = tokens.remove(&confirm_token) {
            t.id == id && t.expires_at > SystemTime::now()
        } else {
            false
        }
    };

    if !is_valid {
        return Err(ApiError::new(
            "CONFIRMATION_MISMATCH",
            "token is invalid or expired",
        ));
    }

    let base_dir = state.baseDir.clone();
    let id_clone = id.clone();

    tauri::async_runtime::spawn_blocking(move || {
        let b = base_dir;

        match id_clone.as_str() {
            "cache" => {
                let p = b.join("cache");
                if p.exists() {
                    std::fs::remove_dir_all(&p)
                        .map_err(|e| ApiError::new("FS_ERROR", &e.to_string()))?;
                }
            }
            "plugins" => {
                let p = b.join("plugins");
                if p.exists() {
                    std::fs::remove_dir_all(&p)
                        .map_err(|e| ApiError::new("FS_ERROR", &e.to_string()))?;
                }
            }
            "packages" => {
                let p = b.join("packages");
                if p.exists() {
                    std::fs::remove_dir_all(&p)
                        .map_err(|e| ApiError::new("FS_ERROR", &e.to_string()))?;
                }
            }
            "config" => {
                let p = crate::morgetConfig::config_file_path(&b);
                if p.exists() {
                    std::fs::remove_file(&p)
                        .map_err(|e| ApiError::new("FS_ERROR", &e.to_string()))?;
                }
            }
            "factory" => {
                if b.exists() {
                    std::fs::remove_dir_all(&b)
                        .map_err(|e| ApiError::new("FS_ERROR", &e.to_string()))?;
                }

                std::fs::create_dir_all(&b)
                    .map_err(|e| ApiError::new("FS_ERROR", &e.to_string()))?;
            }
            _ => {
                return Err(ApiError::new(
                    "BAD_ARGUMENT",
                    "unknown storage target",
                ))
            }
        }

        Ok(())
    })
    .await
    .map_err(|e| ApiError::new("JOIN_ERROR", &e.to_string()))??;

    if id == "config" || id == "factory" {
        let mut cfg_lock = state.config.lock().unwrap();
        *cfg_lock = MorgetConfig::default();

        crate::morgetConfig::save_config(&state.baseDir, &cfg_lock)
            .map_err(|e| ApiError::new("FS_ERROR", &e.to_string()))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn open_folder(path: String) -> Result<(), ApiError> {
    tauri::async_runtime::spawn_blocking(move || {
        platform::open_folder(&path).map_err(|e| ApiError::new("FS_ERROR", &e.to_string()))
    })
    .await
    .map_err(|e| ApiError::new("JOIN_ERROR", &e.to_string()))?
}
