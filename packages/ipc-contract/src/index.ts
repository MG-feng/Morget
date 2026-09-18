// 插件相關類型
export type PluginKind = 'MGPN' | 'MGP';

export interface PluginInfo {
  id: string;
  name: string;
  version: string;
  kind: PluginKind;
  description: string;
  path: string;
  isEnabled: boolean;
}

export interface PluginActionResult {
  success: boolean;
  error?: string;
}

export interface PluginInstallResult {
  success: boolean;
  pluginId?: string;
  pluginName?: string;
  cancelled?: boolean;
  error?: string;
}

// 🆕 終極設置面板類型定義 (與 Rust 端 AppSettings 完美對齊)
export interface AppSettings {
  // 常規
  language: string;
  autoUpdate: string; // 'prompt' | 'auto' | 'off'
  pluginAutoUpdate: string;
  autoStart: boolean;
  delayedStart: boolean;
  closeBehavior: string; // 'exit' | 'minimize'
  showTrayIcon: boolean;
  desktopNotifications: boolean;
  soundNotifications: boolean;
  
  // 外觀
  theme: string; // 'dark' | 'light' | 'system'
  scale: number;
  fpsLimit: number;
  vsync: boolean;
  windowMode: string; // 'window' | 'fullscreen'
  customFont: string;
  fontSize: number;
  premiumUI: boolean;
  frontendPack: string;
  
  // 控制
  hotkeyFullscreen: string;
  
  // 高級與性能
  adminMode: boolean;
  proxyMode: string; // 'system' | 'direct' | 'custom'
  proxyUrl: string;
  networkTimeout: number;
  networkLimit: string;
  hardwareRender: string; // 'gpu' | 'cpu'
  adaptiveFps: boolean;
  cpuPrerenderFrames: number;
  logEnabled: boolean;
  logMaxSizeMb: number;
  
  // 存儲
  downloadPath: string;
}

export interface CacheClearResult {
  success: boolean;
  freedMB: number;
}

export interface AuthState {
  isLoggedIn: boolean;
  user?: any;
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

export interface MarketPlugin {
  id: number;
  name: string;
  description: string;
  author: string;
  views: number;
  likes: number;
  downloads: number;
}

export interface MarketActionResult {
  success: boolean;
  error?: string;
}
