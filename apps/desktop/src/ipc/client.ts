import { invoke } from '@tauri-apps/api/core';

export const ipc = {
  plugin: { list: () => invoke<any[]>('plugin_list'), installViaDialog: () => invoke<any>('plugin_install_via_dialog'), uninstall: (id: string) => invoke<any>('plugin_uninstall', { pluginId: id }), toggle: (id: string, en: boolean) => invoke<any>('plugin_toggle', { pluginId: id, enabled: en }) },
  settings: { get: () => invoke<any>('settings_get'), set: (s: any) => invoke<any>('settings_set', { settings: s }), selectDirectory: () => invoke<any>('settings_select_directory'), pickPluginFile: () => invoke<any>('settings_pick_plugin_file'), getCacheSize: () => invoke<number>('settings_get_cache_size'), clearCache: () => invoke<any>('settings_clear_cache') },
  auth: { login: () => invoke<any>('auth_login'), callback: (c: string, s: string) => invoke<any>('auth_callback', { code: c, callbackState: s }), getState: () => invoke<any>('auth_get_state'), logout: () => invoke<any>('auth_logout') },
  market: { search: (q: string) => invoke<any[]>('market_search', { query: q }), reportView: (id: number, sec: number) => invoke<any>('market_report_view', { pluginId: id, durationSec: sec }), download: (pid: number, vid: number) => invoke<any>('market_download', { pluginId: pid, versionId: vid }) },
  github: { auth: () => invoke<any>('github_auth'), getRepos: () => invoke<any[]>('github_get_repos'), upload: (r: string, v: string, f: string) => invoke<any>('github_upload_plugin', { repoName: r, version: v, filePath: f }) },
  wallet: { getInfo: () => invoke<any>('wallet_get_info') }
};
