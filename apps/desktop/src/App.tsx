import React, { useState, useEffect } from 'react';
import { ipc } from './ipc/client';
import type { PluginInfo, AppSettings } from '@morget/ipc-contract';
import SettingsView from './views/SettingsView';
import { useI18n } from './frontends/default/I18nProvider'; 
import { useMorgetDialog } from './components/MorgetDialog';
import './frontends/default/theme.css';

export default function App() {
  const { t, setLocale } = useI18n();
  const dialog = useMorgetDialog();
  const [view, setView] = useState<'plugins' | 'settings'>('plugins');
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [premiumLoaded, setPremiumLoaded] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!settings) return;
    // 應用縮放
    document.documentElement.style.fontSize = `${settings.scale * 14}px`;
    // 應用主題
    document.body.className = settings.theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : settings.theme;
    // 應用語言
    setLocale(settings.language);
    // 應用精美界面
    if (settings.premiumUI && !premiumLoaded) {
      import('./frontends/default/premium.css').then(() => setPremiumLoaded(true));
    }
  }, [settings]);

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
      else dialog.alert(res.error || '安裝失敗');
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    const res = await ipc.plugin.toggle(id, enabled);
    if (res.success) loadData();
    else dialog.alert(res.error || '切換失敗');
  };

  const handleUninstall = async (id: string, name: string) => {
    const confirmed = await dialog.confirm(t('plugins.uninstall.confirm', { name }));
    if (confirmed) {
      const res = await ipc.plugin.uninstall(id);
      if (res.success) loadData();
      else dialog.alert(res.error || '卸載失敗');
    }
  };

  if (!settings) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-secondary)' }}>{t('common.loading', {}, '載入中...')}</div>;

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo">{t('app.name')}</div>
        <nav>
          <button className={view === 'plugins' ? 'active' : ''} onClick={() => setView('plugins')}>
            {t('nav.plugins')}
          </button>
          <button className={view === 'settings' ? 'active' : ''} onClick={() => setView('settings')}>
            {t('nav.settings')}
          </button>
        </nav>
      </aside>
      <main className="main-content">
        {view === 'plugins' && (
          <div className="panel">
            <div className="panel-header">
              <h2>{t('plugins.title')} ({plugins.length})</h2>
              <button className="btn btn-primary" onClick={handleInstall}>{t('plugins.install')}</button>
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
                    <button className="btn btn-danger" onClick={() => handleUninstall(p.id, p.name)}>
                      {t('plugins.uninstall')}
                    </button>
                  </div>
                </div>
              ))}
              {plugins.length === 0 && <div className="empty-state">{t('plugins.empty')}</div>}
            </div>
          </div>
        )}
        {view === 'settings' && <SettingsView />}
      </main>
    </div>
  );
}
