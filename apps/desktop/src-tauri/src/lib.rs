use tauri::Manager;

mod commands;
mod core; 

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            // ===== 插件管理 =====
            commands::plugin::plugin_list,
            commands::plugin::plugin_install_via_dialog, // ✅ 修復：改為真實存在的函數名
            commands::plugin::plugin_uninstall,
            commands::plugin::plugin_toggle,

            // ===== 基礎設置 =====
            commands::settings::settings_get,
            commands::settings::settings_set,
            commands::settings::settings_select_directory,
            commands::settings::settings_get_cache_size,
            commands::settings::settings_clear_cache,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
