import { invoke } from '@tauri-apps/api/core';
import type { PluginInfo } from '@morget/ipc-contract';

export const ipc = {
  plugin: {
    list: () => invoke<PluginInfo[]>('plugin_list'),
    install: (path: string) => invoke<{ success: boolean; error?: string }>('plugin_install', { path }),
    uninstall: (pluginId: string) => invoke<{ success: boolean; error?: string }>('plugin_uninstall', { pluginId }),
    toggle: (pluginId: string, enabled: boolean) => invoke<{ success: boolean; error?: string }>('plugin_toggle', { pluginId, enabled }),
  },
  settings: {
    get: () => invoke<any>('settings_get'),
    set: (settings: any) => invoke<{ success: boolean }>('settings_set', { settings }),
    selectDirectory: () => invoke<string | null>('settings_select_directory'),
    pickPluginFile: () => invoke<string | null>('settings_pick_plugin_file'),
    getCacheSize: () => invoke<number>('settings_get_cache_size'),
    clearCache: () => invoke<{ success: boolean; freedMB: number }>('settings_clear_cache'),
    setAutoStart: (enabled: boolean) => invoke<void>('settings_set_auto_start', { enabled }),
    setCloseBehavior: (behavior: string) => invoke<void>('settings_set_close_behavior', { behavior }),
    setTrayIcon: (enabled: boolean) => invoke<void>('settings_set_tray_icon', { enabled }),
    testNotification: () => invoke<void>('settings_test_notification'),
    testSound: () => invoke<void>('settings_test_sound'),
    toggleFullscreen: () => invoke<void>('settings_toggle_fullscreen'),
    setWindowMode: (mode: string) => invoke<void>('settings_set_window_mode', { mode }),
    checkAdmin: () => invoke<boolean>('settings_check_admin'),
    resetAll: () => invoke<void>('settings_reset_all'),
    factoryReset: () => invoke<void>('settings_factory_reset'),
  },
};
