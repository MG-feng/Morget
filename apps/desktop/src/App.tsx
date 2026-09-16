import React, { useState, useEffect, createContext, useContext } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';

// === 1. IPC Client (內聯) ===
const ipc = {
  plugin: {
    list: () => invoke('plugin_list'),
    installViaDialog: () => invoke('plugin_install_via_dialog'),
    uninstall: (pluginId: string) => invoke('plugin_uninstall', { pluginId }),
    toggle: (pluginId: string, enabled: boolean) => invoke('plugin_toggle', { pluginId, enabled }),
  },
  settings: {
    get: () => invoke('settings_get'),
    set: (settings: any) => invoke('settings_set', { settings }),
    selectDirectory: () => invoke('settings_select_directory'),
    getCacheSize: () => invoke('settings_get_cache_size'),
    clearCache: () => invoke('settings_clear_cache'),
  },
  auth: {
    login: () => invoke('auth_login'),
    callback: (code: string, callbackState: string) => invoke('auth_callback', { code, callbackState }),
    getState: () => invoke('auth_get_state'),
    logout: () => invoke('auth_logout'),
  },
};

// === 2. i18n 語言包 (內聯) ===
const locales: Record<string, Record<string, string>> = {
  'zh-TW': {
    'app.name': 'MORGET', 'common.loading': '載入中...', 'common.confirm': '確認', 'common.cancel': '取消', 'common.success': '成功', 'common.error': '錯誤',
    'nav.plugins': '插件管理', 'nav.settings': '系統設置', 'nav.logout': '登出',
    'auth.subtitle': '登錄以同步您的插件與 G 幣資產', 'auth.login': '使用 WorkOS 登錄',
    'plugins.title': '已安裝插件', 'plugins.count': '({count})', 'plugins.install': '安裝插件', 'plugins.uninstall': '卸載',
    'plugins.uninstall.confirm': '確定卸載 {name} 嗎？', 'plugins.empty': '暫無插件，請點擊右上角安裝。',
    'plugins.install.success': '插件 {name} 安裝成功', 'plugins.install.failed': '安裝失敗：{error}',
    'plugins.uninstall.success': '卸載成功', 'plugins.uninstall.failed': '卸載失敗：{error}', 'plugins.toggle.failed': '切換失敗：{error}',
    'settings.tab.general': '常規', 'settings.tab.appearance': '外觀', 'settings.tab.performance': '性能', 'settings.tab.graphics': '畫面', 'settings.tab.storage': '存儲',
    'settings.general.title': '基本設置', 'settings.general.language': '語言', 'settings.general.autoUpdate': '自動更新',
    'settings.appearance.title': '外觀', 'settings.appearance.theme': '主題', 'settings.appearance.scale': '縮放',
    'settings.performance.title': '性能', 'settings.performance.loading': '加載模式', 'settings.performance.gpu': 'GPU',
    'settings.graphics.title': '畫面', 'settings.graphics.fps': 'FPS', 'settings.graphics.vsync': '垂直同步', 'settings.graphics.premiumUI': '精美UI',
    'settings.storage.title': '存儲', 'settings.storage.downloadPath': '下載路徑', 'settings.storage.cache': '緩存', 'settings.storage.cache.clear': '清理',
    'lang.zh-TW': '繁體中文', 'lang.zh-CN': '簡體中文', 'lang.en-US': 'English',
    'theme.dark': '深色', 'theme.light': '淺色', 'theme.system': '系統',
    'loading.stream': '流加載', 'loading.full': '全量', 'gpu.auto': '自動', 'gpu.integrated': '核顯', 'gpu.dedicated': '獨顯', 'fps.unlimited': '無限制'
  },
  'zh-CN': {
    'app.name': 'MORGET', 'common.loading': '加载中...', 'common.confirm': '确认', 'common.cancel': '取消', 'common.success': '成功', 'common.error': '错误',
    'nav.plugins': '插件管理', 'nav.settings': '系统设置', 'nav.logout': '登出',
    'auth.subtitle': '登录以同步您的插件与 G 币资产', 'auth.login': '使用 WorkOS 登录',
    'plugins.title': '已安装插件', 'plugins.count': '({count})', 'plugins.install': '安装插件', 'plugins.uninstall': '卸载',
    'plugins.uninstall.confirm': '确定卸载 {name} 吗？', 'plugins.empty': '暂无插件，请点击右上角安装。',
    'plugins.install.success': '插件 {name} 安装成功', 'plugins.install.failed': '安装失败：{error}',
    'plugins.uninstall.success': '卸载成功', 'plugins.uninstall.failed': '卸载失败：{error}', 'plugins.toggle.failed': '切换失败：{error}',
    'settings.tab.general': '常规', 'settings.tab.appearance': '外观', 'settings.tab.performance': '性能', 'settings.tab.graphics': '画面', 'settings.tab.storage': '存储',
    'settings.general.title': '基本设置', 'settings.general.language': '语言', 'settings.general.autoUpdate': '自动更新',
    'settings.appearance.title': '外观', 'settings.appearance.theme': '主题', 'settings.appearance.scale': '缩放',
    'settings.performance.title': '性能', 'settings.performance.loading': '加载模式', 'settings.performance.gpu': 'GPU',
    'settings.graphics.title': '画面', 'settings.graphics.fps': 'FPS', 'settings.graphics.vsync': '垂直同步', 'settings.graphics.premiumUI': '精美UI',
    'settings.storage.title': '存储', 'settings.storage.downloadPath': '下载路径', 'settings.storage.cache': '缓存', 'settings.storage.cache.clear': '清理',
    'lang.zh-TW': '繁體中文', 'lang.zh-CN': '简体中文', 'lang.en-US': 'English',
    'theme.dark': '深色', 'theme.light': '浅色', 'theme.system': '系统',
    'loading.stream': '流加载', 'loading.full': '全量', 'gpu.auto': '自动', 'gpu.integrated': '核显', 'gpu.dedicated': '独显', 'fps.unlimited': '无限制'
  },
  'en-US': {
    'app.name': 'MORGET', 'common.loading': 'Loading...', 'common.confirm': 'Confirm', 'common.cancel': 'Cancel', 'common.success': 'Success', 'common.error': 'Error',
    'nav.plugins': 'Plugins', 'nav.settings': 'Settings', 'nav.logout': 'Logout',
    'auth.subtitle': 'Login to sync plugins and G-Coins', 'auth.login': 'Login with WorkOS',
    'plugins.title': 'Installed Plugins', 'plugins.count': '({count})', 'plugins.install': 'Install', 'plugins.uninstall': 'Uninstall',
    'plugins.uninstall.confirm': 'Uninstall {name}?', 'plugins.empty': 'No plugins. Click install.',
    'plugins.install.success': 'Plugin {name} installed', 'plugins.install.failed': 'Install failed: {error}',
    'plugins.uninstall.success': 'Uninstalled', 'plugins.uninstall.failed': 'Uninstall failed: {error}', 'plugins.toggle.failed': 'Toggle failed: {error}',
    'settings.tab.general': 'General', 'settings.tab.appearance': 'Appearance', 'settings.tab.performance': 'Performance', 'settings.tab.graphics': 'Graphics', 'settings.tab.storage': 'Storage',
    'settings.general.title': 'Basic', 'settings.general.language': 'Language', 'settings.general.autoUpdate': 'Auto Update',
    'settings.appearance.title': 'Appearance', 'settings.appearance.theme': 'Theme', 'settings.appearance.scale': 'Scale',
    'settings.performance.title': 'Performance', 'settings.performance.loading': 'Loading', 'settings.performance.gpu': 'GPU',
    'settings.graphics.title': 'Graphics', 'settings.graphics.fps': 'FPS', 'settings.graphics.vsync': 'VSync', 'settings.graphics.premiumUI': 'Premium UI',
    'settings.storage.title': 'Storage', 'settings.storage.downloadPath': 'Download Path', 'settings.storage.cache': 'Cache', 'settings.storage.cache.clear': 'Clear',
    'lang.zh-TW': '繁體中文', 'lang.zh-CN': '简体中文', 'lang.en-US': 'English',
    'theme.dark': 'Dark', 'theme.light': 'Light', 'theme.system': 'System',
    'loading.stream': 'Stream', 'loading.full': 'Full', 'gpu.auto': 'Auto', 'gpu.integrated': 'Integrated', 'gpu.dedicated': 'Dedicated', 'fps.unlimited': 'Unlimited'
  }
};

let currentLocale = 'zh-TW';
const Lang = {
  get: (key: string, params?: Record<string, any>) => {
    let text = locales[currentLocale]?.[key] || locales['zh-TW']?.[key] || key;
    if (params) Object.entries(params).forEach(([k, v]) => { text = text.replace(`{${k}}`, String(v)); });
    return text;
  },
  set: (loc: string) => { currentLocale = loc; }
};

// === 3. Dialog (內聯) ===
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

// === 4. Views (內聯) ===
function LoginView({ onLoginSuccess }: any) {
  const [loading, setLoading] = useState(false);
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',flexDirection:'column'}}>
      <h1>{Lang.get('app.name')}</h1>
      <p>{Lang.get('auth.subtitle')}</p>
      <button onClick={async () => { setLoading(true); await ipc.auth.login(); }} disabled={loading}>
        {loading ? Lang.get('common.loading') : Lang.get('auth.login')}
      </button>
    </div>
  );
}

function SettingsView() {
  const [settings, setSettings] = useState<any>(null);
  useEffect(() => { ipc.settings.get().then(setSettings); }, []);
  if (!settings) return <div style={{textAlign:'center',marginTop:100}}>{Lang.get('common.loading')}</div>;
  const update = async (k: string, v: any) => { const n = { ...settings, [k]: v }; setSettings(n); await ipc.settings.set({ [k]: v }); };
  return (
    <div style={{padding:20}}>
      <h2>{Lang.get('nav.settings')}</h2>
      <div style={{marginBottom:15}}>
        <label>{Lang.get('settings.general.language')}: </label>
        <select value={settings.language} onChange={e => update('language', e.target.value)}>
          <option value="zh-TW">{Lang.get('lang.zh-TW')}</option>
          <option value="zh-CN">{Lang.get('lang.zh-CN')}</option>
          <option value="en-US">{Lang.get('lang.en-US')}</option>
        </select>
      </div>
      <div style={{marginBottom:15}}>
        <label>{Lang.get('settings.appearance.theme')}: </label>
        <select value={settings.theme} onChange={e => update('theme', e.target.value)}>
          <option value="dark">{Lang.get('theme.dark')}</option>
          <option value="light">{Lang.get('theme.light')}</option>
          <option value="system">{Lang.get('theme.system')}</option>
        </select>
      </div>
      <div style={{marginBottom:15}}>
        <label>{Lang.get('settings.graphics.fps')}: {settings.fps === 0 ? Lang.get('fps.unlimited') : settings.fps}</label><br/>
        <input type="range" min="0" max="300" step="10" value={settings.fps} onChange={e => update('fps', parseInt(e.target.value))} style={{width:300}} />
      </div>
    </div>
  );
}

// === 5. Main App ===
function AppContent() {
  const [view, setView] = useState('plugins');
  const [plugins, setPlugins] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [authState, setAuthState] = useState<any>(null);
  const dialog = useDialog();

  useEffect(() => {
    ipc.auth.getState().then(setAuthState);
    const unlisten = onOpenUrl((urls) => {
      try {
        const url = new URL(urls[0]);
        if (url.protocol === 'morget:' && url.hostname === 'auth') {
          const code = url.searchParams.get('code');
          const state = url.searchParams.get('state');
          if (code && state) ipc.auth.callback(code, state).then(() => ipc.auth.getState().then(setAuthState));
        }
      } catch (e) {}
    });
    return () => { unlisten.then(fn => fn()); };
  }, []);

  useEffect(() => { if (authState?.isLoggedIn) { ipc.plugin.list().then(setPlugins); ipc.settings.get().then(setSettings); } }, [authState]);
  useEffect(() => { if (settings) { Lang.set(settings.language); document.body.className = settings.theme === 'dark' ? 'dark' : 'light'; } }, [settings]);

  if (!authState) return <div style={{textAlign:'center',marginTop:100}}>{Lang.get('common.loading')}</div>;
  if (!authState.isLoggedIn) return <LoginView onLoginSuccess={() => ipc.auth.getState().then(setAuthState)} />;
  if (!settings) return <div style={{textAlign:'center',marginTop:100}}>{Lang.get('common.loading')}</div>;

  const handleInstall = async () => {
    const res: any = await ipc.plugin.installViaDialog();
    if (res.success) { dialog.alert(Lang.get('plugins.install.success', { name: res.pluginName })); ipc.plugin.list().then(setPlugins); }
    else if (!res.cancelled) dialog.alert(Lang.get('plugins.install.failed', { error: res.error }));
  };

  const handleUninstall = async (id: string, name: string) => {
    if (await dialog.confirm(Lang.get('plugins.uninstall.confirm', { name }))) {
      const res: any = await ipc.plugin.uninstall(id);
      if (res.success) { dialog.alert(Lang.get('plugins.uninstall.success')); ipc.plugin.list().then(setPlugins); }
    }
  };

  return (
    <div style={{display:'flex',height:'100vh',background:'#f5f5f5'}}>
      <aside style={{width:200,background:'#111',color:'#fff',padding:20}}>
        <h2>{Lang.get('app.name')}</h2>
        <button onClick={() => setView('plugins')} style={{display:'block',margin:'15px 0',background:'transparent',border:'none',color:'#fff',cursor:'pointer',fontSize:16}}>{Lang.get('nav.plugins')}</button>
        <button onClick={() => setView('settings')} style={{display:'block',margin:'15px 0',background:'transparent',border:'none',color:'#fff',cursor:'pointer',fontSize:16}}>{Lang.get('nav.settings')}</button>
        <button onClick={() => ipc.auth.logout().then(() => setAuthState({isLoggedIn:false}))} style={{display:'block',margin:'15px 0',background:'transparent',border:'none',color:'red',cursor:'pointer',fontSize:16}}>{Lang.get('nav.logout')}</button>
      </aside>
      <main style={{flex:1,padding:20,overflow:'auto'}}>
        {view === 'plugins' && (
          <div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:20}}>
              <h2>{Lang.get('plugins.title')} {Lang.get('plugins.count', { count: plugins.length })}</h2>
              <button onClick={handleInstall} style={{padding:'8px 16px',background:'#00a8ff',color:'#fff',border:'none',borderRadius:4,cursor:'pointer'}}>{Lang.get('plugins.install')}</button>
            </div>
            {plugins.length === 0 && <p style={{color:'#666'}}>{Lang.get('plugins.empty')}</p>}
            {plugins.map((p: any) => (
              <div key={p.id} style={{background:'#fff',border:'1px solid #ddd',padding:15,marginBottom:10,display:'flex',justifyContent:'space-between',borderRadius:8}}>
                <div>
                  <strong style={{fontSize:16}}>{p.name}</strong> <span style={{color:'#666',marginLeft:10}}>v{p.version}</span> <span style={{background:'#eee',padding:'2px 8px',borderRadius:4,marginLeft:10,fontSize:12}}>{p.kind}</span>
                  <p style={{color:'#666',marginTop:5}}>{p.description}</p>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <input type="checkbox" checked={p.isEnabled} onChange={async e => { await ipc.plugin.toggle(p.id, e.target.checked); ipc.plugin.list().then(setPlugins); }} />
                  <button onClick={() => handleUninstall(p.id, p.name)} style={{padding:'5px 10px',background:'#ff4757',color:'#fff',border:'none',borderRadius:4,cursor:'pointer'}}>{Lang.get('plugins.uninstall')}</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {view === 'settings' && <SettingsView />}
      </main>
    </div>
  );
}

export default function App() {
  return <DialogProvider><AppContent /></DialogProvider>;
}
