import React, { useState, useEffect } from 'react';
import { ipc } from '../ipc/client';
import type { AppSettings, LocaleKey, ThemeMode } from '@morget/ipc-contract';
import { useLang } from '../i18n/Lang';

export default function SettingsView() {
  const Lang = useLang();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [cacheSize, setCacheSize] = useState(0);

  useEffect(() => {
    ipc.settings.get().then(setSettings);
    ipc.settings.getCacheSize().then(setCacheSize);
  }, []);

  if (!settings) return <div style={{padding:20}}>{Lang.get('common.loading')}</div>;

  const update = async (k: keyof AppSettings, v: any) => {
    const n = { ...settings, [k]: v };
    setSettings(n);
    await ipc.settings.set({ [k]: v });
  };

  return (
    <div style={{padding:20, maxWidth:800, margin:'0 auto'}}>
      <h2>{Lang.get('nav.settings')}</h2>
      <div style={{background:'#fff', padding:20, borderRadius:8, border:'1px solid #ddd', marginBottom:20}}>
        <h3>{Lang.get('settings.general.title')}</h3>
        <div style={{marginBottom:15}}>
          <label>{Lang.get('settings.general.language')}</label>
          <select value={settings.language} onChange={e => update('language', e.target.value as LocaleKey)} style={{width:'100%', padding:8, marginTop:5}}>
            <option value="zh-TW">{Lang.get('lang.zh-TW')}</option>
            <option value="zh-CN">{Lang.get('lang.zh-CN')}</option>
            <option value="en-US">{Lang.get('lang.en-US')}</option>
          </select>
        </div>
      </div>
      <div style={{background:'#fff', padding:20, borderRadius:8, border:'1px solid #ddd', marginBottom:20}}>
        <h3>{Lang.get('settings.appearance.title')}</h3>
        <div style={{marginBottom:15}}>
          <label>{Lang.get('settings.appearance.theme')}</label>
          <select value={settings.theme} onChange={e => update('theme', e.target.value as ThemeMode)} style={{width:'100%', padding:8, marginTop:5}}>
            <option value="dark">{Lang.get('settings.appearance.theme.dark')}</option>
            <option value="light">{Lang.get('settings.appearance.theme.light')}</option>
            <option value="system">{Lang.get('settings.appearance.theme.system')}</option>
          </select>
        </div>
      </div>
      <div style={{background:'#fff', padding:20, borderRadius:8, border:'1px solid #ddd'}}>
        <h3>{Lang.get('settings.storage.title')}</h3>
        <div style={{marginBottom:15}}>
          <label>{Lang.get('settings.storage.cache')} ({cacheSize.toFixed(2)} MB)</label><br/>
          <button onClick={async () => { const res = await ipc.settings.clearCache(); window.alert(Lang.get('settings.storage.cache.cleared', {size: res.freedMB.toFixed(2)})); setCacheSize(0); }} style={{padding:'8px 15px', marginTop:5, cursor:'pointer'}}>
            {Lang.get('settings.storage.cache.clear')}
          </button>
        </div>
      </div>
    </div>
  );
}
