import { invoke } from '@tauri-apps/api/core';
import type { PluginInfo, AppSettings, PluginInstallResult, PluginActionResult, CacheClearResult, AuthState, AuthResult } from '@morget/ipc-contract';

export const ipc = {
  plugin: {
    list: (): Promise<PluginInfo[]> => invoke('plugin_list'),
    installViaDialog: (): Promise<PluginInstallResult> => invoke('plugin_install_via_dialog'),
    uninstall: (pluginId: string): Promise<PluginActionResult> => invoke('plugin_uninstall', { pluginId }),
    toggle: (pluginId: string, enabled: boolean): Promise<PluginActionResult> => invoke('plugin_toggle', { pluginId, enabled }),
  },
  settings: {
    get: (): Promise<AppSettings> => invoke('settings_get'),
    set: (settings: Partial<AppSettings>): Promise<PluginActionResult> => invoke('settings_set', { settings }),
    selectDirectory: (): Promise<string | null> => invoke('settings_select_directory'),
    getCacheSize: (): Promise<number> => invoke('settings_get_cache_size'),
    clearCache: (): Promise<CacheClearResult> => invoke('settings_clear_cache'),
  },
  auth: {
    login: (): Promise<AuthResult> => invoke('auth_login'),
    callback: (code: string, callbackState: string): Promise<AuthResult> => invoke('auth_callback', { code, callbackState }),
    getState: (): Promise<AuthState> => invoke('auth_get_state'),
    logout: (): Promise<void> => invoke('auth_logout'),
  },
};
