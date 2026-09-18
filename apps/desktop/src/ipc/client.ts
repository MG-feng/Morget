import { invoke } from '@tauri-apps/api/core';
import type { PluginInfo, AppSettings } from '@morget/ipc-contract';

export const ipc = {
  plugin: {
    list: (): Promise<PluginInfo[]> => invoke('plugin_list'),
    installViaDialog: (): Promise<{ success: boolean; cancelled?: boolean; error?: string }> => invoke('plugin_install_via_dialog'),
    uninstall: (pluginId: string): Promise<{ success: boolean; error?: string }> => invoke('plugin_uninstall', { pluginId }),
    toggle: (pluginId: string, enabled: boolean): Promise<{ success: boolean; error?: string }> => invoke('plugin_toggle', { pluginId, enabled }),
  },
  settings: {
    get: (): Promise<AppSettings> => invoke('settings_get'),
    set: (settings: Partial<AppSettings>): Promise<{ success: boolean }> => invoke('settings_set', { settings }),
    selectDirectory: (): Promise<string | null> => invoke('settings_select_directory'),
    getCacheSize: (): Promise<number> => invoke('settings_get_cache_size'),
    clearCache: (): Promise<{ success: boolean; freedMB: number }> => invoke('settings_clear_cache'),
  },
};
