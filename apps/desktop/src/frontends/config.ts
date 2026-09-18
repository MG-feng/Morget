import { invoke } from '@tauri-apps/api/core';

export interface FrontendManifest {
  id: string;
  name: string;
  author: string;
  version: string;
  description: string;
  hasPremium: boolean;
}

export interface FrontendConfig {
  active: string;
  premiumEnabled: boolean;
}

// 默认配置（当没有外部配置时使用）
const DEFAULT_CONFIG: FrontendConfig = {
  active: 'default',
  premiumEnabled: false,
};

export async function getFrontendConfig(): Promise<FrontendConfig> {
  try {
    const config = await invoke<FrontendConfig>('frontend_get_config');
    return config;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function setFrontendConfig(config: Partial<FrontendConfig>): Promise<void> {
  await invoke('frontend_set_config', { config });
}

export async function listFrontends(): Promise<FrontendManifest[]> {
  try {
    return await invoke<FrontendManifest[]>('frontend_list');
  } catch {
    return [];
  }
}
