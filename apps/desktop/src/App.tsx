import React, { useState, useEffect } from 'react';
import { ipc } from './ipc/client.ts';
import type { PluginInfo } from '@morget/ipc-contract';
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
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    // ✅ 拆分加載，極致容錯：即使後端報錯，也使用默認值保證應用能打開
    try { setSettings(await ipc.settings.get()); } 
    catch { setSettings({ language: 'zh-TW', theme: 'dark', scale: 1.0, fontSize: 14, fpsLimit: 60, vsync: false, premiumUI: false, adaptiveFps: true, hotkeyFullscreen: 'F11' }); }
    
    try { setPlugins(await ipc.plugin.list()); } 
    catch { setPlugins([]); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // 實時應用：縮放、字體、主題、精美動畫
  useEffect(() => {
    if (!settings) return;
    const fs = settings.fontSize || 14;
    document.documentElement.style.fontSize = `${fs * (settings.scale || 1)}px`;
    document.body.className = settings.theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : settings.theme;
    if (settings.premiumUI) document.body.classList.add('premium-ui');
    else document.body.classList.remove('premium-ui');
  }, [settings]);

  // FPS 限制 + 自適應 FPS
  useEffect(() => {
    if (!settings || settings.vsync) return;
    const fpsLimit = settings.fpsLimit ?? 60;
    if (fpsLimit === 0) return;
    let rafId: number, lastTime = 0, isHidden = false, hiddenAt = 0;
    const onVis = () => { if (document.hidden) { isHidden = true; hiddenAt = Date.now(); } else { isHidden = false; } };
    document.addEventListener('visibilitychange', onVis);
    const loop = (time: number) => {
      rafId = requestAnimationFrame(loop);
      let target = fpsLimit;
      if (settings.adaptiveFps && isHidden) {
        const sec = (Date.now() - hiddenAt) / 1000;
        if (sec > 600) target = 10; else if (sec > 30) target = Math.max(10, Math.floor(target / 2));
      }
      if (time - lastTime < 1000 / target) return;
      lastTime = time - ((time - lastTime) % (1000 / target));
    };
    rafId = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafId); document.removeEventListener('visibilitychange', onVis); };
  }, [settings?.fpsLimit, settings?.vsync, settings?.adaptiveFps]);

  // 全屏快捷鍵監聽
  useEffect(() => {
    if (!settings?.hotkeyFullscreen) return;
    const keys = settings.hotkeyFullscreen.split('+').map((k: string) => k.toLowerCase());
    const handler = (e: KeyboardEvent) => {
      const pressed: string[] = [];
      if (e.ctrlKey) pressed.push('ctrl'); if (e.shiftKey) pressed.push('shift'); if (e.altKey) pressed.push('alt');
      const mainKey = e.key.toLowerCase();
      if (!['control', 'shift', 'alt', 'meta'].includes(mainKey)) pressed.push(mainKey);
      if (pressed.length === keys.length && keys.every((k: string) => pressed.includes(k))) {
        e.preventDefault(); ipc.settings.toggleFullscreen().catch(() => {});
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [settings?.hotkeyFullscreen]);

  const handleInstall = async () => {
    try {
      const res = await ipc.plugin.install();
      if (res.success) loadData(); else if (!res.cancelled) alert(res.error || '安裝失敗');
    } catch (e) { console.error(e); }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    const res = await ipc.plugin.toggle(id, enabled); if (res.success) loadData(); else alert(res.error || '切換失敗');
  };

  const handleUninstall = async (id: string, name: string) => {
    if (confirm(`確定卸載 ${name}?`)) { const res = await ipc.plugin.uninstall(id); if (res.success) loadData(); else alert(res.error || '卸載失敗'); }
  };

  if (loading) return <Loading />;
  if (!settings) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}>初始化失敗</div>;

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
