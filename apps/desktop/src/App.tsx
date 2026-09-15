import React, { useState, useEffect } from 'react';
import { ipc } from './ipc/client';
import type { PluginInfo, AppSettings, AuthState } from '@morget/ipc-contract';
import SettingsView from './views/SettingsView';
import LoginView from './views/LoginView';
import { Lang, useLang } from './i18n/Lang';
import { MorgetDialogProvider, useMorgetDialog } from './components/MorgetDialog';
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';

function AppContent() {
  const LangHook = useLang();
  const dialog = useMorgetDialog();
  const [view, setView] = useState<'plugins' | 'settings'>('plugins');
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [authState, setAuthState] = useState<AuthState | null>(null);

  useEffect(() => {
    ipc.auth.getState().then(setAuthState).catch(console.error);
    const unlisten = onOpenUrl((urls) => {
      try {
        const url = new URL(urls[0]);
        if (url.protocol === 'morget:' && url.hostname === 'auth' && url.pathname === '/callback') {
          const code = url.searchParams.get('code');
          const state = url.searchParams.get('state');
          if (code && state) {
            ipc.auth.callback(code, state).then(() => ipc.auth.getState().then(setAuthState)).catch(console.error);
          }
        }
      } catch (e) {
        console.warn('Invalid deep link URL:', urls[0]);
      }
    });
    return () => { unlisten.then(fn => fn()); };
  }, []);

  useEffect(() => {
    if (authState?.isLoggedIn) loadData();
  }, [authState]);

  useEffect(() => {
    if (!settings) return;
    document.documentElement.style.fontSize = `${settings.scale * 14}px`;
    const isDark = settings.theme === 'system' ? window.matchMedia('(prefers-color-scheme: dark)').matches : settings.theme === 'dark';
    document.body.className = isDark ? 'dark' : 'light';
    if (settings.premiumUI) document.body.classList.add('premium-ui');
    else document.body.classList.remove('premium-ui');
    Lang.setLocale(settings.language);
  }, [settings]);

  const loadData = async () => {
    try {
      const [p, s] = await Promise.all([ipc.plugin.list(), ipc.settings.get()]);
      setPlugins(p); setSettings(s);
    } catch (e) { console.error('Failed to load data:', e); }
  };

  const handleInstall = async () => {
    const res = await ipc.plugin.installViaDialog();
    if (res.success) { 
      await dialog.alert(LangHook.get('plugins.install.success', { name: res.pluginName || res.pluginId })); 
      loadData(); 
    } else if (!res.cancelled) { 
      await dialog.alert(LangHook.get('plugins.install.failed', { error: res.error || 'Unknown' }), LangHook.get('common.error')); 
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    const res = await ipc.plugin.toggle(id, enabled);
    if (res.success) loadData();
    else await dialog.alert(LangHook.get('plugins.toggle.failed', { error: res.error || 'Unknown' }), LangHook.get('common.error'));
  };

  const handleUninstall = async (id: string, name: string) => {
    const confirmed = await dialog.confirm(LangHook.get('plugins.uninstall.confirm', { name }));
    if (!confirmed) return;
    const res = await ipc.plugin.uninstall(id);
    if (res.success) { await dialog.alert(LangHook.get('plugins.uninstall.success')); loadData(); }
    else { await dialog.alert(LangHook.get('plugins.uninstall.failed', { error: res.error || 'Unknown' }), LangHook.get('common.error')); }
  };

  if (!authState) return <div className="loading-screen">{LangHook.get('common.loading')}</div>;
  if (!authState.isLoggedIn) return <LoginView onLoginSuccess={() => ipc.auth.getState().then(setAuthState)} />;
  if (!settings) return <div className="loading-screen">{LangHook.get('common.loading')}</div>;

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo">{LangHook.get('app.name')}</div>
        <nav>
          <button className={`nav-btn ${view === 'plugins' ? 'active' : ''}`} onClick={() => setView('plugins')}>{LangHook.get('nav.plugins')}</button>
          <button className={`nav-btn ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>{LangHook.get('nav.settings')}</button>
          <div style={{flex: 1}}></div>
          <button className="nav-btn logout-btn" onClick={() => { ipc.auth.logout().then(() => setAuthState({isLoggedIn: false})) }}>{LangHook.get('nav.logout')}</button>
        </nav>
      </aside>
      <main className="main-content">
        {view === 'plugins' && (
          <div className="panel">
            <div className="panel-header">
              <h2>{LangHook.get('plugins.title')} {LangHook.get('plugins.count', { count: plugins.length })}</h2>
              <button className="btn btn-primary" onClick={handleInstall}>{LangHook.get('plugins.install')}</button>
            </div>
            <div className="plugin-list">
              {plugins.map((p) => (
                <div key={p.id} className="plugin-card">
                  <div className="plugin-info">
                    <span className={`badge ${p.kind.toLowerCase()}`}>{p.kind}</span>
                    <strong>{p.name}</strong> <span className="version">v{p.version}</span>
                    <p className="desc">{p.description}</p>
                  </div>
                  <div className="plugin-actions">
                    <label className="toggle"><input type="checkbox" checked={p.isEnabled} onChange={(e) => handleToggle(p.id, e.target.checked)} /><span className="slider"></span></label>
                    <button className="btn btn-danger" onClick={() => handleUninstall(p.id, p.name)}>{LangHook.get('plugins.uninstall')}</button>
                  </div>
                </div>
              ))}
              {plugins.length === 0 && <div className="empty-state">{LangHook.get('plugins.empty')}</div>}
            </div>
          </div>
        )}
        {view === 'settings' && <SettingsView />}
      </main>
    </div>
  );
}

export default function App() {
  return <MorgetDialogProvider><AppContent /></MorgetDialogProvider>;
}
