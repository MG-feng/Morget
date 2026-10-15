import { invoke } from "@tauri-apps/api/core";
import { lang } from "../lang/lang";

export interface ApiError {
  code: string;
  message: string;
}

export interface TrafficPlan {
  period: string;
  direction: string;
  limitMib: number;
  scope: string;
  pluginIds: string[];
}

export interface MorgetConfig {
  general: {
    language: string;
    fps: number;
    verticalSync: boolean;
    cpuPreRenderFrames: number;
  };
  sound: {
    masterVolume: number;
    sfxVolume: number;
    videoVolume: number;
    notifyVolume: number;
  };
  account: {
    signedIn: boolean;
    accountId: string;
    accountRegion: string;
  };
  graphics: {
    windowMode: string;
    windowWidth: number;
    windowHeight: number;
    resolution: string;
    fancyGraphics: boolean;
    uiScale: number;
    fontScale: number;
  };
  style: {
    theme: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    borderColor: string;
    primaryEffectColor: string;
    secondaryEffectColor: string;
    primaryTextColor: string;
    secondaryTextColor: string;
    otherTextColor: string;
  };
  hotkeys: {
    fullscreen: string;
    restart: string;
    close: string;
  };
  advanced: {
    adminPrivilege: boolean;
    closeBehavior: string;
    closeDontAsk: boolean;
    frontendPackage: string;
    backendPackage: string;
    renderHardware: string;
    cpuRenderThreads: number;
    cpuThreadLimit: number;
    cpuUsageLimit: number;
    ramLimitMib: number;
    romLimitMib: number;
    gpuUsageLimit: number;
  };
  network: {
    uploadBandwidthLimit: number;
    uploadThreadLimit: number;
    downloadBandwidthLimit: number;
    downloadThreadLimit: number;
    trafficPlans: TrafficPlan[];
  };
  services: {
    marketApiUrl: string;
    authDomain: string;
  };
}

export interface SystemInfo {
  os: string;
  logicalCpuThreads: number;
  physicalCores: number;
  totalRamMib: number;
  gpus: string[];
  elevated: boolean;
}

export interface MarketPlugin {
  id: string;
  name: string;
  summary: string;
  version: string;
  downloads: number;
}

export interface InstalledPluginInfo {
  fileName: string;
  kind: string;
  sizeBytes: number;
  modifiedMs: number;
}

export interface StorageEntry {
  id: string;
  path: string;
  sizeBytes: number;
  exists: boolean;
}

export interface DataPaths {
  baseDir: string;
  pluginsDir: string;
  packagesDir: string;
  cacheDir: string;
}

export interface CloseState {
  gen: number;
  acked: boolean;
}

export const isDesktop: boolean =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export function asApiError(e: unknown): ApiError {
  if (e && typeof e === "object" && "code" in (e as Record<string, unknown>)) {
    return e as ApiError;
  }

  return { code: "UNKNOWN", message: String(e) };
}

export function errorText(e: unknown): string {
  const err = asApiError(e);
  const key = `error.${err.code.toLowerCase()}`;
  const translated = lang(key);
  return translated === key ? err.message || err.code : translated;
}

function requireDesktop(): void {
  if (!isDesktop) {
    throw {
      code: "PLATFORM_UNSUPPORTED",
      message: "desktop only",
    } as ApiError;
  }
}

export const cmd = {
  getConfig: (): Promise<MorgetConfig> => {
    requireDesktop();
    return invoke<MorgetConfig>("get_config");
  },

  saveConfig: (config: MorgetConfig): Promise<void> => {
    requireDesktop();
    return invoke("save_config", { config });
  },

  resetConfig: (): Promise<MorgetConfig> => {
    requireDesktop();
    return invoke<MorgetConfig>("reset_config");
  },

  getDataPaths: (): Promise<DataPaths> => {
    requireDesktop();
    return invoke<DataPaths>("get_data_paths");
  },

  getSystemInfo: (): Promise<SystemInfo> => {
    requireDesktop();
    return invoke<SystemInfo>("get_system_info");
  },

  applyWindowMode: (mode: string, width: number, height: number): Promise<void> => {
    requireDesktop();
    return invoke("apply_window_mode", { mode, width, height });
  },

  restartApp: (): Promise<void> => {
    requireDesktop();
    return invoke("restart_app");
  },

  requestClose: (): Promise<void> => {
    requireDesktop();
    return invoke("request_close");
  },

  resolveCloseRequest: (action: string): Promise<void> => {
    requireDesktop();
    return invoke("resolve_close_request", { action });
  },

  ackCloseRequest: (): Promise<void> => {
    requireDesktop();
    return invoke("ack_close_request");
  },

  getCloseState: (): Promise<CloseState> => {
    requireDesktop();
    return invoke<CloseState>("get_close_state");
  },

  requestAdminRelaunch: (): Promise<void> => {
    requireDesktop();
    return invoke("request_admin_relaunch");
  },

  fetchMarketPlugins: (): Promise<MarketPlugin[]> => {
    requireDesktop();
    return invoke<MarketPlugin[]>("fetch_market_plugins");
  },

  listInstalledPlugins: (): Promise<InstalledPluginInfo[]> => {
    requireDesktop();
    return invoke<InstalledPluginInfo[]>("list_installed_plugins");
  },

  listPackages: (kind: string): Promise<string[]> => {
    requireDesktop();
    return invoke<string[]>("list_packages", { kind });
  },

  importPackage: (sourcePath: string, kind: string): Promise<string> => {
    requireDesktop();
    return invoke<string>("import_package", { sourcePath, kind });
  },

  setActivePackage: (kind: string, name: string): Promise<void> => {
    requireDesktop();
    return invoke("set_active_package", { kind, name });
  },

  exportToFile: (fileName: string, kind: string): Promise<string> => {
    requireDesktop();
    return invoke<string>("export_to_file", { fileName, kind });
  },

  getStorageUsage: (): Promise<StorageEntry[]> => {
    requireDesktop();
    return invoke<StorageEntry[]>("get_storage_usage");
  },

  getDeleteToken: (id: string): Promise<string> => {
    requireDesktop();
    return invoke<string>("get_delete_token", { id });
  },

  deleteStorage: (id: string, confirmToken: string): Promise<void> => {
    requireDesktop();
    return invoke("delete_storage", { id, confirmToken });
  },

  openFolder: (path: string): Promise<void> => {
    requireDesktop();
    return invoke("open_folder", { path });
  },
};
