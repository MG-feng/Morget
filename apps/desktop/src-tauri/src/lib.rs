pub mod commands;
pub mod core;

use commands::plugin::AppState;
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir().unwrap_or_else(|_| std::path::PathBuf::from("."));
            let plugin_manager = core::plugin_manager::PluginManager::new(app_data_dir);
            app.manage(AppState { plugin_manager: std::sync::Mutex::new(plugin_manager) });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::plugin::plugin_list,
            commands::plugin::plugin_install,
            commands::plugin::plugin_uninstall,
            commands::plugin::plugin_toggle,
            commands::settings::settings_get,
            commands::settings::settings_set,
            commands::settings::settings_select_directory,
            commands::settings::settings_get_cache_size,
            commands::settings::settings_clear_cache,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}