import { cmd, isDesktop, errorText, MorgetConfig } from "../bridge/backendApi";
import { showToast } from "../ui/components";
import { lang } from "../lang/lang";

export const DEFAULT_CONFIG: MorgetConfig = {
  general: {
    language: "zh-CN",
    fps: 0,
    verticalSync: true,
    cpuPreRenderFrames: 0,
  },
  sound: {
    masterVolume: 100,
    sfxVolume: 100,
    videoVolume: 100,
    notifyVolume: 100,
  },
  account: {
    signedIn: false,
    accountId: "",
    accountRegion: "",
  },
  graphics: {
    windowMode: "windowed",
    windowWidth: 1280,
    windowHeight: 720,
    resolution: "auto",
    fancyGraphics: false,
    uiScale: 50,
    fontScale: 50,
  },
  style: {
    theme: "dark",
    primaryColor: "#2563eb",
    secondaryColor: "#000000",
    accentColor: "#3b82f6",
    backgroundColor: "#1c1f26",
    borderColor: "#000000",
    primaryEffectColor: "#1e3a8a",
    secondaryEffectColor: "#1e3a8a",
    primaryTextColor: "#93c5fd",
    secondaryTextColor: "#93c5fd",
    otherTextColor: "#93c5fd",
  },
  hotkeys: {
    fullscreen: "F11",
    restart: "Ctrl+Alt+R",
    close: "Alt+F4",
  },
  advanced: {
    adminPrivilege: true,
    closeBehavior: "ask",
    closeDontAsk: false,
    frontendPackage: "default",
    backendPackage: "default",
    renderHardware: "auto",
    cpuRenderThreads: 1,
    cpuThreadLimit: 1,
    cpuUsageLimit: 100,
    ramLimitMib: 1024,
    romLimitMib: 10240,
    gpuUsageLimit: 100,
  },
  network: {
    uploadBandwidthLimit: 0,
    uploadThreadLimit: 1,
    downloadBandwidthLimit: 0,
    downloadThreadLimit: 1,
    trafficPlans: [],
  },
  services: {
    marketApiUrl: "",
    authDomain: "",
  },
};

let current: MorgetConfig | null = null;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<(cfg: MorgetConfig) => void>();

export async function initConfig(): Promise<MorgetConfig> {
  if (isDesktop) {
    try {
      current = await cmd.getConfig();
    } catch (e) {
      current = JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as MorgetConfig;
      showToast(lang("toast.error", { message: errorText(e) }), "error");
    }
  } else {
    current = JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as MorgetConfig;
  }

  return current;
}

export function getConfig(): MorgetConfig {
  if (!current) throw new Error("config not initialized");
  return current;
}

export function onConfigChange(fn: (cfg: MorgetConfig) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function updateConfig(mutate: (cfg: MorgetConfig) => void): void {
  if (!current) return;

  mutate(current);
  listeners.forEach((fn) => fn(current!));

  if (isDesktop) {
    clearTimeout(saveTimer);

    const snapshot = JSON.parse(JSON.stringify(current)) as MorgetConfig;

    saveTimer = setTimeout(() => {
      cmd.saveConfig(snapshot).catch((e) => {
        showToast(lang("toast.error", { message: errorText(e) }), "error");
      });
    }, 300);
  }
}

export async function saveNow(): Promise<void> {
  if (!current || !isDesktop) return;

  clearTimeout(saveTimer);
  const snapshot = JSON.parse(JSON.stringify(current)) as MorgetConfig;
  await cmd.saveConfig(snapshot);
}

export function getPath(cfg: MorgetConfig, path: string): unknown {
  return path.split(".").reduce<unknown>(
    (o, k) => (o as Record<string, unknown> | undefined)?.[k],
    cfg
  );
}

export function setPath(cfg: MorgetConfig, path: string, value: unknown): void {
  const keys = path.split(".");
  let target: Record<string, unknown> = cfg as unknown as Record<string, unknown>;

  for (let i = 0; i < keys.length - 1; i++) {
    target = target[keys[i]] as Record<string, unknown>;
  }

  target[keys[keys.length - 1]] = value;
}
