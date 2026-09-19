import { invoke } from '@tauri-apps/api/core';

export const ipc = {
  plugin: {
    list: () => invoke<any[]>('plugin_list'),
    // ✅ 修復：適配後端真實的 plugin_install_via_dialog
    install: () => invoke<any>('plugin_install_via_dialog'),
    uninstall: (pluginId: string) => invoke<any>('plugin_uninstall', { pluginId }),
    toggle: (pluginId: string, enabled: boolean) => invoke<any>('plugin_toggle', { pluginId, enabled }),
  },
  settings: {
    get: () => invoke<any>('settings_get'),
    set: (settings: any) => invoke<any>('settings_set', { settings }),
    selectDirectory: () => invoke<string | null>('settings_select_directory'),
    getCacheSize: () => invoke<number>('settings_get_cache_size'),
    clearCache: () => invoke<any>('settings_clear_cache'),
    setAutoStart: (enabled: boolean) => invoke<any>('settings_set_auto_start', { enabled }),
    setCloseBehavior: (behavior: string) => invoke<any>('settings_set_close_behavior', { behavior }),
    setTrayIcon: (enabled: boolean) => invoke<any>('settings_set_tray_icon', { enabled }),
    testNotification: () => invoke<any>('settings_test_notification'),
    testSound: () => invoke<any>('settings_test_sound'),
    toggleFullscreen: () => invoke<any>('settings_toggle_fullscreen'),
    setWindowMode: (mode: string) => invoke<any>('settings_set_window_mode', { mode }),
    checkAdmin: () => invoke<boolean>('settings_check_admin'),
    resetAll: () => invoke<any>('settings_reset_all'),
    factoryReset: () => invoke<any>('settings_factory_reset'),
  },
};
