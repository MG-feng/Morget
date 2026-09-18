import React, { useState, useEffect } from 'react';
import { ipc } from './ipc/client';
import type { PluginInfo, AppSettings, AuthState } from '@morget/ipc-contract';
import SettingsView from './views/SettingsView';
import MarketView from './views/MarketView';
import LoginView from './views/LoginView';
import { Lang, useLang } from './i18n/Lang';
import { MorgetDialogProvider, useMorgetDialog } from './components/MorgetDialog';
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';

const AUTH_ENABLED = false; 

function AppContent() {
  const LangHook = useLang();
  const dialog = useMorgetDialog();
  const [view, setView] = useState<'market' | 'plugins' | 'settings'>('plugins');
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [authState, setAuthState] = useState<AuthState | null>(AUTH_ENABLED ? null : { isLoggedIn: true });

  useEffect(() => {
    (async () => {
      const s = await ipc.settings.get().catch(() => null);
      if (s?.premiumUI) {
        try { await import('./styles/premium.css'); } catch (e) { console.error('Failed to load premium.css:', e); }
      }
    })();

    if (AUTH_ENABLED) {
      ipc.auth.getState().then(setAuthState).catch(console.error);
      const unlisten = onOpenUrl((urls) => { 
        try { 
          const url = new URL(urls[0]); 
          if (url.protocol === 'morget:' && url.hostname === 'auth') { 
            const c = url.searchParams.get('code'); 
            const st = url.searchParams.get('state'); 
            if (c && st) ipc.auth.callback(c, st).then(() => ipc.auth.getState().then(setAuthState)); 
          } 
        } catch (e) {} 
      });
      return () => { unlisten.then(fn => fn()); };
    }
  }, []);

  useEffect(() => { if (authState?.isLoggedIn || !AUTH_ENABLED) loadData(); }, [authState]);
  
  useEffect(() => { 
    if (!settings) return; 
    document.documentElement.style.fontSize = `${settings.scale * 14}px`; 
    const isDark = settings.theme === 'system' ? window.matchMedia('(prefers-color-scheme: dark)').matches : settings.theme === 'dark'; 
    document.body.className = isDark ? 'dark' : 'light'; 
    Lang.setLocale(settings.language); 
  }, [settings]);

  const loadData = async () => { 
    try { 
      const [p, s] = await Promise.all([ipc.plugin.list(), ipc.settings.get()]); 
      setPlugins(p); 
      setSettings(s); 
    } catch (e) { console.error(e); } 
  };
  
  const handleInstall = async () => {
    const res = await ipc.plugin.installViaDialog();
    if (res.success) { await dialog.alert(LangHook.get('plugins.install.success', { name: res.pluginName || res.pluginId })); loadData(); }
    else if (!res.cancelled) { await dialog.alert(LangHook.get('plugins.install.failed', { error: res.error || 'Unknown' }), LangHook.get('common.error')); }
  };

  const handleUninstall = async (id: string, name: string) => {
    if (!(await dialog.confirm(LangHook.get('plugins.uninstall.confirm', { name })))) return;
    const res = await ipc.plugin.uninstall(id);
    if (res.success) { await dialog.alert(LangHook.get('plugins.uninstall.success')); loadData(); }
    else { await dialog.alert(LangHook.get('plugins.uninstall.failed', { error: res.error || 'Unknown' }), LangHook.get('common.error')); }
  };

  if (AUTH_ENABLED) { 
    if (!authState) return <div className="loading-screen">{LangHook.get('common.loading')}</div>; 
    if (!authState.isLoggedIn) return <LoginView />; 
  }
  if (!settings) return <div className="loading-screen">{LangHook.get('common.loading')}</div>;

  const isLoggedIn = AUTH_ENABLED ? (authState?.isLoggedIn || false) : true;

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo">{LangHook.get('app.name')}</div>
        <nav>
          <button className={`nav-btn ${view === 'plugins' ? 'active' : ''}`} onClick={() => setView('plugins')}>{LangHook.get('nav.plugins')}</button>
          <button className={`nav-btn ${view === 'market' ? 'active' : ''}`} onClick={() => setView('market')}>{LangHook.get('nav.market')}</button>
          <button className={`nav-btn ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>{LangHook.get('nav.settings')}</button>
          <div style={{flex: 1}}></div>
          {AUTH_ENABLED && <button className="nav-btn logout-btn" onClick={() => { ipc.auth.logout().then(() => setAuthState({isLoggedIn: false})) }}>{LangHook.get('nav.logout')}</button>}
        </nav>
      </aside>
      <main className="main-content">
        {view === 'plugins' && (
          <div className="panel">
            <div className="panel-header"><h2>{LangHook.get('plugins.title')} {LangHook.get('plugins.count', { count: plugins.length })}</h2><button className="btn btn-primary" onClick={handleInstall}>{LangHook.get('plugins.install')}</button></div>
            <div className="plugin-list">
              {plugins.map((p) => (
                <div key={p.id} className="card plugin-card">
                  <div className="plugin-info">
                    <span className={`badge ${p.kind.toLowerCase()}`}>{p.kind}</span>
                    <strong>{p.name}</strong> <span className="version">v{p.version}</span>
                    <p className="desc">{p.description}</p>
                  </div>
                  <div className="plugin-actions" style={{display:'flex', alignItems:'center', gap:'16px'}}>
                    <label className="toggle"><input type="checkbox" checked={p.isEnabled} onChange={async (e) => { await ipc.plugin.toggle(p.id, e.target.checked); loadData(); }} /><span className="slider"></span></label>
                    <button className="btn btn-danger" onClick={() => handleUninstall(p.id, p.name)}>{LangHook.get('plugins.uninstall')}</button>
                  </div>
                </div>
              ))}
              {plugins.length === 0 && <div className="empty-state">{LangHook.get('plugins.empty')}</div>}
            </div>
          </div>
        )}
        {view === 'market' && <MarketView isLoggedIn={isLoggedIn} />}
        {view === 'settings' && <SettingsView />}
      </main>
    </div>
  );
}

export default function App() { return <MorgetDialogProvider><AppContent /></MorgetDialogProvider>; }
