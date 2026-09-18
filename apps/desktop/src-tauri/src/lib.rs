use tauri::Manager;

mod commands;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // 應用啟動時讀取設置，應用關閉行為
            let store = app.store("settings.json");
            if let Ok(store) = store {
                let stored = store.get("app_settings").unwrap_or(serde_json::json!({}));
                let settings: commands::settings::AppSettings =
                    serde_json::from_value(stored).unwrap_or_default();
                // 應用窗口模式
                if settings.window_mode == "fullscreen" {
                    if let Some(win) = app.get_webview_window("main") {
                        let _ = win.set_fullscreen(true);
                    }
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // ===== 插件管理 =====
            commands::plugin::plugin_list,
            commands::plugin::plugin_install,
            commands::plugin::plugin_uninstall,
            commands::plugin::plugin_toggle,

            // ===== 設置 =====
            commands::settings::settings_get,
            commands::settings::settings_set,
            commands::settings::settings_select_directory,
            commands::settings::settings_pick_plugin_file,
            commands::settings::settings_get_cache_size,
            commands::settings::settings_clear_cache,
            commands::settings::settings_set_auto_start,
            commands::settings::settings_set_close_behavior,
            commands::settings::settings_set_tray_icon,
            commands::settings::settings_test_notification,
            commands::settings::settings_test_sound,
            commands::settings::settings_toggle_fullscreen,
            commands::settings::settings_set_window_mode,
            commands::settings::settings_check_admin,
            commands::settings::settings_reset_all,
            commands::settings::settings_factory_reset,

            // ===== 前端包 =====
            commands::frontend::frontend_get_config,
            commands::frontend::frontend_set_config,
            commands::frontend::frontend_list,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
