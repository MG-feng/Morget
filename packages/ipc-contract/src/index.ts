export type PluginKind = 'MGPN' | 'MGP';
export interface PluginInfo { id: string; name: string; version: string; kind: PluginKind; description: string; path: string; isEnabled: boolean; }
export type ThemeMode = 'dark' | 'light' | 'system';
export type LocaleKey = 'zh-TW' | 'zh-CN' | 'en-US';
export type LoadingMode = 'stream' | 'full';
export type GpuMode = 'auto' | 'integrated' | 'dedicated';

export interface AppSettings {
  language: LocaleKey; autoUpdate: boolean; theme: ThemeMode; scale: number;
  loadingMode: LoadingMode; gpuMode: GpuMode; fps: number; vsync: boolean; premiumUI: boolean; downloadPath: string;
}

export interface PluginInstallResult { success: boolean; cancelled?: boolean; pluginId?: string; pluginName?: string; error?: string; }
export interface PluginActionResult { success: boolean; error?: string; }
export interface CacheClearResult { success: boolean; freedMB: number; }

export interface UserInfo { id: string; email: string; name?: string; }
export interface AuthState { isLoggedIn: boolean; user?: UserInfo; }
export interface AuthResult { success: boolean; error?: string; }
