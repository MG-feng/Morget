import React, { useState, useEffect } from 'react';
import { ipc } from '../ipc/client';
import type { AppSettings, LocaleKey, ThemeMode, LoadingMode, GpuMode } from '@morget/ipc-contract';
import { useLang } from '../i18n/Lang';

type Tab = 'general' | 'appearance' | 'performance' | 'graphics' | 'storage';

export default function SettingsView() {
  const Lang = useLang();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [cacheSize, setCacheSize] = useState<number>(0);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const s = await ipc.settings.get();
    setSettings(s);
    const size = await ipc.settings.getCacheSize();
    setCacheSize(size);
  };

  const updateSetting = async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    if (!settings) return;
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await ipc.settings.set({ [key]: value });
  };

  const handleSelectDir = async () => {
    const dir = await ipc.settings.selectDirectory();
    if (dir) updateSetting('downloadPath', dir);
  };

  const handleClearCache = async () => {
    const res = await ipc.settings.clearCache();
    // ✅ 修復：使用原生 window.alert，徹底擺脫對外部 MorgetDialog 的依賴
    window.alert(Lang.get('settings.storage.cache.cleared', { size: res.freedMB.toFixed(2) }));
    setCacheSize(0);
  };

  const formatFps = (fps: number): string => {
    if (fps === 0 || fps > 240) return Lang.get('settings.graphics.fps.unlimited');
    return Lang.get('settings.graphics.fps.value', { value: fps });
  };

  const handleFpsChange = (rawValue: number) => {
    const stepped = Math.round(rawValue / 10) * 10;
    const finalFps = stepped > 240 ? 0 : Math.max(1, stepped);
    updateSetting('fps', finalFps);
  };

  if (!settings) return <div className="loading-screen">{Lang.get('common.loading')}</div>;

  return (
    <div className="settings-container">
      <div className="panel-header">
        <h2>{Lang.get('nav.settings')}</h2>
      </div>

      <div className="settings-tabs">
        {(['general', 'appearance', 'performance', 'graphics', 'storage'] as Tab[]).map((tab) => (
          <button
            key={tab}
            className={`settings-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {Lang.get(`settings.tab.${tab}`)}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <div className="settings-group">
          <h3>{Lang.get('settings.general.title')}</h3>
          <div className="setting-row">
            <div className="setting-label">
              <span>{Lang.get('settings.general.language')}</span>
              <small>{Lang.get('settings.general.language.hint')}</small>
            </div>
            <div className="setting-control">
              <select value={settings.language} onChange={(e) => updateSetting('language', e.target.value as LocaleKey)}>
                <option value="zh-TW">{Lang.get('lang.zh-TW')}</option>
                <option value="zh-CN">{Lang.get('lang.zh-CN')}</option>
                <option value="en-US">{Lang.get('lang.en-US')}</option>
              </select>
            </div>
          </div>
          <div className="setting-row">
            <div className="setting-label">
              <span>{Lang.get('settings.general.autoUpdate')}</span>
              <small>{Lang.get('settings.general.autoUpdate.hint')}</small>
            </div>
            <div className="setting-control">
              <label className="toggle">
                <input type="checkbox" checked={settings.autoUpdate} onChange={(e) => updateSetting('autoUpdate', e.target.checked)} />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'appearance' && (
        <div className="settings-group">
          <h3>{Lang.get('settings.appearance.title')}</h3>
          <div className="setting-row">
            <div className="setting-label"><span>{Lang.get('settings.appearance.theme')}</span></div>
            <div className="setting-control">
              <select value={settings.theme} onChange={(e) => updateSetting('theme', e.target.value as ThemeMode)}>
                <option value="dark">{Lang.get('settings.appearance.theme.dark')}</option>
                <option value="light">{Lang.get('settings.appearance.theme.light')}</option>
                <option value="system">{Lang.get('settings.appearance.theme.system')}</option>
              </select>
            </div>
          </div>
          <div className="setting-row">
            <div className="setting-label">
              <span>{Lang.get('settings.appearance.scale')}</span>
              <small>{Lang.get('settings.appearance.scale.current', { value: Math.round(settings.scale * 100) })}</small>
            </div>
            <div className="setting-control">
              <input type="range" min="0.8" max="1.5" step="0.1" value={settings.scale}
                onChange={(e) => updateSetting('scale', parseFloat(e.target.value))} style={{ width: '150px' }} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="settings-group">
          <h3>{Lang.get('settings.performance.title')}</h3>
          <div className="setting-row">
            <div className="setting-label">
              <span>{Lang.get('settings.performance.loading')}</span>
              <small>{Lang.get('settings.performance.loading.hint')}</small>
            </div>
            <div className="setting-control">
              <select value={settings.loadingMode} onChange={(e) => updateSetting('loadingMode', e.target.value as LoadingMode)}>
                <option value="stream">{Lang.get('settings.performance.loading.stream')}</option>
                <option value="full">{Lang.get('settings.performance.loading.full')}</option>
              </select>
            </div>
          </div>
          <div className="setting-row">
            <div className="setting-label">
              <span>{Lang.get('settings.performance.gpu')}</span>
              <small>{Lang.get('settings.performance.gpu.hint')}</small>
            </div>
            <div className="setting-control">
              <select value={settings.gpuMode} onChange={(e) => updateSetting('gpuMode', e.target.value as GpuMode)}>
                <option value="auto">{Lang.get('settings.performance.gpu.auto')}</option>
                <option value="integrated">{Lang.get('settings.performance.gpu.integrated')}</option>
                <option value="dedicated">{Lang.get('settings.performance.gpu.dedicated')}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'graphics' && (
        <div className="settings-group">
          <h3>{Lang.get('settings.graphics.title')}</h3>
          <div className="setting-row">
            <div className="setting-label">
              <span>{Lang.get('settings.graphics.fps')}</span>
              <small>{Lang.get('settings.graphics.fps.hint')}</small>
              <small style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{formatFps(settings.fps)}</small>
            </div>
            <div className="setting-control">
              <input type="range" min="0" max="300" step="10" value={settings.fps}
                onChange={(e) => handleFpsChange(parseInt(e.target.value))} disabled={settings.vsync} style={{ width: '200px' }} />
            </div>
          </div>
          <div className="setting-row">
            <div className="setting-label">
              <span>{Lang.get('settings.graphics.vsync')}</span>
              <small>{Lang.get('settings.graphics.vsync.hint')}</small>
            </div>
            <div className="setting-control">
              <label className="toggle">
                <input type="checkbox" checked={settings.vsync} onChange={(e) => updateSetting('vsync', e.target.checked)} />
                <span className="slider"></span>
              </label>
            </div>
          </div>
          <div className="setting-row">
            <div className="setting-label">
              <span>{Lang.get('settings.graphics.premiumUI')}</span>
              <small>{Lang.get('settings.graphics.premiumUI.hint')}</small>
            </div>
            <div className="setting-control">
              <label className="toggle">
                <input type="checkbox" checked={settings.premiumUI} onChange={(e) => updateSetting('premiumUI', e.target.checked)} />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'storage' && (
        <div className="settings-group">
          <h3>{Lang.get('settings.storage.title')}</h3>
          <div className="setting-row">
            <div className="setting-label">
              <span>{Lang.get('settings.storage.downloadPath')}</span>
              <small>{settings.downloadPath || '—'}</small>
            </div>
            <div className="setting-control">
              <button className="btn btn-outline" onClick={handleSelectDir}>{Lang.get('settings.storage.downloadPath.change')}</button>
            </div>
          </div>
          <div className="setting-row">
            <div className="setting-label">
              <span>{Lang.get('settings.storage.cache')}</span>
              <small>{Lang.get('settings.storage.cache.size', { size: cacheSize.toFixed(2) })}</small>
            </div>
            <div className="setting-control">
              <button className="btn btn-danger" onClick={handleClearCache}>{Lang.get('settings.storage.cache.clear')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
