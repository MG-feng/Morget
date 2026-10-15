use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct GeneralSettings {
    pub language: String,
    pub fps: u32,
    pub verticalSync: bool,
    pub cpuPreRenderFrames: u32,
}

impl Default for GeneralSettings {
    fn default() -> Self {
        Self {
            language: "zh-CN".into(),
            fps: 0,
            verticalSync: true,
            cpuPreRenderFrames: 0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct SoundSettings {
    pub masterVolume: u32,
    pub sfxVolume: u32,
    pub videoVolume: u32,
    pub notifyVolume: u32,
}

impl Default for SoundSettings {
    fn default() -> Self {
        Self {
            masterVolume: 100,
            sfxVolume: 100,
            videoVolume: 100,
            notifyVolume: 100,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default)]
pub struct AccountSettings {
    pub signedIn: bool,
    pub accountId: String,
    pub accountRegion: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct GraphicsSettings {
    pub windowMode: String,
    pub windowWidth: u32,
    pub windowHeight: u32,
    pub resolution: String,
    pub fancyGraphics: bool,
    pub uiScale: u32,
    pub fontScale: u32,
}

impl Default for GraphicsSettings {
    fn default() -> Self {
        Self {
            windowMode: "windowed".into(),
            windowWidth: 1280,
            windowHeight: 720,
            resolution: "auto".into(),
            fancyGraphics: false,
            uiScale: 50,
            fontScale: 50,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct StyleSettings {
    pub theme: String,
    pub primaryColor: String,
    pub secondaryColor: String,
    pub accentColor: String,
    pub backgroundColor: String,
    pub borderColor: String,
    pub primaryEffectColor: String,
    pub secondaryEffectColor: String,
    pub primaryTextColor: String,
    pub secondaryTextColor: String,
    pub otherTextColor: String,
}

impl Default for StyleSettings {
    fn default() -> Self {
        Self {
            theme: "dark".into(),
            primaryColor: "#2563eb".into(),
            secondaryColor: "#000000".into(),
            accentColor: "#3b82f6".into(),
            backgroundColor: "#1c1f26".into(),
            borderColor: "#000000".into(),
            primaryEffectColor: "#1e3a8a".into(),
            secondaryEffectColor: "#1e3a8a".into(),
            primaryTextColor: "#93c5fd".into(),
            secondaryTextColor: "#93c5fd".into(),
            otherTextColor: "#93c5fd".into(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct HotkeySettings {
    pub fullscreen: String,
    pub restart: String,
    pub close: String,
}

impl Default for HotkeySettings {
    fn default() -> Self {
        Self {
            fullscreen: "F11".into(),
            restart: "Ctrl+Alt+R".into(),
            close: "Alt+F4".into(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default)]
pub struct TrafficPlan {
    pub period: String,
    pub direction: String,
    pub limitMib: u64,
    pub scope: String,
    pub pluginIds: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct NetworkSettings {
    pub uploadBandwidthLimit: u64,
    pub uploadThreadLimit: u32,
    pub downloadBandwidthLimit: u64,
    pub downloadThreadLimit: u32,
    pub trafficPlans: Vec<TrafficPlan>,
}

impl Default for NetworkSettings {
    fn default() -> Self {
        Self {
            uploadBandwidthLimit: 0,
            uploadThreadLimit: 1,
            downloadBandwidthLimit: 0,
            downloadThreadLimit: 1,
            trafficPlans: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct AdvancedSettings {
    pub adminPrivilege: bool,
    pub closeBehavior: String,
    pub closeDontAsk: bool,
    pub frontendPackage: String,
    pub backendPackage: String,
    pub renderHardware: String,
    pub cpuRenderThreads: u32,
    pub cpuThreadLimit: u32,
    pub cpuUsageLimit: u32,
    pub ramLimitMib: u32,
    pub romLimitMib: u32,
    pub gpuUsageLimit: u32,
}

impl Default for AdvancedSettings {
    fn default() -> Self {
        Self {
            adminPrivilege: true,
            closeBehavior: "ask".into(),
            closeDontAsk: false,
            frontendPackage: "default".into(),
            backendPackage: "default".into(),
            renderHardware: "auto".into(),
            cpuRenderThreads: 1,
            cpuThreadLimit: 1,
            cpuUsageLimit: 100,
            ramLimitMib: 1024,
            romLimitMib: 10240,
            gpuUsageLimit: 100,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default)]
pub struct ServiceSettings {
    pub marketApiUrl: String,
    pub authDomain: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(default)]
pub struct MorgetConfig {
    pub general: GeneralSettings,
    pub sound: SoundSettings,
    pub account: AccountSettings,
    pub graphics: GraphicsSettings,
    pub style: StyleSettings,
    pub hotkeys: HotkeySettings,
    pub advanced: AdvancedSettings,
    pub network: NetworkSettings,
    pub services: ServiceSettings,
}

pub fn config_file_path(base: &Path) -> std::path::PathBuf {
    base.join("morgetConfig.json")
}

pub fn load_config(base: &Path) -> MorgetConfig {
    match std::fs::read_to_string(config_file_path(base)) {
        Ok(s) => serde_json::from_str(&s).unwrap_or_default(),
        Err(_) => MorgetConfig::default(),
    }
}

pub fn save_config(base: &Path, cfg: &MorgetConfig) -> std::io::Result<()> {
    std::fs::create_dir_all(base)?;
    let s = serde_json::to_string_pretty(cfg)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;
    std::fs::write(config_file_path(base), s)
}

pub fn pre_init_base_dir() -> std::path::PathBuf {
    #[cfg(target_os = "windows")]
    {
        if let Ok(roaming) = std::env::var("APPDATA") {
            return std::path::PathBuf::from(roaming).join("com.morget.app");
        }
    }

    #[cfg(target_os = "macos")]
    {
        if let Ok(home) = std::env::var("HOME") {
            return std::path::PathBuf::from(home)
                .join("Library")
                .join("Application Support")
                .join("com.morget.app");
        }
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        if let Ok(xdg) = std::env::var("XDG_CONFIG_HOME") {
            return std::path::PathBuf::from(xdg).join("com.morget.app");
        }

        if let Ok(home) = std::env::var("HOME") {
            return std::path::PathBuf::from(home)
                .join(".config")
                .join("com.morget.app");
        }
    }

    std::path::PathBuf::from(".")
}

pub fn read_admin_privilege_pref() -> bool {
    load_config(&pre_init_base_dir()).advanced.adminPrivilege
}
