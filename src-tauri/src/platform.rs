use std::path::{Path, PathBuf};

pub fn is_elevated() -> bool {
    #[cfg(target_os = "windows")]
    {
        is_elevated::is_elevated()
    }

    #[cfg(not(target_os = "windows"))]
    {
        false
    }
}

pub fn instance_lock_path() -> PathBuf {
    crate::morgetConfig::pre_init_base_dir().join("instance.lock")
}

pub fn write_instance_lock() {
    let path = instance_lock_path();
    if let Some(parent) = path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    let _ = std::fs::write(path, std::process::id().to_string());
}

pub fn is_another_instance_alive() -> bool {
    let path = instance_lock_path();

    let text = match std::fs::read_to_string(path) {
        Ok(t) => t,
        Err(_) => return false,
    };

    let first_line = match text.lines().next() {
        Some(l) => l.trim(),
        None => return false,
    };

    let pid = match first_line.parse::<usize>() {
        Ok(p) => p,
        Err(_) => return false,
    };

    if pid == std::process::id() as usize {
        return false;
    }

    let mut sys = sysinfo::System::new();
    sys.refresh_processes();

    sys.process(sysinfo::Pid::from(pid)).is_some()
}

pub fn relaunch_elevated() -> std::io::Result<bool> {
    #[cfg(target_os = "windows")]
    {
        let exe = std::env::current_exe()?;
        let exe_str = exe.display().to_string().replace('\'', "''");

        let script = format!(
            "Start-Process -FilePath '{}' -ArgumentList '--elevated' -Verb RunAs",
            exe_str
        );

        let status = std::process::Command::new("powershell")
            .args(["-NoProfile", "-Command", &script])
            .status()?;

        Ok(status.success())
    }

    #[cfg(not(target_os = "windows"))]
    {
        Ok(false)
    }
}

pub fn relaunch_self_after_exit() -> std::io::Result<()> {
    #[cfg(target_os = "windows")]
    {
        let exe = std::env::current_exe()?;
        let pid = std::process::id();
        let exe_str = exe.display().to_string().replace('\'', "''");

        let script = format!(
            "Wait-Process -Id {} -ErrorAction SilentlyContinue; Start-Process -FilePath '{}'",
            pid, exe_str
        );

        std::process::Command::new("powershell")
            .args(["-NoProfile", "-Command", &script])
            .spawn()?;

        Ok(())
    }

    #[cfg(not(target_os = "windows"))]
    {
        let exe = std::env::current_exe()?;
        let exe_str = exe.display().to_string().replace('\'', "'\\''");

        std::process::Command::new("sh")
            .args(["-c", &format!("sleep 1; exec '{}'", exe_str)])
            .spawn()?;

        Ok(())
    }
}

#[cfg(target_os = "windows")]
pub fn relaunch_elevated_with_feedback(marker: &Path) -> std::io::Result<bool> {
    let exe = std::env::current_exe()?;
    let pid = std::process::id();

    let esc = |s: String| s.replace('\'', "''");

    let helper = std::env::temp_dir().join(format!("morget_elevate_{}.ps1", pid));

    let helper_script = format!(
        "Set-Content -LiteralPath '{}' -Value 'consented'\n\
         Wait-Process -Id {} -ErrorAction SilentlyContinue\n\
         Start-Process -FilePath '{}' -ArgumentList '--elevated'\n",
        esc(marker.display().to_string()),
        pid,
        esc(exe.display().to_string())
    );

    std::fs::write(&helper, helper_script)?;

    let helper_str = esc(helper.display().to_string());

    let script = format!(
        "try {{ Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File','{}'; exit 0 }} catch {{ exit 1 }}",
        helper_str
    );

    let status = std::process::Command::new("powershell")
        .args(["-NoProfile", "-Command", &script])
        .status()?;

    Ok(status.success())
}

#[cfg(not(target_os = "windows"))]
pub fn relaunch_elevated_with_feedback(_marker: &Path) -> std::io::Result<bool> {
    Ok(false)
}

pub fn detect_gpus() -> Vec<String> {
    #[cfg(target_os = "windows")]
    {
        if let Ok(out) = std::process::Command::new("powershell")
            .args([
                "-NoProfile",
                "-Command",
                "Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name",
            ])
            .output()
        {
            if out.status.success() {
                let text = String::from_utf8_lossy(&out.stdout).to_string();

                let mut gpus: Vec<String> = text
                    .lines()
                    .map(|l| l.trim().to_string())
                    .filter(|l| !l.is_empty())
                    .collect();

                gpus.sort();
                gpus.dedup();

                if !gpus.is_empty() {
                    return gpus;
                }
            }
        }
    }

    vec!["auto".to_string()]
}

pub fn open_folder(path: &str) -> std::io::Result<()> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer").arg(path).spawn()?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open").arg(path).spawn()?;
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        std::process::Command::new("xdg-open").arg(path).spawn()?;
    }

    Ok(())
}

pub fn dir_size(path: &Path) -> u64 {
    let mut total = 0u64;

    if let Ok(entries) = std::fs::read_dir(path) {
        for entry in entries.flatten() {
            let p = entry.path();

            if p.is_symlink() {
                continue;
            }

            if p.is_dir() {
                total += dir_size(&p);
            } else if let Ok(md) = p.metadata() {
                total += md.len();
            }
        }
    }

    total
}
