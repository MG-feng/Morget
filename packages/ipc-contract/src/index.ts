export type PluginKind = 'MGPN' | 'MGP';
export interface PluginInfo { id: string; name: string; version: string; kind: PluginKind; description: string; path: string; isEnabled: boolean; }
export type ThemeMode = 'dark' | 'light' | 'system';
export type LocaleKey = 'zh-TW' | 'zh-CN' | 'en-US';
export type LoadingMode = 'stream' | 'full';
export type GpuMode = 'auto' | 'integrated' | 'dedicated';

export interface AppSettings { language: LocaleKey; autoUpdate: boolean; theme: ThemeMode; scale: number; loadingMode: LoadingMode; gpuMode: GpuMode; fps: number; vsync: boolean; premiumUI: boolean; downloadPath: string; }
export interface PluginInstallResult { success: boolean; cancelled?: boolean; pluginId?: string; pluginName?: string; error?: string; }
export interface PluginActionResult { success: boolean; error?: string; }
export interface CacheClearResult { success: boolean; freedMB: number; }
export interface UserInfo { id: string; email: string; name?: string; }
export interface AuthState { isLoggedIn: boolean; user?: UserInfo; }
export interface AuthResult { success: boolean; error?: string; }

// Phase 3 Types
export interface MarketVersion { id: number; version: string; url: string; }
export interface MarketPlugin { id: number; name: string; description: string; author: string; views: number; likes: number; downloads: number; versions: MarketVersion[]; }
export interface MarketActionResult { success: boolean; g_coins_earned?: number; download_url?: string; error?: string; message?: string; }
export interface GitHubRepo { name: string; full_name: string; }
export interface WalletInfo { balance: number; transactions: { id: number; amount: number; reason: string; created_at: string }[]; }
