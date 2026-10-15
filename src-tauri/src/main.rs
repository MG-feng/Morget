#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(target_os = "windows")]
fn ensure_elevated() {
    if std::env::args().any(|a| a == "--elevated") {
        return;
    }

    if morget_backend_lib::platform::is_elevated() {
        return;
    }

    if morget_backend_lib::platform::is_another_instance_alive() {
        return;
    }

    if !morget_backend_lib::morgetConfig::read_admin_privilege_pref() {
        return;
    }

    match morget_backend_lib::platform::relaunch_elevated() {
        Ok(true) => std::process::exit(0),
        Ok(false) => {}
        Err(e) => eprintln!("[Morget] elevation failed: {e}"),
    }
}

fn main() {
    #[cfg(target_os = "windows")]
    ensure_elevated();

    morget_backend_lib::run();
}
