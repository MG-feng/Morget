import React, { useState, useEffect } from 'react';
import { ipc } from './ipc/client';
import type { PluginInfo, AppSettings } from '@morget/ipc-contract';
import SettingsView from './views/SettingsView'; // 引入新視圖

export default function App() {
  const [view, setView] = useState<'plugins' | 'settings'>('plugins');
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    language: 'zh-TW',
    theme: 'dark',
    scale: 1.0,
    downloadPath: '',
    autoUpdate: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // 動態應用縮放和主題
    document.documentElement.style.fontSize = `${settings.scale * 14}px`;
    document.body.className = settings.theme === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : settings.theme;
  }, [settings.scale, settings.theme]);

  const loadData = async () => {
    try {
      const [p, s] = await Promise.all([ipc.plugin.list(), ipc.settings.get()]);
      setPlugins(p);
      setSettings(s as AppSettings);
    } catch (e) {
      console.error('Failed to load data:', e);
    }
  };

  const handleInstall = async () => {
    const path = prompt('輸入插件路徑 (.mgpn 或 .mgp):');
    if (path) {
      const res = await ipc.plugin.install(path);
      if (res.success) loadData();
      else alert(res.error || '安裝失敗');
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    const res = await ipc.plugin.toggle(id, enabled);
    if (res.success) loadData();
    else alert(res.error || '切換失敗');
  };

  const handleUninstall = async (id: string, name: string) => {
    if (confirm(`確定卸載 ${name}?`)) {
      const res = await ipc.plugin.uninstall(id);
      if (res.success) loadData();
      else alert(res.error || '卸載失敗');
    }
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo">MORGET</div>
        <nav>
          <button className={view === 'plugins' ? 'active' : ''} onClick={() => setView('plugins')}>
            插件管理
          </button>
          <button className={view === 'settings' ? 'active' : ''} onClick={() => setView('settings')}>
            系統設置
          </button>
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
                      <input
                        type="checkbox"
                        checked={p.isEnabled}
                        onChange={(e) => handleToggle(p.id, e.target.checked)}
                      />
                      <span className="slider"></span>
                    </label>
                    <button className="btn btn-danger" onClick={() => handleUninstall(p.id, p.name)}>
                      卸載
                    </button>
                  </div>
                </div>
              ))}
              {plugins.length === 0 && (
                <div className="empty-state">暫無插件，請點擊右上角安裝。</div>
              )}
            </div>
          </div>
        )}

        {view === 'settings' && <SettingsView />}
      </main>
    </div>
  );
}