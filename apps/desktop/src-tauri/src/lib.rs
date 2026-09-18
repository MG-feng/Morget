pub mod commands;
pub mod core;

use commands::plugin::AppState;
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir().expect("app data dir required");
            let plugin_manager = core::plugin_manager::PluginManager::new(app_data_dir.clone());
            app.manage(AppState { plugin_manager: std::sync::Mutex::new(plugin_manager) });
            app.manage(commands::auth::AuthState::new());
            #[cfg(any(target_os = "linux", all(debug_assertions, windows)))]
            { use tauri_plugin_deep_link::DeepLinkExt; let _ = app.deep_link().register_all(); }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::plugin::plugin_list, commands::plugin::plugin_install_via_dialog,
            commands::plugin::plugin_uninstall, commands::plugin::plugin_toggle,
            commands::settings::settings_get, commands::settings::settings_set,
            commands::settings::settings_select_directory, commands::settings::settings_pick_plugin_file,
            commands::settings::settings_get_cache_size, commands::settings::settings_clear_cache,
            commands::auth::auth_login, commands::auth::auth_callback, commands::auth::auth_get_state, commands::auth::auth_logout,
            commands::market::market_search, commands::market::market_report_view, commands::market::market_download,
            commands::github::github_auth, commands::github::github_get_repos, commands::github::github_upload_plugin,
            commands::wallet::wallet_get_info,
            commands::frontend::frontend_get_config,
            commands::frontend::frontend_set_config,
            commands::frontend::frontend_list,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
