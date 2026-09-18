import React, { useState, useEffect } from 'react';
import { ipc } from './ipc/client.ts';
import type { PluginInfo, AppSettings } from '@morget/ipc-contract';
import SettingsView from './views/SettingsView.tsx';
import './App.css';

// ✅ 統一加載提示
const Loading = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-secondary)', fontSize: 16, letterSpacing: 3 }}>
    === 載入中 ===
  </div>
);

export default function App() {
  const [view, setView] = useState<'plugins' | 'settings'>('plugins');
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    
    // ✅ 拆分加載：防止一個報錯導致全部卡死
    try {
      const s = await ipc.settings.get();
      setSettings(s);
    } catch (e: any) {
      console.error('Settings load failed, using defaults:', e);
      // 如果設置讀取失敗，使用默認設置保證應用能打開
      setSettings({
        language: 'zh-TW', theme: 'dark', scale: 1.0, downloadPath: '', autoUpdate: true
      } as AppSettings);
    }

    try {
      const p = await ipc.plugin.list();
      setPlugins(p);
    } catch (e: any) {
      console.error('Plugins load failed:', e);
      setPlugins([]);
    }

    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!settings) return;
    document.documentElement.style.fontSize = `${settings.scale * 14}px`;
    document.body.className = settings.theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : settings.theme;
  }, [settings]);

  const handleInstall = async () => {
    try {
      const res = await ipc.plugin.install();
      if (res.success) loadData();
      else if (!res.cancelled) alert(res.error || '安裝失敗');
    } catch (e) { console.error(e); }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      const res = await ipc.plugin.toggle(id, enabled);
      if (res.success) loadData();
      else alert(res.error || '切換失敗');
    } catch (e) { console.error(e); }
  };

  const handleUninstall = async (id: string, name: string) => {
    if (confirm(`確定卸載 ${name}?`)) {
      try {
        const res = await ipc.plugin.uninstall(id);
        if (res.success) loadData();
        else alert(res.error || '卸載失敗');
      } catch (e) { console.error(e); }
    }
  };

  if (loading) return <Loading />;

  if (!settings) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16 }}>
      <div style={{ color: 'var(--danger)' }}>應用初始化失敗</div>
      <button className="btn btn-outline" onClick={loadData}>重試</button>
    </div>
  );

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo">MORGET</div>
        <nav>
          <button className={view === 'plugins' ? 'active' : ''} onClick={() => setView('plugins')}>插件管理</button>
          <button className={view === 'settings' ? 'active' : ''} onClick={() => setView('settings')}>系統設置</button>
        </nav>
      </aside>
      <main className="main-content">
        {view === 'plugins' && (
          <div className="panel">
            <div className="panel-header">
              <h2>已安裝插件 ({plugins.length})</h2>
              <button className="btn btn-primary" onClick={handleInstall}>安裝插件</button>
            </div>
            <div className="plugin-list">
              {plugins.map((p) => (
                <div key={p.id} className="plugin-card">
                  <div className="plugin-info">
                    <span className={`badge ${p.kind}`}>{p.kind}</span>
                    <strong>{p.name}</strong>
                    <span className="version">v{p.version}</span>
                    <p className="desc">{p.description}</p>
                  </div>
                  <div className="plugin-actions">
                    <label className="toggle">
                      <input type="checkbox" checked={p.isEnabled} onChange={(e) => handleToggle(p.id, e.target.checked)} />
                      <span className="slider"></span>
                    </label>
                    <button className="btn btn-danger" onClick={() => handleUninstall(p.id, p.name)}>卸載</button>
                  </div>
                </div>
              ))}
              {plugins.length === 0 && <div className="empty-state">暫無插件，請點擊右上角安裝。</div>}
            </div>
          </div>
        )}
        {view === 'settings' && <SettingsView />}
      </main>
    </div>
  );
}
