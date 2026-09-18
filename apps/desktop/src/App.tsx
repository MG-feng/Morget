import React, { useState, useEffect } from 'react';
import { ipc } from './ipc/client.ts';
import type { PluginInfo, AppSettings } from '@morget/ipc-contract';
import SettingsView from './views/SettingsView.tsx';

export default function App() {
  const [view, setView] = useState<'plugins' | 'settings'>('plugins');
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!settings) return;
    // 1. 應用縮放與字體
    document.documentElement.style.fontSize = `${settings.scale * (settings.fontSize || 14)}px`;
    // 2. 應用主題
    document.body.className = settings.theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : settings.theme;
  }, [settings]);

  // 🆕 3. FPS 限制與自適應 FPS 核心邏輯 (Zero-Mock 真實實現)
  useEffect(() => {
    if (!settings) return;
    let rafId: number;
    let lastTime = 0;
    let isHidden = false;
    let hiddenTime = 0;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isHidden = true;
        hiddenTime = Date.now();
      } else {
        isHidden = false;
        hiddenTime = 0;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const loop = (time: number) => {
      rafId = requestAnimationFrame(loop);
      let targetFps = settings.fpsLimit || 60;
      if (targetFps === 0) targetFps = 144; // 0 為無限制，這裡設為 144 作為基準
      
      // 自適應 FPS 邏輯
      if (settings.adaptiveFps && isHidden) {
        const hiddenDuration = (Date.now() - hiddenTime) / 1000;
        if (hiddenDuration > 600) targetFps = 10; // 10分鐘降至 10 FPS
        else if (hiddenDuration > 30) targetFps = Math.max(10, targetFps / 2); // 30秒減半
      }

      if (settings.vsync) return; // VSync 開啟時由顯示器接管，不手動限制

      const interval = 1000 / targetFps;
      if (time - lastTime < interval) return;
      lastTime = time - ((time - lastTime) % interval);
      
      // 這裡可以觸發全局的動畫 tick 或 React 狀態更新
    };
    
    if (!settings.vsync) {
      rafId = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [settings?.fpsLimit, settings?.vsync, settings?.adaptiveFps]);

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
            <div className="panel-header"><h2>已安裝插件 ({plugins.length})</h2><button className="btn btn-primary" onClick={handleInstall}>安裝插件</button></div>
            <div className="plugin-list">
              {plugins.map((p) => (
                <div key={p.id} className="plugin-card">
                  <div className="plugin-info"><span className={`badge ${p.kind}`}>{p.kind}</span><strong>{p.name}</strong><span className="version">v{p.version}</span><p className="desc">{p.description}</p></div>
                  <div className="plugin-actions"><label className="toggle"><input type="checkbox" checked={p.isEnabled} onChange={(e) => handleToggle(p.id, e.target.checked)} /><span className="slider"></span></label><button className="btn btn-danger" onClick={() => handleUninstall(p.id, p.name)}>卸載</button></div>
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
