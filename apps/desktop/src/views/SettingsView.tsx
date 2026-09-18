import React, { useState, useEffect } from 'react';
import { ipc } from '../ipc/client.ts';
import type { AppSettings } from '@morget/ipc-contract';
import { useI18n } from '../frontends/default/I18nProvider.tsx';
import { useMorgetDialog } from '../components/MorgetDialog.tsx';

export default function SettingsView() {
  const { t, setLocale } = useI18n();
  const dialog = useMorgetDialog();
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'storage'>('general');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [cacheSize, setCacheSize] = useState<number>(0);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const s = await ipc.settings.get();
    setSettings(s);
    const size = await ipc.settings.getCacheSize();
    setCacheSize(size);
  };

  const updateSetting = async (key: keyof AppSettings, value: any) => {
    if (!settings) return;
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await ipc.settings.set({ [key]: value });
  };

  const handleLanguageChange = async (value: string) => {
    await updateSetting('language', value);
    setLocale(value); // ✅ 即時刷新 UI
  };

  const handleSelectDir = async () => {
    const dir = await ipc.settings.selectDirectory();
    if (dir) updateSetting('downloadPath', dir);
  };

  const handleClearCache = async () => {
    const res = await ipc.settings.clearCache();
    dialog.alert(t('settings.cache.cleared', { size: res.freedMB.toFixed(2) })); // ✅ 使用自定義彈窗
    setCacheSize(0);
  };

  if (!settings) return <div>{t('common.loading', {}, '載入中...')}</div>;

  return (
    <div>
      <div className="panel-header"><h2>{t('nav.settings')}</h2></div>
      <div className="settings-tabs">
        <button className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>{t('settings.tab.general', {}, '常規')}</button>
        <button className={`settings-tab ${activeTab === 'appearance' ? 'active' : ''}`} onClick={() => setActiveTab('appearance')}>{t('settings.tab.appearance', {}, '外觀')}</button>
        <button className={`settings-tab ${activeTab === 'storage' ? 'active' : ''}`} onClick={() => setActiveTab('storage')}>{t('settings.tab.storage', {}, '存儲與緩存')}</button>
      </div>

      {activeTab === 'general' && (
        <div className="settings-group">
          <h3>{t('settings.tab.general', {}, '基本設置')}</h3>
          <div className="setting-row">
            <div className="setting-label"><span>{t('settings.language', {}, '語言')}</span><small>{t('settings.language.hint', {}, '更改後即時生效')}</small></div>
            <div className="setting-control">
              <select value={settings.language} onChange={(e) => handleLanguageChange(e.target.value)}>
                <option value="zh-TW">繁體中文</option><option value="zh-CN">簡體中文</option><option value="en-US">English</option>
              </select>
            </div>
          </div>
          <div className="setting-row">
            <div className="setting-label"><span>{t('settings.autoUpdate', {}, '自動更新')}</span><small>{t('settings.autoUpdate.hint', {}, '當有新版本時自動下載並安裝')}</small></div>
            <div className="setting-control"><label className="toggle"><input type="checkbox" checked={settings.autoUpdate} onChange={(e) => updateSetting('autoUpdate', e.target.checked)} /><span className="slider"></span></label></div>
          </div>
        </div>
      )}

      {activeTab === 'appearance' && (
        <div className="settings-group">
          <h3>{t('settings.tab.appearance', {}, '界面外觀')}</h3>
          <div className="setting-row">
            <div className="setting-label"><span>{t('settings.theme', {}, '主題模式')}</span></div>
            <div className="setting-control">
              <select value={settings.theme} onChange={(e) => updateSetting('theme', e.target.value)}>
                <option value="dark">{t('settings.theme.dark', {}, '深色模式')}</option><option value="light">{t('settings.theme.light', {}, '淺色模式')}</option><option value="system">{t('settings.theme.system', {}, '跟隨系統')}</option>
              </select>
            </div>
          </div>
          <div className="setting-row">
            <div className="setting-label"><span>{t('settings.scale', {}, '界面縮放')}</span><small>當前: {Math.round(settings.scale * 100)}%</small></div>
            <div className="setting-control"><input type="range" min="0.8" max="1.5" step="0.1" value={settings.scale} onChange={(e) => updateSetting('scale', parseFloat(e.target.value))} style={{ width: '150px' }} /></div>
          </div>
        </div>
      )}

      {activeTab === 'storage' && (
        <div className="settings-group">
          <h3>{t('settings.tab.storage', {}, '下載與緩存')}</h3>
          <div className="setting-row">
            <div className="setting-label"><span>{t('settings.downloadPath', {}, '插件下載路徑')}</span><small>{settings.downloadPath}</small></div>
            <div className="setting-control"><button className="btn btn-outline" onClick={handleSelectDir}>{t('settings.downloadPath.change', {}, '更改')}</button></div>
          </div>
          <div className="setting-row">
            <div className="setting-label"><span>{t('settings.cache', {}, '緩存管理')}</span><small>{t('settings.cache.size', { size: cacheSize.toFixed(2) }, `當前緩存大小: ${cacheSize.toFixed(2)} MB`)}</small></div>
            <div className="setting-control"><button className="btn btn-danger" onClick={handleClearCache}>{t('settings.cache.clear', {}, '清理緩存')}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
