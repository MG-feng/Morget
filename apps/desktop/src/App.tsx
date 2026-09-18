import React, { useState, useEffect, useRef } from 'react';
import { ipc } from './ipc/client.ts';
import type { PluginInfo } from '@morget/ipc-contract';
import SettingsView from './views/SettingsView.tsx';
import './App.css';

export default function App() {
  const [view, setView] = useState<'plugins' | 'settings'>('plugins');
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [fontSize, setFontSize] = useState(14);
  const [scale, setScale] = useState(1.0);
  const [theme, setTheme] = useState('dark');
  const [fpsLimit, setFpsLimit] = useState(60);
  const [vsync, setVsync] = useState(false);
  const [adaptiveFps, setAdaptiveFps] = useState(true);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!settings) return;
    setFontSize(settings.fontSize || 14);
    setScale(settings.scale || 1.0);
    setTheme(settings.theme || 'dark');
    setFpsLimit(settings.fpsLimit ?? 60);
    setVsync(settings.vsync || false);
    setAdaptiveFps(settings.adaptiveFps !== false);
  }, [settings]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize * scale}px`;
    const isDark = theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : theme === 'dark';
    document.body.className = isDark ? '' : 'light';
  }, [fontSize, scale, theme]);

  useEffect(() => {
    if (vsync) return;
    let rafId: number;
    let lastTime = 0;
    let isHidden = false;
    let hiddenAt = 0;

    const onVis = () => {
      if (document.hidden) { isHidden = true; hiddenAt = Date.now(); }
      else { isHidden = false; hiddenAt = 0; }
    };
    document.addEventListener('visibilitychange', onVis);

    const loop = (time: number) => {
      rafId = requestAnimationFrame(loop);
      let target = fpsLimit === 0 ? 300 : fpsLimit;
      if (adaptiveFps && isHidden) {
        const sec = (Date.now() - hiddenAt) / 1000;
        if (sec > 600) target = 10;
        else if (sec > 30) target = Math.max(10, Math.floor(target / 2));
      }
      const interval = 1000 / target;
      if (time - lastTime < interval) return;
      lastTime = time - ((time - lastTime) % interval);
    };
    rafId = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafId); document.removeEventListener('visibilitychange', onVis); };
  }, [fpsLimit, vsync, adaptiveFps]);

  const loadData = async () => {
    try {
      const [p, s] = await Promise.all([ipc.plugin.list(), ipc.settings.get()]);
      setPlugins(p);
      setSettings(s);
    } catch (e) { console.error(e); }
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

  if (!settings) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>載入中...</div>;

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
