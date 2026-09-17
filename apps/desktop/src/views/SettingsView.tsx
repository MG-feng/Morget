import React, { useState, useEffect } from 'react';
import { ipc } from '../ipc/client';
import type { AppSettings, LocaleKey, ThemeMode, LoadingMode, GpuMode } from '@morget/ipc-contract';
import { useLang } from '../i18n/Lang';
import { useMorgetDialog } from '../components/MorgetDialog';

export default function SettingsView() {
  const Lang = useLang();
  const dialog = useMorgetDialog();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [cacheSize, setCacheSize] = useState(0);

  useEffect(() => { loadData(); }, []);
  const loadData = async () => { setSettings(await ipc.settings.get()); setCacheSize(await ipc.settings.getCacheSize()); };
  const update = async <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => { if(!settings) return; const n = {...settings, [k]: v}; setSettings(n); await ipc.settings.set({[k]: v}); };

  if (!settings) return <div className="loading-screen">{Lang.get('common.loading')}</div>;

  return (
    <div className="settings-container">
      <div className="panel-header"><h2>{Lang.get('nav.settings')}</h2></div>
      <div className="settings-group">
        <h3>{Lang.get('settings.general.title')}</h3>
        <div className="setting-row">
          <div className="setting-label"><span>{Lang.get('settings.general.language')}</span></div>
          <div className="setting-control">
            <select value={settings.language} onChange={e => update('language', e.target.value as LocaleKey)}>
              <option value="zh-TW">{Lang.get('lang.zh-TW')}</option><option value="zh-CN">{Lang.get('lang.zh-CN')}</option><option value="en-US">{Lang.get('lang.en-US')}</option>
            </select>
          </div>
        </div>
      </div>
      <div className="settings-group">
        <h3>{Lang.get('settings.performance.title')}</h3>
        <div className="setting-row">
          <div className="setting-label"><span>{Lang.get('settings.performance.loading')}</span></div>
          <div className="setting-control">
            <select value={settings.loadingMode} onChange={e => update('loadingMode', e.target.value as LoadingMode)}>
              <option value="stream">{Lang.get('settings.performance.loading.stream')}</option><option value="full">{Lang.get('settings.performance.loading.full')}</option>
            </select>
          </div>
        </div>
        <div className="setting-row">
          <div className="setting-label"><span>{Lang.get('settings.performance.gpu')}</span></div>
          <div className="setting-control">
            <select value={settings.gpuMode} onChange={e => update('gpuMode', e.target.value as GpuMode)}>
              <option value="auto">{Lang.get('settings.performance.gpu.auto')}</option><option value="integrated">{Lang.get('settings.performance.gpu.integrated')}</option><option value="dedicated">{Lang.get('settings.performance.gpu.dedicated')}</option>
            </select>
          </div>
        </div>
      </div>
      <div className="settings-group">
        <h3>{Lang.get('settings.graphics.title')}</h3>
        <div className="setting-row">
          <div className="setting-label"><span>{Lang.get('settings.graphics.fps')}</span><small>{settings.fps === 0 ? Lang.get('settings.graphics.fps.unlimited') : `${settings.fps} FPS`}</small></div>
          <div className="setting-control"><input type="range" min="0" max="300" step="10" value={settings.fps} onChange={e => update('fps', parseInt(e.target.value))} disabled={settings.vsync} style={{width:200}} /></div>
        </div>
        <div className="setting-row">
          <div className="setting-label"><span>{Lang.get('settings.graphics.vsync')}</span></div>
          <div className="setting-control"><label className="toggle"><input type="checkbox" checked={settings.vsync} onChange={e => update('vsync', e.target.checked)} /><span className="slider"></span></label></div>
        </div>
      </div>
      <div className="settings-group">
        <h3>{Lang.get('settings.storage.title')}</h3>
        <div className="setting-row">
          <div className="setting-label"><span>{Lang.get('settings.storage.cache')}</span><small>{Lang.get('settings.storage.cache.size', {size: cacheSize.toFixed(2)})}</small></div>
          <div className="setting-control"><button className="btn btn-danger" onClick={async () => { const r = await ipc.settings.clearCache(); dialog.alert(Lang.get('settings.storage.cache.cleared', {size: r.freedMB.toFixed(2)})); setCacheSize(0); }}>{Lang.get('settings.storage.cache.clear')}</button></div>
        </div>
      </div>
    </div>
  );
}
