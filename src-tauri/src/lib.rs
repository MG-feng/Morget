#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#![allow(non_snake_case)]

pub mod commands;
pub mod morgetConfig;
pub mod platform;

use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Mutex;
use std::time::SystemTime;

use tauri::{Emitter, Manager};

pub struct DeleteToken {
    pub id: String,
    pub expires_at: SystemTime,
}

pub struct AppState {
    pub baseDir: std::path::PathBuf,
    pub config: Mutex<morgetConfig::MorgetConfig>,
    pub deleteTokens: Mutex<HashMap<String, DeleteToken>>,
    pub closeGen: AtomicU64,
    pub closeAcked: AtomicBool,
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.show();
                let _ = w.unminimize();
                let _ = w.set_focus();
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let baseDir = app
                .path()
                .app_config_dir()
                .unwrap_or_else(|_| std::path::PathBuf::from("."));

            let config = morgetConfig::load_config(&baseDir);

            platform::write_instance_lock();

            if let Some(window) = app.get_webview_window("main") {
                match config.graphics.windowMode.as_str() {
                    "fullscreen" => {
                        let _ = window.set_fullscreen(true);
                    }
                    "borderless" => {
                        let _ = window.set_fullscreen(false);
                        let _ = window.set_decorations(false);
                    }
                    _ => {}
                }
            }

            if let Some(icon) = app.default_window_icon().cloned() {
                let menu = tauri::menu::MenuBuilder::new(app)
                    .item(
                        &tauri::menu::MenuItemBuilder::new("Show Morget")
                            .id("show")
                            .build(app)?,
                    )
                    .separator()
                    .item(
                        &tauri::menu::MenuItemBuilder::new("Exit")
                            .id("quit")
                            .build(app)?,
                    )
                    .build(app)?;

                let tray = tauri::tray::TrayIconBuilder::with_id("main_tray")
                    .icon(icon)
                    .tooltip("Morget")
                    .menu(&menu)
                    .on_menu_event(|app, event| match event.id.as_ref() {
                        "show" => {
                            if let Some(w) = app.get_webview_window("main") {
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        }
                        "quit" => app.exit(0),
                        _ => {}
                    })
                    .on_tray_icon_event(|tray, event| {
                        if let tauri::tray::TrayIconEvent::Click { .. } = event {
                            if let Some(w) = tray.app_handle().get_webview_window("main") {
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        }
                    })
                    .build(app)?;

                app.manage(tray);
            }

            app.manage(AppState {
                baseDir,
                config: Mutex::new(config),
                deleteTokens: Mutex::new(HashMap::new()),
                closeGen: AtomicU64::new(0),
                closeAcked: AtomicBool::new(false),
            });

            let handle = app.handle().clone();

            if let Some(window) = app.get_webview_window("main") {
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        let state = handle.state::<AppState>();
                        let cfg = state.config.lock().unwrap().clone();

                        match cfg.advanced.closeBehavior.as_str() {
                            "exit" => {}
                            "tray" => {
                                api.prevent_close();
                                if let Some(w) = handle.get_webview_window("main") {
                                    let _ = w.hide();
                                }
                            }
                            _ => {
                                api.prevent_close();

                                let gen = state.closeGen.fetch_add(1, Ordering::SeqCst) + 1;
                                state.closeAcked.store(false, Ordering::SeqCst);

                                let _ = handle.emit("morget://closeRequested", ());

                                let h = handle.clone();
                                std::thread::spawn(move || {
                                    std::thread::sleep(std::time::Duration::from_secs(10));

                                    if let Some(s) = h.try_state::<AppState>() {
                                        if s.closeGen.load(Ordering::SeqCst) == gen
                                            && !s.closeAcked.load(Ordering::SeqCst)
                                        {
                                            h.exit(1);
                                        }
                                    }
                                });
                            }
                        }
                    }
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_config,
            commands::save_config,
            commands::reset_config,
            commands::get_data_paths,
            commands::get_system_info,
            commands::apply_window_mode,
            commands::restart_app,
            commands::request_close,
            commands::resolve_close_request,
            commands::ack_close_request,
            commands::get_close_state,
            commands::request_admin_relaunch,
            commands::fetch_market_plugins,
            commands::list_installed_plugins,
            commands::list_packages,
            commands::import_package,
            commands::set_active_package,
            commands::export_to_file,
            commands::get_storage_usage,
            commands::get_delete_token,
            commands::delete_storage,
            commands::open_folder
        ])
        .run(tauri::generate_context!())
        .expect("Morget startup failed");
}
