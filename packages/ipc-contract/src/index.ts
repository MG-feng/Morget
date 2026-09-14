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

export interface AppSettings {
  language: 'zh-TW' | 'en-US' | 'zh-CN';
  theme: 'light' | 'dark' | 'system';
  scale: number; // 0.8 to 1.5
  downloadPath: string;
  autoUpdate: boolean;
  cacheSizeMB?: number; // 僅前端讀取，後端計算
}

export interface Commands {
  'plugin:list': () => Promise<PluginInfo[]>;
  'plugin:install': (path: string) => Promise<{ success: boolean; error?: string }>;
  'plugin:uninstall': (pluginId: string) => Promise<{ success: boolean; error?: string }>;
  'plugin:toggle': (pluginId: string, enabled: boolean) => Promise<{ success: boolean; error?: string }>;
  
  'settings:get': () => Promise<AppSettings>;
  'settings:set': (settings: Partial<AppSettings>) => Promise<{ success: boolean }>;
  'settings:select_directory': () => Promise<string | null>;
  'settings:clear_cache': () => Promise<{ success: boolean; freedMB: number }>;
  'settings:get_cache_size': () => Promise<number>;
}