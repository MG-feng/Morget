use tauri::Manager;

mod commands;
mod core; // 確保 core 模塊被正確引入

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            // 插件管理
            commands::plugin::plugin_list,
            commands::plugin::plugin_install,
            commands::plugin::plugin_uninstall,
            commands::plugin::plugin_toggle,
            
            // 基礎設置 (精準匹配當前前端)
            commands::settings::settings_get,
            commands::settings::settings_set,
            commands::settings::settings_select_directory,
            commands::settings::settings_get_cache_size,
            commands::settings::settings_clear_cache,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
