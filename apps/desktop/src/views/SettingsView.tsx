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
  
  const update = async <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => { 
    if(!settings) return; 
    const n = {...settings, [k]: v}; 
    setSettings(n); 
    const patch: Partial<AppSettings> = {};
    patch[k] = v;
    await ipc.settings.set(patch); 
  };

  const handlePremiumToggle = async (checked: boolean) => {
    await update('premiumUI', checked);
    await dialog.alert(Lang.get('settings.premium.restart'));
  };

  if (!settings) return <div className="loading-screen">{Lang.get('common.loading')}</div>;

  return (
    <div className="settings-container">
      <div className="panel-header"><h2>{Lang.get('nav.settings')}</h2></div>
      <div className="settings-group">
        <h3>{Lang.get('settings.general.title')}</h3>
        <div className="setting-row"><div className="setting-label"><span>{Lang.get('settings.general.language')}</span></div><select value={settings.language} onChange={e => update('language', e.target.value as LocaleKey)}><option value="zh-TW">{Lang.get('lang.zh-TW')}</option><option value="zh-CN">{Lang.get('lang.zh-CN')}</option><option value="en-US">{Lang.get('lang.en-US')}</option></select></div>
        <div className="setting-row"><div className="setting-label"><span>{Lang.get('settings.general.autoUpdate')}</span></div><label className="toggle"><input type="checkbox" checked={settings.autoUpdate} onChange={e => update('autoUpdate', e.target.checked)} /><span className="slider"></span></label></div>
      </div>
      <div className="settings-group">
        <h3>{Lang.get('settings.appearance.title')}</h3>
        <div className="setting-row"><div className="setting-label"><span>{Lang.get('settings.appearance.theme')}</span></div><select value={settings.theme} onChange={e => update('theme', e.target.value as ThemeMode)}><option value="dark">{Lang.get('settings.appearance.theme.dark')}</option><option value="light">{Lang.get('settings.appearance.theme.light')}</option><option value="system">{Lang.get('settings.appearance.theme.system')}</option></select></div>
        <div className="setting-row"><div className="setting-label"><span>{Lang.get('settings.appearance.scale')}</span><small>{Lang.get('settings.appearance.scale.current', { value: Math.round(settings.scale * 100) })}</small></div><input type="range" min="0.8" max="1.5" step="0.1" value={settings.scale} onChange={e => update('scale', parseFloat(e.target.value))} style={{width: 150}} /></div>
      </div>
      <div className="settings-group">
        <h3>{Lang.get('settings.performance.title')}</h3>
        <div className="setting-row"><div className="setting-label"><span>{Lang.get('settings.performance.loading')}</span></div><select value={settings.loadingMode} onChange={e => update('loadingMode', e.target.value as LoadingMode)}><option value="stream">{Lang.get('settings.performance.loading.stream')}</option><option value="full">{Lang.get('settings.performance.loading.full')}</option></select></div>
        <div className="setting-row"><div className="setting-label"><span>{Lang.get('settings.performance.gpu')}</span></div><select value={settings.gpuMode} onChange={e => update('gpuMode', e.target.value as GpuMode)}><option value="auto">{Lang.get('settings.performance.gpu.auto')}</option><option value="integrated">{Lang.get('settings.performance.gpu.integrated')}</option><option value="dedicated">{Lang.get('settings.performance.gpu.dedicated')}</option></select></div>
      </div>
      <div className="settings-group">
        <h3>{Lang.get('settings.graphics.title')}</h3>
        <div className="setting-row"><div className="setting-label"><span>{Lang.get('settings.graphics.fps')}</span><small>{settings.fps === 0 ? Lang.get('settings.graphics.fps.unlimited') : `${settings.fps} FPS`}</small></div><input type="range" min="0" max="300" step="10" value={settings.fps} onChange={e => update('fps', parseInt(e.target.value))} disabled={settings.vsync} style={{width:200}} /></div>
        <div className="setting-row"><div className="setting-label"><span>{Lang.get('settings.graphics.vsync')}</span></div><label className="toggle"><input type="checkbox" checked={settings.vsync} onChange={e => update('vsync', e.target.checked)} /><span className="slider"></span></label></div>
        <div className="setting-row"><div className="setting-label"><span>{Lang.get('settings.graphics.premiumUI')}</span><small>{Lang.get('settings.graphics.premiumUI.hint')}</small></div><label className="toggle"><input type="checkbox" checked={settings.premiumUI} onChange={e => handlePremiumToggle(e.target.checked)} /><span className="slider"></span></label></div>
      </div>
      <div className="settings-group">
        <h3>{Lang.get('settings.storage.title')}</h3>
        <div className="setting-row"><div className="setting-label"><span>{Lang.get('settings.storage.downloadPath')}</span><small>{settings.downloadPath || '—'}</small></div><button className="btn btn-outline" onClick={async () => { const dir = await ipc.settings.selectDirectory(); if (dir) update('downloadPath', dir); }}>{Lang.get('settings.storage.downloadPath.change')}</button></div>
        <div className="setting-row"><div className="setting-label"><span>{Lang.get('settings.storage.cache')}</span><small>{Lang.get('settings.storage.cache.size', {size: cacheSize.toFixed(2)})}</small></div><button className="btn btn-danger" onClick={async () => { const r = await ipc.settings.clearCache(); dialog.alert(Lang.get('settings.storage.cache.cleared', {size: r.freedMB.toFixed(2)})); setCacheSize(0); }}>{Lang.get('settings.storage.cache.clear')}</button></div>
      </div>
    </div>
  );
}
