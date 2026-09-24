use tauri::{Manager, OnScopeChanged};
use tauri_plugin_deep_link::DeepLinkExt;

mod commands;
mod core;

use commands::{auth, frontend, github, market, plugin, settings, wallet};
use core::plugin_manager::PluginManager;

/// 從 morget://auth/callback?code=xxx&state=yyy 中解析 query 參數（percent-decoded）。
fn parse_deep_link(url: &str) -> Option<(String, String)> {
    let query = url.split_once('?')?.1;
    let mut code = None;
    let mut state = None;
    for pair in query.split('&') {
        if let Some((k, v)) = pair.split_once('=') {
            let decoded = percent_encoding::percent_decode_str(v).decode_utf8_lossy().into_owned();
            match k {
                "code" => code = Some(decoded),
                "state" => state = Some(decoded),
                _ => {}
            }
        }
    }
    Some((code?, state?))
}

#[cfg(desktop)]
fn handle_auth_url(app: &tauri::AppHandle, url: &str) {
    // 只接受本應用的回調地址，避免把其他 URL 的 code/state 誤當回調處理
    if !url.starts_with("morget://auth/callback") {
        return;
    }
    let (code, state) = match parse_deep_link(url) {
        Some(v) => v,
        None => return,
    };
    let auth_state = app.state::<auth::AuthState>();
    if let Err(e) = auth::complete_callback(&auth_state, &code, &state) {
        eprintln!("[auth] deep-link callback rejected: {e}");
    } else {
        // 通知前端刷新登入狀態
        let _ = app.emit("auth://logged-in", serde_json::json!({ "success": true }));
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            let data_dir = app.path().app_data_dir()?;
            app.manage(plugin::AppState {
                plugin_manager: std::sync::Mutex::new(PluginManager::new(data_dir)),
            });
            app.manage(auth::AuthState::new());

            // 註冊 morget:// scheme 並接管回調（在 Rust 側完成 code exchange，
            // 前端不再暴露 auth_callback 命令，杜絕 login CSRF）。
            #[cfg(desktop)]
            {
                let handle = app.handle().clone();
                let _ = handle.deep_link().register_all(); // 已註冊時返回 Err，可安全忽略
                handle.deep_link().on_open_url(move |event| {
                    for u in event.urls() {
                        handle_auth_url(&handle, u.as_str());
                    }
                });
            }

            // 啟動時套用持久化的窗口行為設置（真正生效，而非僅寫入存儲）
            let s = settings::load_settings(&app.handle().clone());
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.set_fullscreen(s.window_mode == "fullscreen");
            }
            settings::apply_auto_start(&app.handle().clone(), s.auto_start);
            settings::apply_tray_icon(&app.handle().clone(), s.show_tray_icon);
            let _ = app.cache_app_data_dir(data_dir);
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let app = window.app_handle();
                let s = settings::load_settings(&app.clone());
                if s.close_behavior == "minimize" && s.show_tray_icon {
                    // 關閉行為 = 最小化到托盤：攔截關閉事件
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            plugin::plugin_list,
            plugin::plugin_install_via_dialog,
            plugin::plugin_uninstall,
            plugin::plugin_toggle,
            settings::settings_get,
            settings::settings_set,
            settings::settings_select_directory,
            settings::settings_get_cache_size,
            settings::settings_clear_cache,
            settings::settings_set_auto_start,
            settings::settings_set_close_behavior,
            settings::settings_set_tray_icon,
            settings::settings_test_notification,
            settings::settings_test_sound,
            settings::settings_toggle_fullscreen,
            settings::settings_set_window_mode,
            settings::settings_check_admin,
            settings::settings_reset_all,
            settings::settings_factory_reset,
            settings::settings_apply_visual,
            auth::auth_get_state,
            auth::auth_login,
            auth::auth_logout,
            market::market_search,
            market::market_report_view,
            market::market_download,
            github::github_auth,
            github::github_get_repos,
            github::github_upload_plugin,
            wallet::wallet_get_info,
            frontend::frontend_get_config,
            frontend::frontend_set_config,
            frontend::frontend_list,
        ])
        .build(tauri::generate_context!())
        .expect("error while building Morget application")
        .run(|_app, _event| {});
}
