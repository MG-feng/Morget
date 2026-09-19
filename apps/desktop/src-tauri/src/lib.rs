use tauri::Manager;

mod commands;
mod core; // ✅ 確保 core 模塊被引入，解決 plugin.rs 編譯報錯

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            // 插件管理 (✅ 修復：使用真實存在的 plugin_install_via_dialog)
            commands::plugin::plugin_list,
            commands::plugin::plugin_install_via_dialog,
            commands::plugin::plugin_uninstall,
            commands::plugin::plugin_toggle,

            // 完整高級設置
            commands::settings::settings_get,
            commands::settings::settings_set,
            commands::settings::settings_select_directory,
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
