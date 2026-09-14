import { invoke } from '@tauri-apps/api/core';
import type { Commands, PluginInfo, AppSettings } from '@morget/ipc-contract';

export const ipc = {
  plugin: {
    list: () => invoke<PluginInfo[]>('plugin_list'),
    install: (path: string) => invoke<{ success: boolean; error?: string }>('plugin_install', { path }),
    uninstall: (pluginId: string) => invoke<{ success: boolean; error?: string }>('plugin_uninstall', { pluginId }),
    toggle: (pluginId: string, enabled: boolean) =>
      invoke<{ success: boolean; error?: string }>('plugin_toggle', { pluginId, enabled }),
  },
  settings: {
    get: () => invoke<AppSettings>('settings_get'),
    set: (settings: Partial<AppSettings>) => invoke<{ success: boolean }>('settings_set', { settings }),
    selectDirectory: () => invoke<string | null>('settings_select_directory'),
    getCacheSize: () => invoke<number>('settings_get_cache_size'),
    clearCache: () => invoke<{ success: boolean; freedMB: number }>('settings_clear_cache'),
  },
};