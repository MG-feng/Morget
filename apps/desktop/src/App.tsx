import React, { useState, useEffect } from 'react';
import { ipc } from './ipc/client';
import type { PluginInfo } from '@morget/ipc-contract';
import SettingsView from './views/SettingsView';
import './App.css';

const Loading = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-secondary)', fontSize: 16, letterSpacing: 3 }}>
    === 載入中 ===
  </div>
);

export default function App() {
  const [view, setView] = useState<'plugins' | 'settings'>('plugins');
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, s] = await Promise.all([ipc.plugin.list(), ipc.settings.get()]);
      setPlugins(p);
      setSettings(s);
    } catch (e: any) {
      setError(`加載失敗: ${e?.message || e}`);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!settings) return;
    const fontSize = settings.fontSize || 14;
    const scale = settings.scale || 1.0;
    document.documentElement.style.fontSize = `${fontSize * scale}px`;

    const theme = settings.theme || 'dark';
    const isDark = theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : theme === 'dark';
    document.body.className = isDark ? '' : 'light';
  }, [settings]);

  // FPS 限制
  useEffect(() => {
    if (!settings || settings.vsync) return;
    const fpsLimit = settings.fpsLimit ?? 60;
    const adaptiveFps = settings.adaptiveFps !== false;
    if (fpsLimit === 0) return;

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
      let target = fpsLimit;
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
  }, [settings?.fpsLimit, settings?.vsync, settings?.adaptiveFps]);

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

  if (loading) return <Loading />;

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16 }}>
      <div style={{ color: 'var(--danger)', fontSize: 14 }}>{error}</div>
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
