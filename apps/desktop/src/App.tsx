import React, { useState, useEffect, createContext, useContext } from 'react';
import { ipc } from './ipc/client';
import type { PluginInfo, AppSettings, AuthState } from '@morget/ipc-contract';
import SettingsView from './views/SettingsView';
import MarketView from './views/MarketView';
import CreatorView from './views/CreatorView';
import WalletView from './views/WalletView';
import LoginView from './views/LoginView';
import { Lang, useLang } from './i18n/Lang';
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';

// 極簡 Dialog (內聯，徹底避免外部文件缺失導致 tsc 崩潰)
const DialogContext = createContext<any>(null);
const useDialog = () => useContext(DialogContext);
function DialogProvider({ children }: any) {
  const [state, setState] = useState<any>({ visible: false });
  const alert = (msg: string) => new Promise<void>(res => setState({ visible: true, msg, onConfirm: () => { setState({ visible: false }); res(); } }));
  const confirm = (msg: string) => new Promise<boolean>(res => setState({ visible: true, msg, showCancel: true, onConfirm: () => { setState({ visible: false }); res(true); }, onCancel: () => { setState({ visible: false }); res(false); } }));
  return (
    <DialogContext.Provider value={{ alert, confirm }}>
      {children}
      {state.visible && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999}}>
          <div style={{background:'#222',padding:20,borderRadius:8,minWidth:300,color:'#fff'}}>
            <div>{state.msg}</div>
            <div style={{marginTop:20,textAlign:'right'}}>
              {state.showCancel && <button onClick={state.onCancel} style={{marginRight:10}}>{Lang.get('common.cancel')}</button>}
              <button onClick={state.onConfirm}>{Lang.get('common.confirm')}</button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

const AUTH_ENABLED = false; 

function AppContent() {
  const LangHook = useLang();
  const dialog = useDialog();
  const [view, setView] = useState<'market' | 'plugins' | 'creator' | 'wallet' | 'settings'>('market');
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [authState, setAuthState] = useState<AuthState | null>(AUTH_ENABLED ? null : { isLoggedIn: true });

  useEffect(() => {
    if (AUTH_ENABLED) {
      ipc.auth.getState().then(setAuthState).catch(console.error);
      const unlisten = onOpenUrl((urls) => { try { const url = new URL(urls[0]); if (url.protocol === 'morget:' && url.hostname === 'auth') { const c = url.searchParams.get('code'); const s = url.searchParams.get('state'); if (c && s) ipc.auth.callback(c, s).then(() => ipc.auth.getState().then(setAuthState)); } } catch (e) {} });
      return () => { unlisten.then(fn => fn()); };
    }
  }, []);

  useEffect(() => { loadData(); }, [authState]);
  useEffect(() => { if (!settings) return; document.documentElement.style.fontSize = `${settings.scale * 14}px`; const isDark = settings.theme === 'system' ? window.matchMedia('(prefers-color-scheme: dark)').matches : settings.theme === 'dark'; document.body.className = isDark ? 'dark' : 'light'; if (settings.premiumUI) document.body.classList.add('premium-ui'); else document.body.classList.remove('premium-ui'); Lang.setLocale(settings.language); }, [settings]);

  const loadData = async () => { try { const [p, s] = await Promise.all([ipc.plugin.list(), ipc.settings.get()]); setPlugins(p); setSettings(s); } catch (e) { console.error(e); } };
  const handleLogout = () => { if (AUTH_ENABLED) ipc.auth.logout(); setAuthState({ isLoggedIn: false }); };

  if (AUTH_ENABLED) { if (!authState) return <div className="loading-screen">{LangHook.get('common.loading')}</div>; if (!authState.isLoggedIn) return <LoginView />; }
  if (!settings) return <div className="loading-screen">{LangHook.get('common.loading')}</div>;

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo">{LangHook.get('app.name')}</div>
        <nav>
          <button className={`nav-btn ${view === 'market' ? 'active' : ''}`} onClick={() => setView('market')}>{LangHook.get('nav.market')}</button>
          <button className={`nav-btn ${view === 'plugins' ? 'active' : ''}`} onClick={() => setView('plugins')}>{LangHook.get('nav.plugins')}</button>
          <button className={`nav-btn ${view === 'creator' ? 'active' : ''}`} onClick={() => setView('creator')}>{LangHook.get('nav.creator')}</button>
          <button className={`nav-btn ${view === 'wallet' ? 'active' : ''}`} onClick={() => setView('wallet')}>{LangHook.get('nav.wallet')}</button>
          <button className={`nav-btn ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>{LangHook.get('nav.settings')}</button>
          <div style={{flex: 1}}></div>
          {AUTH_ENABLED && <button className="nav-btn logout-btn" onClick={handleLogout}>{LangHook.get('nav.logout')}</button>}
        </nav>
      </aside>
      <main className="main-content">
        {view === 'market' && <MarketView />}
        {view === 'creator' && <CreatorView />}
        {view === 'wallet' && <WalletView />}
        {view === 'plugins' && (
          <div className="panel">
            <div className="panel-header"><h2>{LangHook.get('plugins.title')} {LangHook.get('plugins.count', { count: plugins.length })}</h2><button className="btn btn-primary" onClick={async () => { const res = await ipc.plugin.installViaDialog(); if (res.success) { await dialog.alert(LangHook.get('plugins.install.success', { name: res.pluginName })); loadData(); } }}>{LangHook.get('plugins.install')}</button></div>
            <div className="plugin-list">
              {plugins.map((p) => (<div key={p.id} className="plugin-card"><div className="plugin-info"><span className={`badge ${p.kind.toLowerCase()}`}>{p.kind}</span><strong>{p.name}</strong> <span className="version">v{p.version}</span><p className="desc">{p.description}</p></div><div className="plugin-actions"><label className="toggle"><input type="checkbox" checked={p.isEnabled} onChange={async (e) => { await ipc.plugin.toggle(p.id, e.target.checked); loadData(); }} /><span className="slider"></span></label><button className="btn btn-danger" onClick={async () => { if(await dialog.confirm(LangHook.get('plugins.uninstall.confirm', {name: p.name}))) { await ipc.plugin.uninstall(p.id); loadData(); } }}>{LangHook.get('plugins.uninstall')}</button></div></div>))}
              {plugins.length === 0 && <div className="empty-state">{LangHook.get('plugins.empty')}</div>}
            </div>
          </div>
        )}
        {view === 'settings' && <SettingsView />}
      </main>
    </div>
  );
}

export default function App() { return <DialogProvider><AppContent /></DialogProvider>; }
