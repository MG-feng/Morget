import React, { useState, useEffect, createContext, useContext } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';

// === I18N ===
const dict: Record<string, Record<string, string>> = {
  'zh-TW': { 'app.name': 'MORGET', 'common.loading': '載入中...', 'common.confirm': '確認', 'common.cancel': '取消', 'nav.plugins': '插件管理', 'nav.settings': '系統設置', 'nav.market': '插件市場', 'nav.creator': '創作者中心', 'nav.wallet': 'G幣錢包', 'nav.logout': '登出', 'auth.subtitle': '登錄以同步資產', 'auth.login': 'WorkOS 登錄', 'plugins.title': '已安裝插件', 'plugins.install': '安裝插件', 'plugins.uninstall': '卸載', 'plugins.uninstall.confirm': '確定卸載 {name}？', 'plugins.empty': '暫無插件', 'plugins.install.success': '安裝成功', 'market.search': '搜尋...', 'market.back': '返回', 'market.detail_view': '停留10秒得5G幣...', 'market.download_btn': '下載安裝', 'creator.auth_github': '連接 GitHub', 'creator.upload_title': '上傳插件', 'creator.select_repo': '選擇倉庫', 'creator.version': '版本號', 'creator.file_path': '文件路徑', 'creator.browse': '瀏覽', 'creator.upload_btn': '確認上傳', 'creator.missing_fields': '請填寫完整', 'wallet.balance': '當前餘額', 'wallet.history': '交易紀錄', 'settings.general.title': '基本', 'settings.general.language': '語言', 'settings.appearance.title': '外觀', 'settings.appearance.theme': '主題', 'settings.performance.title': '性能', 'settings.performance.loading': '加載模式', 'settings.performance.loading.stream': '流加載', 'settings.performance.loading.full': '全量', 'settings.performance.gpu': 'GPU 加速', 'settings.performance.gpu.auto': '自動', 'settings.performance.gpu.integrated': '核顯', 'settings.performance.gpu.dedicated': '獨顯', 'settings.graphics.title': '畫面', 'settings.graphics.fps': 'FPS 上限', 'settings.graphics.fps.unlimited': '無限制', 'settings.graphics.vsync': '垂直同步', 'settings.storage.title': '存儲', 'settings.storage.cache': '緩存', 'settings.storage.cache.clear': '清理', 'settings.storage.cache.cleared': '已清理 {size} MB', 'lang.zh-TW': '繁體', 'lang.zh-CN': '簡體', 'lang.en-US': 'English', 'theme.dark': '深色', 'theme.light': '淺色', 'theme.system': '系統', 'auth.guard.title': '🔒 需要登錄', 'auth.guard.desc': '請先登錄您的帳號以訪問此功能。', 'market.not_configured': 'Market API 未配置，請聯繫管理員。', 'github.not_implemented': 'GitHub OAuth 尚未接入，請等待後續更新。', 'wallet.not_configured': '錢包系統尚未接入真實數據庫。' },
  'zh-CN': { 'app.name': 'MORGET', 'common.loading': '加载中...', 'common.confirm': '确认', 'common.cancel': '取消', 'nav.plugins': '插件管理', 'nav.settings': '系统设置', 'nav.market': '插件市场', 'nav.creator': '创作者中心', 'nav.wallet': 'G币钱包', 'nav.logout': '登出', 'auth.subtitle': '登录以同步资产', 'auth.login': 'WorkOS 登录', 'plugins.title': '已安装插件', 'plugins.install': '安装插件', 'plugins.uninstall': '卸载', 'plugins.uninstall.confirm': '确定卸载 {name}？', 'plugins.empty': '暂无插件', 'plugins.install.success': '安装成功', 'market.search': '搜索...', 'market.back': '返回', 'market.detail_view': '停留10秒得5G币...', 'market.download_btn': '下载安装', 'creator.auth_github': '连接 GitHub', 'creator.upload_title': '上传插件', 'creator.select_repo': '选择仓库', 'creator.version': '版本号', 'creator.file_path': '文件路径', 'creator.browse': '浏览', 'creator.upload_btn': '确认上传', 'creator.missing_fields': '请填写完整', 'wallet.balance': '当前余额', 'wallet.history': '交易记录', 'settings.general.title': '基本', 'settings.general.language': '语言', 'settings.appearance.title': '外观', 'settings.appearance.theme': '主题', 'settings.performance.title': '性能', 'settings.performance.loading': '加载模式', 'settings.performance.loading.stream': '流加载', 'settings.performance.loading.full': '全量', 'settings.performance.gpu': 'GPU 加速', 'settings.performance.gpu.auto': '自动', 'settings.performance.gpu.integrated': '核显', 'settings.performance.gpu.dedicated': '独显', 'settings.graphics.title': '画面', 'settings.graphics.fps': 'FPS 上限', 'settings.graphics.fps.unlimited': '无限制', 'settings.graphics.vsync': '垂直同步', 'settings.storage.title': '存储', 'settings.storage.cache': '缓存', 'settings.storage.cache.clear': '清理', 'settings.storage.cache.cleared': '已清理 {size} MB', 'lang.zh-TW': '繁体', 'lang.zh-CN': '简体', 'lang.en-US': 'English', 'theme.dark': '深色', 'theme.light': '浅色', 'theme.system': '系统', 'auth.guard.title': '🔒 需要登录', 'auth.guard.desc': '请先登录您的账号以访问此功能。', 'market.not_configured': 'Market API 未配置，请联系管理员。', 'github.not_implemented': 'GitHub OAuth 尚未接入，请等待后续更新。', 'wallet.not_configured': '钱包系统尚未接入真实数据库。' },
  'en-US': { 'app.name': 'MORGET', 'common.loading': 'Loading...', 'common.confirm': 'OK', 'common.cancel': 'Cancel', 'nav.plugins': 'Plugins', 'nav.settings': 'Settings', 'nav.market': 'Market', 'nav.creator': 'Creator', 'nav.wallet': 'Wallet', 'nav.logout': 'Logout', 'auth.subtitle': 'Login to sync', 'auth.login': 'WorkOS Login', 'plugins.title': 'Installed', 'plugins.install': 'Install', 'plugins.uninstall': 'Uninstall', 'plugins.uninstall.confirm': 'Uninstall {name}?', 'plugins.empty': 'No plugins', 'plugins.install.success': 'Installed', 'market.search': 'Search...', 'market.back': 'Back', 'market.detail_view': 'Stay 10s for 5G...', 'market.download_btn': 'Download', 'creator.auth_github': 'Connect GitHub', 'creator.upload_title': 'Upload', 'creator.select_repo': 'Select Repo', 'creator.version': 'Version', 'creator.file_path': 'File', 'creator.browse': 'Browse', 'creator.upload_btn': 'Upload', 'creator.missing_fields': 'Missing fields', 'wallet.balance': 'Balance', 'wallet.history': 'History', 'settings.general.title': 'General', 'settings.general.language': 'Language', 'settings.appearance.title': 'Appearance', 'settings.appearance.theme': 'Theme', 'settings.performance.title': 'Performance', 'settings.performance.loading': 'Loading', 'settings.performance.loading.stream': 'Stream', 'settings.performance.loading.full': 'Full', 'settings.performance.gpu': 'GPU', 'settings.performance.gpu.auto': 'Auto', 'settings.performance.gpu.integrated': 'Integrated', 'settings.performance.gpu.dedicated': 'Dedicated', 'settings.graphics.title': 'Graphics', 'settings.graphics.fps': 'FPS Limit', 'settings.graphics.fps.unlimited': 'Unlimited', 'settings.graphics.vsync': 'VSync', 'settings.storage.title': 'Storage', 'settings.storage.cache': 'Cache', 'settings.storage.cache.clear': 'Clear', 'settings.storage.cache.cleared': 'Cleared {size} MB', 'lang.zh-TW': 'Traditional', 'lang.zh-CN': 'Simplified', 'lang.en-US': 'English', 'theme.dark': 'Dark', 'theme.light': 'Light', 'theme.system': 'System', 'auth.guard.title': '🔒 Auth Required', 'auth.guard.desc': 'Please login to access this feature.', 'market.not_configured': 'Market API not configured.', 'github.not_implemented': 'GitHub OAuth not implemented yet.', 'wallet.not_configured': 'Wallet DB not connected.' }
};
let curLang = 'zh-TW';
const Lang = { get: (k: string, p?: any) => { let t = dict[curLang]?.[k] || dict['zh-TW']?.[k] || k; if (p) Object.entries(p).forEach(([k, v]) => { t = t.replace(`{${k}}`, String(v)); }); return t; }, set: (l: string) => { curLang = l; } };

// === Dialog ===
const DlgCtx = createContext<any>(null);
const useDlg = () => useContext(DlgCtx);
function DlgProvider({ children }: any) {
  const [st, setSt] = useState<any>({ visible: false });
  const alert = (msg: string) => new Promise<void>(res => setSt({ visible: true, msg, onConfirm: () => { setSt({ visible: false }); res(); } }));
  const confirm = (msg: string) => new Promise<boolean>(res => setSt({ visible: true, msg, showCancel: true, onConfirm: () => { setSt({ visible: false }); res(true); }, onCancel: () => { setSt({ visible: false }); res(false); } }));
  return (
    <DlgCtx.Provider value={{ alert, confirm }}>
      {children}
      {st.visible && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999}}>
          <div style={{background:'#1e1e1e',padding:24,borderRadius:12,minWidth:320,color:'#fff',boxShadow:'0 10px 25px rgba(0,0,0,0.5)'}}>
            <div style={{marginBottom:20, fontSize:16}}>{st.msg}</div>
            <div style={{textAlign:'right', display:'flex', gap:10, justifyContent:'flex-end'}}>
              {st.showCancel && <button onClick={st.onCancel} style={{padding:'8px 16px', cursor:'pointer', background:'transparent', border:'1px solid #444', color:'#fff', borderRadius:6}}>{Lang.get('common.cancel')}</button>}
              <button onClick={st.onConfirm} style={{padding:'8px 16px', background:'#00a8ff', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:'bold'}}>{Lang.get('common.confirm')}</button>
            </div>
          </div>
        </div>
      )}
    </DlgCtx.Provider>
  );
}

// === Auth Guard ===
function AuthGuard() {
  return (
    <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'70vh', color:'#888', background:'#181818', borderRadius:12, margin:20}}>
      <h2 style={{fontSize:28, marginBottom:10}}>{Lang.get('auth.guard.title')}</h2>
      <p style={{fontSize:16}}>{Lang.get('auth.guard.desc')}</p>
    </div>
  );
}

// === Views ===
function MarketView({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [plugins, setPlugins] = useState<any[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { if (!isLoggedIn) return; invoke('market_search', { query: '' }).then(setPlugins).catch(e => setError(e)); }, [isLoggedIn]);
  if (!isLoggedIn) return <AuthGuard />;
  if (error) return <div style={{padding:40, textAlign:'center', color:'#ff4757', background:'#181818', borderRadius:12, margin:20}}>⚠️ {error === 'MARKET_NOT_CONFIGURED' ? Lang.get('market.not_configured') : error}</div>;
  return (
    <div style={{padding:20}}>
      <h2 style={{color:'#fff', marginBottom:20}}>{Lang.get('nav.market')}</h2>
      {plugins.length === 0 ? <div style={{textAlign:'center', padding:60, color:'#888', background:'#181818', borderRadius:12}}>Market Empty or Network Disconnected.</div> : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:20}}>
          {plugins.map((p: any) => (<div key={p.id} style={{background:'#1e1e1e', border:'1px solid #333', borderRadius:12, padding:20}}><h3 style={{color:'#fff', margin:0}}>{p.name}</h3><p style={{color:'#aaa', fontSize:14, margin:'10px 0'}}>{p.description}</p><div style={{display:'flex', gap:15, fontSize:12, color:'#666'}}><span>👁 {p.views}</span><span>👍 {p.likes}</span><span>⬇️ {p.downloads}</span></div></div>))}
        </div>
      )}
    </div>
  );
}

function CreatorView({ isLoggedIn }: { isLoggedIn: boolean }) {
  if (!isLoggedIn) return <AuthGuard />;
  return <div style={{padding:40, textAlign:'center', color:'#ff4757', background:'#181818', borderRadius:12, margin:20}}>⚠️ {Lang.get('github.not_implemented')}</div>;
}

function WalletView({ isLoggedIn }: { isLoggedIn: boolean }) {
  if (!isLoggedIn) return <AuthGuard />;
  return <div style={{padding:40, textAlign:'center', color:'#ff4757', background:'#181818', borderRadius:12, margin:20}}>⚠️ {Lang.get('wallet.not_configured')}</div>;
}

function SettingsView() {
  const dlg = useDlg();
  const [s, setS] = useState<any>(null);
  const [c, setC] = useState(0);
  useEffect(() => { invoke('settings_get').then(setS); invoke('settings_get_cache_size').then(setC); }, []);
  if (!s) return <div style={{padding:20, color:'#fff'}}>{Lang.get('common.loading')}</div>;
  const upd = async (k: string, v: any) => { const n = { ...s, [k]: v }; setS(n); await invoke('settings_set', { settings: { [k]: v } }); };
  
  const cardStyle = { background: '#1e1e1e', padding: 24, borderRadius: 12, marginBottom: 20, border: '1px solid #333' };
  const rowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 };
  const labelStyle = { color: '#e0e0e0', fontSize: 15 };
  const selectStyle = { background: '#2a2a2a', color: '#fff', border: '1px solid #444', padding: '8px 12px', borderRadius: 6, outline: 'none' };

  return (
    <div style={{padding:20, maxWidth:800, margin:'0 auto'}}>
      <h2 style={{color:'#fff', marginBottom:20}}>{Lang.get('nav.settings')}</h2>
      
      <div style={cardStyle}>
        <h3 style={{color:'#00a8ff', marginTop:0}}>{Lang.get('settings.general.title')}</h3>
        <div style={rowStyle}>
          <span style={labelStyle}>{Lang.get('settings.general.language')}</span>
          <select value={s.language} onChange={e => { upd('language', e.target.value); Lang.set(e.target.value); }} style={selectStyle}>
            <option value="zh-TW">{Lang.get('lang.zh-TW')}</option><option value="zh-CN">{Lang.get('lang.zh-CN')}</option><option value="en-US">{Lang.get('lang.en-US')}</option>
          </select>
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={{color:'#00a8ff', marginTop:0}}>{Lang.get('settings.appearance.title')}</h3>
        <div style={rowStyle}>
          <span style={labelStyle}>{Lang.get('settings.appearance.theme')}</span>
          <select value={s.theme} onChange={e => upd('theme', e.target.value)} style={selectStyle}>
            <option value="dark">{Lang.get('theme.dark')}</option><option value="light">{Lang.get('theme.light')}</option><option value="system">{Lang.get('theme.system')}</option>
          </select>
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={{color:'#00a8ff', marginTop:0}}>{Lang.get('settings.performance.title')}</h3>
        <div style={rowStyle}>
          <span style={labelStyle}>{Lang.get('settings.performance.loading')}</span>
          <select value={s.loadingMode} onChange={e => upd('loadingMode', e.target.value)} style={selectStyle}>
            <option value="stream">{Lang.get('settings.performance.loading.stream')}</option><option value="full">{Lang.get('settings.performance.loading.full')}</option>
          </select>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>{Lang.get('settings.performance.gpu')}</span>
          <select value={s.gpuMode} onChange={e => upd('gpuMode', e.target.value)} style={selectStyle}>
            <option value="auto">{Lang.get('settings.performance.gpu.auto')}</option><option value="integrated">{Lang.get('settings.performance.gpu.integrated')}</option><option value="dedicated">{Lang.get('settings.performance.gpu.dedicated')}</option>
          </select>
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={{color:'#00a8ff', marginTop:0}}>{Lang.get('settings.graphics.title')}</h3>
        <div style={rowStyle}>
          <span style={labelStyle}>{Lang.get('settings.graphics.fps')} <small style={{color:'#888'}}>({s.fps === 0 ? Lang.get('settings.graphics.fps.unlimited') : `${s.fps} FPS`})</small></span>
          <input type="range" min="0" max="300" step="10" value={s.fps} onChange={e => upd('fps', parseInt(e.target.value))} disabled={s.vsync} style={{width:200}} />
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>{Lang.get('settings.graphics.vsync')}</span>
          <label style={{position:'relative', display:'inline-block', width:50, height:24}}>
            <input type="checkbox" checked={s.vsync} onChange={e => upd('vsync', e.target.checked)} style={{opacity:0, width:0, height:0}} />
            <span style={{position:'absolute', cursor:'pointer', top:0, left:0, right:0, bottom:0, background:s.vsync?'#00a8ff':'#444', borderRadius:24, transition:'.4s'}}></span>
          </label>
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={{color:'#00a8ff', marginTop:0}}>{Lang.get('settings.storage.title')}</h3>
        <div style={rowStyle}>
          <span style={labelStyle}>{Lang.get('settings.storage.cache')} <small style={{color:'#888'}}>({c.toFixed(2)} MB)</small></span>
          <button onClick={async () => { const r: any = await invoke('settings_clear_cache'); dlg.alert(Lang.get('settings.storage.cache.cleared', {size: r.freedMB.toFixed(2)})); setC(0); }} style={{padding:'8px 16px', background:'#ff4757', color:'#fff', border:'none', borderRadius:6, cursor:'pointer'}}>{Lang.get('settings.storage.cache.clear')}</button>
        </div>
      </div>
    </div>
  );
}

// === Main App ===
const AUTH_ENABLED = false;
function AppContent() {
  const dlg = useDlg();
  const [view, setView] = useState<'market' | 'plugins' | 'creator' | 'wallet' | 'settings'>('plugins');
  const [plugins, setPlugins] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [authState, setAuthState] = useState<any>({ isLoggedIn: false }); // Zero-Mock: 默認未登錄

  useEffect(() => { if (AUTH_ENABLED) { invoke('auth_get_state').then(setAuthState); const u = onOpenUrl((urls) => { try { const url = new URL(urls[0]); if (url.protocol === 'morget:' && url.hostname === 'auth') { const c = url.searchParams.get('code'); const s = url.searchParams.get('state'); if (c && s) invoke('auth_callback', { code: c, callbackState: s }).then(() => invoke('auth_get_state').then(setAuthState)); } } catch (e) {} }); return () => { u.then(fn => fn()); }; } }, []);
  
  useEffect(() => { 
    invoke('settings_get').then(setSettings); 
    if (authState?.isLoggedIn || !AUTH_ENABLED) invoke('plugin_list').then(setPlugins); 
  }, [authState]);

  useEffect(() => { if (settings) { Lang.set(settings.language); document.body.className = settings.theme === 'dark' ? 'dark' : 'light'; document.body.style.background = settings.theme === 'dark' ? '#121212' : '#f5f5f5'; } }, [settings]);

  if (AUTH_ENABLED && !authState?.isLoggedIn) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',flexDirection:'column', background:'#121212', color:'#fff'}}><h1>{Lang.get('app.name')}</h1><button onClick={() => invoke('auth_login')} style={{padding:'10px 20px', background:'#00a8ff', color:'#fff', border:'none', borderRadius:6, cursor:'pointer'}}>{Lang.get('auth.login')}</button></div>;
  if (!settings) return <div style={{textAlign:'center',marginTop:100, color:'#fff'}}>{Lang.get('common.loading')}</div>;

  const isLoggedIn = authState?.isLoggedIn || false;

  const navBtn = (v: string, label: string) => (
    <button onClick={() => setView(v as any)} style={{display:'block',margin:'8px 0',background:view===v?'#00a8ff':'transparent',border:'none',color:view===v?'#fff':'#aaa',cursor:'pointer',fontSize:15,padding:'10px 15px',borderRadius:8,width:'100%',textAlign:'left', fontWeight: view===v?'bold':'normal'}}>{label}</button>
  );

  return (
    <div style={{display:'flex',height:'100vh',background:settings.theme==='dark'?'#121212':'#f5f5f5'}}>
      <aside style={{width:220,background:settings.theme==='dark'?'#181818':'#fff',padding:20, display:'flex', flexDirection:'column', borderRight: `1px solid ${settings.theme==='dark'?'#333':'#eee'}`}}>
        <h2 style={{color:settings.theme==='dark'?'#fff':'#333', marginBottom:30}}>{Lang.get('app.name')}</h2>
        {navBtn('plugins', Lang.get('nav.plugins'))}
        {navBtn('market', Lang.get('nav.market'))}
        {navBtn('creator', Lang.get('nav.creator'))}
        {navBtn('wallet', Lang.get('nav.wallet'))}
        {navBtn('settings', Lang.get('nav.settings'))}
        <div style={{flex:1}}></div>
        {AUTH_ENABLED && <button onClick={() => { invoke('auth_logout'); setAuthState({isLoggedIn:false}); }} style={{display:'block',margin:'15px 0',background:'transparent',border:'none',color:'#ff4757',cursor:'pointer',fontSize:15,padding:'10px 15px',borderRadius:8,width:'100%',textAlign:'left'}}>{Lang.get('nav.logout')}</button>}
      </aside>
      <main style={{flex:1,overflow:'auto'}}>
        {view === 'market' && <MarketView isLoggedIn={isLoggedIn} />}
        {view === 'creator' && <CreatorView isLoggedIn={isLoggedIn} />}
        {view === 'wallet' && <WalletView isLoggedIn={isLoggedIn} />}
        {view === 'settings' && <SettingsView />}
        {view === 'plugins' && (
          <div style={{padding:20}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:20}}><h2 style={{color:settings.theme==='dark'?'#fff':'#333'}}>{Lang.get('plugins.title')} ({plugins.length})</h2><button onClick={async () => { const r: any = await invoke('plugin_install_via_dialog'); if(r.success){ dlg.alert(Lang.get('plugins.install.success')); invoke('plugin_list').then(setPlugins); } }} style={{padding:'8px 16px',background:'#00a8ff',color:'#fff',border:'none',borderRadius:6,cursor:'pointer'}}>{Lang.get('plugins.install')}</button></div>
            {plugins.length === 0 && <p style={{color:'#888'}}>{Lang.get('plugins.empty')}</p>}
            {plugins.map((p: any) => (<div key={p.id} style={{background:settings.theme==='dark'?'#1e1e1e':'#fff',border:`1px solid ${settings.theme==='dark'?'#333':'#eee'}`,padding:15,marginBottom:10,display:'flex',justifyContent:'space-between',borderRadius:8}}><div><strong style={{color:settings.theme==='dark'?'#fff':'#333'}}>{p.name}</strong> <span style={{color:'#888'}}>v{p.version}</span></div><button onClick={async () => { if(await dlg.confirm(Lang.get('plugins.uninstall.confirm', {name: p.name}))) { await invoke('plugin_uninstall', {pluginId: p.id}); invoke('plugin_list').then(setPlugins); } }} style={{padding:'5px 10px',background:'#ff4757',color:'#fff',border:'none',borderRadius:4,cursor:'pointer'}}>{Lang.get('plugins.uninstall')}</button></div>))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() { return <DlgProvider><AppContent /></DlgProvider>; }
