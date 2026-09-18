import { invoke } from '@tauri-apps/api/core';
import type { PluginInfo, AppSettings, PluginInstallResult, PluginActionResult, CacheClearResult, AuthState, AuthResult, MarketPlugin, MarketActionResult } from '@morget/ipc-contract';

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
    pickPluginFile: (): Promise<string | null> => invoke('settings_pick_plugin_file'),
    getCacheSize: (): Promise<number> => invoke('settings_get_cache_size'),
    clearCache: (): Promise<CacheClearResult> => invoke('settings_clear_cache'),
  },
  auth: {
    login: (): Promise<AuthResult> => invoke('auth_login'),
    callback: (code: string, callbackState: string): Promise<AuthResult> => invoke('auth_callback', { code, callbackState }),
    getState: (): Promise<AuthState> => invoke('auth_get_state'),
    logout: (): Promise<void> => invoke('auth_logout'),
  },
  market: {
    search: (query: string): Promise<MarketPlugin[]> => invoke('market_search', { query }),
    reportView: (pluginId: number, durationSec: number): Promise<MarketActionResult> => invoke('market_report_view', { pluginId, durationSec }),
    download: (pluginId: number, versionId: number): Promise<MarketActionResult> => invoke('market_download', { pluginId, versionId }),
  },
  github: {
    auth: (): Promise<any> => invoke('github_auth'),
    getRepos: (): Promise<any[]> => invoke('github_get_repos'),
    upload: (repoName: string, version: string, filePath: string): Promise<any> => invoke('github_upload_plugin', { repoName, version, filePath }),
  },
  wallet: {
    getInfo: (): Promise<any> => invoke('wallet_get_info'),
  }
};
