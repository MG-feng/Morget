import React, { useState, useEffect, createContext, useContext } from 'react';
import { ipc } from './ipc/client';
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';

// === I18N ===
const dict: Record<string, Record<string, string>> = {
  'zh-TW': { 'app.name': 'MORGET', 'common.loading': '載入中...', 'common.confirm': '確認', 'common.cancel': '取消', 'nav.plugins': '插件管理', 'nav.settings': '系統設置', 'nav.market': '插件市場', 'nav.creator': '創作者中心', 'nav.wallet': 'G幣錢包', 'nav.logout': '登出', 'auth.subtitle': '登錄以同步資產', 'auth.login': 'WorkOS 登錄', 'plugins.title': '已安裝插件', 'plugins.count': '({count})', 'plugins.install': '安裝插件', 'plugins.uninstall': '卸載', 'plugins.uninstall.confirm': '確定卸載 {name}？', 'plugins.empty': '暫無插件', 'plugins.install.success': '安裝成功', 'market.search': '搜尋...', 'market.back': '返回', 'market.detail_view': '停留10秒得5G幣...', 'market.download_btn': '下載安裝', 'creator.auth_github': '連接 GitHub', 'creator.upload_title': '上傳插件', 'creator.select_repo': '選擇倉庫', 'creator.version': '版本號', 'creator.file_path': '文件路徑', 'creator.browse': '瀏覽', 'creator.upload_btn': '確認上傳', 'creator.missing_fields': '請填寫完整', 'wallet.balance': '當前餘額', 'wallet.history': '交易紀錄', 'settings.general.title': '基本', 'settings.general.language': '語言', 'settings.appearance.title': '外觀', 'settings.appearance.theme': '主題', 'settings.storage.title': '存儲', 'settings.storage.cache': '緩存', 'settings.storage.cache.clear': '清理', 'settings.storage.cache.cleared': '已清理 {size} MB', 'lang.zh-TW': '繁體', 'lang.zh-CN': '簡體', 'lang.en-US': 'English', 'theme.dark': '深色', 'theme.light': '淺色', 'theme.system': '系統' },
  'zh-CN': { 'app.name': 'MORGET', 'common.loading': '加载中...', 'common.confirm': '确认', 'common.cancel': '取消', 'nav.plugins': '插件管理', 'nav.settings': '系统设置', 'nav.market': '插件市场', 'nav.creator': '创作者中心', 'nav.wallet': 'G币钱包', 'nav.logout': '登出', 'auth.subtitle': '登录以同步资产', 'auth.login': 'WorkOS 登录', 'plugins.title': '已安装插件', 'plugins.count': '({count})', 'plugins.install': '安装插件', 'plugins.uninstall': '卸载', 'plugins.uninstall.confirm': '确定卸载 {name}？', 'plugins.empty': '暂无插件', 'plugins.install.success': '安装成功', 'market.search': '搜索...', 'market.back': '返回', 'market.detail_view': '停留10秒得5G币...', 'market.download_btn': '下载安装', 'creator.auth_github': '连接 GitHub', 'creator.upload_title': '上传插件', 'creator.select_repo': '选择仓库', 'creator.version': '版本号', 'creator.file_path': '文件路径', 'creator.browse': '浏览', 'creator.upload_btn': '确认上传', 'creator.missing_fields': '请填写完整', 'wallet.balance': '当前余额', 'wallet.history': '交易记录', 'settings.general.title': '基本', 'settings.general.language': '语言', 'settings.appearance.title': '外观', 'settings.appearance.theme': '主题', 'settings.storage.title': '存储', 'settings.storage.cache': '缓存', 'settings.storage.cache.clear': '清理', 'settings.storage.cache.cleared': '已清理 {size} MB', 'lang.zh-TW': '繁体', 'lang.zh-CN': '简体', 'lang.en-US': 'English', 'theme.dark': '深色', 'theme.light': '浅色', 'theme.system': '系统' },
  'en-US': { 'app.name': 'MORGET', 'common.loading': 'Loading...', 'common.confirm': 'OK', 'common.cancel': 'Cancel', 'nav.plugins': 'Plugins', 'nav.settings': 'Settings', 'nav.market': 'Market', 'nav.creator': 'Creator', 'nav.wallet': 'Wallet', 'nav.logout': 'Logout', 'auth.subtitle': 'Login to sync', 'auth.login': 'WorkOS Login', 'plugins.title': 'Installed', 'plugins.count': '({count})', 'plugins.install': 'Install', 'plugins.uninstall': 'Uninstall', 'plugins.uninstall.confirm': 'Uninstall {name}?', 'plugins.empty': 'No plugins', 'plugins.install.success': 'Installed', 'market.search': 'Search...', 'market.back': 'Back', 'market.detail_view': 'Stay 10s for 5G...', 'market.download_btn': 'Download', 'creator.auth_github': 'Connect GitHub', 'creator.upload_title': 'Upload', 'creator.select_repo': 'Select Repo', 'creator.version': 'Version', 'creator.file_path': 'File', 'creator.browse': 'Browse', 'creator.upload_btn': 'Upload', 'creator.missing_fields': 'Missing fields', 'wallet.balance': 'Balance', 'wallet.history': 'History', 'settings.general.title': 'General', 'settings.general.language': 'Language', 'settings.appearance.title': 'Appearance', 'settings.appearance.theme': 'Theme', 'settings.storage.title': 'Storage', 'settings.storage.cache': 'Cache', 'settings.storage.cache.clear': 'Clear', 'settings.storage.cache.cleared': 'Cleared {size} MB', 'lang.zh-TW': 'Traditional', 'lang.zh-CN': 'Simplified', 'lang.en-US': 'English', 'theme.dark': 'Dark', 'theme.light': 'Light', 'theme.system': 'System' }
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
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999}}>
          <div style={{background:'#222',padding:20,borderRadius:8,minWidth:300,color:'#fff'}}>
            <div style={{marginBottom:15}}>{st.msg}</div>
            <div style={{textAlign:'right'}}>
              {st.showCancel && <button onClick={st.onCancel} style={{marginRight:10, padding:'6px 12px', cursor:'pointer'}}>{Lang.get('common.cancel')}</button>}
              <button onClick={st.onConfirm} style={{padding:'6px 12px', background:'#00a8ff', color:'#fff', border:'none', borderRadius:4, cursor:'pointer'}}>{Lang.get('common.confirm')}</button>
            </div>
          </div>
        </div>
      )}
    </DlgCtx.Provider>
  );
}

// === Views ===
function MarketView() {
  const [plugins, setPlugins] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [timer, setTimer] = useState(0);
  useEffect(() => { ipc.market.search('').then(setPlugins).catch(console.error); }, []);
  useEffect(() => { let i: any; if (selected) i = setInterval(() => setTimer(t => t + 1), 1000); else setTimer(0); return () => clearInterval(i); }, [selected]);
  useEffect(() => { if (timer === 10 && selected) ipc.market.reportView(selected.id, 10).then((r: any) => { if (r.g_coins_earned > 0) window.alert(`🎉 +${r.g_coins_earned} G`); }); }, [timer, selected]);
  if (selected) return (
    <div style={{padding:20}}>
      <button onClick={() => setSelected(null)} style={{marginBottom:20, padding:'8px 16px', cursor:'pointer'}}>&larr; {Lang.get('market.back')}</button>
      <h1>{selected.name} <small style={{color:'#666'}}>by {selected.author}</small></h1>
      <p>{selected.description}</p>
      <div style={{margin:'20px 0', padding:15, background:'#f0f8ff', borderRadius:8, border:'1px solid #00a8ff'}}>{timer < 10 ? Lang.get('market.detail_view') + ` (${10 - timer}s)` : '✅ Reward Claimed!'}</div>
      {selected.versions.map((v: any) => (<div key={v.id} style={{display:'flex',justifyContent:'space-between',padding:10,borderBottom:'1px solid #eee'}}><span>v{v.version}</span><button onClick={async () => { const r = await ipc.market.download(selected.id, v.id); if(r.success) window.alert(`✅ +${r.g_coins_earned} G`); }} style={{background:'#28a745',color:'#fff',border:'none',padding:'5px 15px',borderRadius:4,cursor:'pointer'}}>{Lang.get('market.download_btn')}</button></div>))}
    </div>
  );
  return (
    <div style={{padding:20}}>
      <h2>{Lang.get('nav.market')}</h2>
      <input type="text" placeholder={Lang.get('market.search')} value={search} onChange={e => setSearch(e.target.value)} style={{width:'100%',padding:10,marginBottom:20,border:'1px solid #ddd',borderRadius:4}} />
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))',gap:20}}>
        {plugins.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map((p: any) => (
          <div key={p.id} onClick={() => setSelected(p)} style={{background:'#fff',border:'1px solid #ddd',borderRadius:8,padding:15,cursor:'pointer',boxShadow:'0 2px 4px rgba(0,0,0,0.05)'}}>
            <h3 style={{margin:0}}>{p.name}</h3><p style={{color:'#666',fontSize:14,margin:'10px 0'}}>{p.description}</p>
            <div style={{display:'flex',gap:15,fontSize:12,color:'#888'}}><span>👁 {p.views}</span><span>👍 {p.likes}</span><span>⬇️ {p.downloads}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreatorView() {
  const dlg = useDlg();
  const [isAuthed, setIsAuthed] = useState(false);
  const [repos, setRepos] = useState<any[]>([]);
  const [selRepo, setSelRepo] = useState('');
  const [ver, setVer] = useState('1.0.0');
  const [fp, setFp] = useState('');
  return (
    <div style={{padding:20, maxWidth:800, margin:'0 auto'}}>
      <h2>{Lang.get('nav.creator')}</h2>
      {!isAuthed ? <button onClick={async () => { const r = await ipc.github.auth(); if(r.success){ setIsAuthed(true); setRepos(await ipc.github.getRepos()); }}} style={{padding:'10px 20px', background:'#24292e', color:'#fff', border:'none', borderRadius:6, cursor:'pointer'}}>{Lang.get('creator.auth_github')}</button> : (
        <div style={{background:'#fff', padding:20, borderRadius:8, border:'1px solid #ddd'}}>
          <h3>{Lang.get('creator.upload_title')}</h3>
          <div style={{marginBottom:15}}><label>{Lang.get('creator.select_repo')}</label><select value={selRepo} onChange={e => setSelRepo(e.target.value)} style={{width:'100%', padding:8, marginTop:5}}><option value="">--</option>{repos.map((r: any) => <option key={r.name} value={r.name}>{r.full_name}</option>)}</select></div>
          <div style={{marginBottom:15}}><label>{Lang.get('creator.version')}</label><input type="text" value={ver} onChange={e => setVer(e.target.value)} style={{width:'100%', padding:8, marginTop:5}} /></div>
          <div style={{marginBottom:15}}><label>{Lang.get('creator.file_path')}</label><div style={{display:'flex', gap:10, marginTop:5}}><input type="text" value={fp} readOnly style={{flex:1, padding:8}} /><button onClick={async () => { const p = await ipc.settings.pickPluginFile(); if(p) setFp(p); }} style={{padding:'8px 15px', cursor:'pointer'}}>{Lang.get('creator.browse')}</button></div></div>
          <button onClick={async () => { if(!selRepo||!fp){ dlg.alert(Lang.get('creator.missing_fields')); return; } const r = await ipc.github.upload(selRepo, ver, fp); if(r.success) dlg.alert(r.message); }} style={{padding:'10px 20px', background:'#00a8ff', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', width:'100%'}}>{Lang.get('creator.upload_btn')}</button>
        </div>
      )}
    </div>
  );
}

function WalletView() {
  const [w, setW] = useState<any>(null);
  useEffect(() => { ipc.wallet.getInfo().then(setW); }, []);
  if (!w) return <div style={{textAlign:'center', marginTop:100}}>{Lang.get('common.loading')}</div>;
  return (
    <div style={{padding:20, maxWidth:800, margin:'0 auto'}}>
      <h2>{Lang.get('nav.wallet')}</h2>
      <div style={{background:'linear-gradient(135deg, #00a8ff, #0077cc)', color:'#fff', padding:30, borderRadius:12, marginBottom:20}}>
        <div style={{fontSize:14, opacity:0.8}}>{Lang.get('wallet.balance')}</div>
        <div style={{fontSize:48, fontWeight:'bold', margin:'10px 0'}}>{w.balance} <span style={{fontSize:20}}>G</span></div>
      </div>
      <h3>{Lang.get('wallet.history')}</h3>
      <div style={{background:'#fff', borderRadius:8, border:'1px solid #ddd'}}>
        {w.transactions.map((tx: any) => (<div key={tx.id} style={{padding:15, borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between'}}><div><div style={{fontWeight:500}}>{tx.reason}</div><div style={{fontSize:12, color:'#888'}}>{new Date(tx.created_at).toLocaleString()}</div></div><div style={{fontWeight:'bold', color: tx.amount > 0 ? '#28a745' : '#dc3545'}}>{tx.amount > 0 ? '+' : ''}{tx.amount} G</div></div>))}
      </div>
    </div>
  );
}

function SettingsView() {
  const [s, setS] = useState<any>(null);
  const [c, setC] = useState(0);
  useEffect(() => { ipc.settings.get().then(setS); ipc.settings.getCacheSize().then(setC); }, []);
  if (!s) return <div style={{padding:20}}>{Lang.get('common.loading')}</div>;
  const upd = async (k: string, v: any) => { const n = { ...s, [k]: v }; setS(n); await ipc.settings.set({ [k]: v }); };
  return (
    <div style={{padding:20, maxWidth:800, margin:'0 auto'}}>
      <h2>{Lang.get('nav.settings')}</h2>
      <div style={{background:'#fff', padding:20, borderRadius:8, border:'1px solid #ddd', marginBottom:20}}>
        <h3>{Lang.get('settings.general.title')}</h3>
        <label>{Lang.get('settings.general.language')}</label>
        <select value={s.language} onChange={e => { upd('language', e.target.value); Lang.set(e.target.value); }} style={{width:'100%', padding:8, marginTop:5}}>
          <option value="zh-TW">{Lang.get('lang.zh-TW')}</option><option value="zh-CN">{Lang.get('lang.zh-CN')}</option><option value="en-US">{Lang.get('lang.en-US')}</option>
        </select>
      </div>
      <div style={{background:'#fff', padding:20, borderRadius:8, border:'1px solid #ddd'}}>
        <h3>{Lang.get('settings.storage.title')}</h3>
        <label>{Lang.get('settings.storage.cache')} ({c.toFixed(2)} MB)</label><br/>
        <button onClick={async () => { const r = await ipc.settings.clearCache(); window.alert(Lang.get('settings.storage.cache.cleared', {size: r.freedMB.toFixed(2)})); setC(0); }} style={{padding:'8px 15px', marginTop:5, cursor:'pointer'}}>{Lang.get('settings.storage.cache.clear')}</button>
      </div>
    </div>
  );
}

// === Main App ===
const AUTH_ENABLED = false;
function AppContent() {
  const dlg = useDlg();
  const [view, setView] = useState<'market' | 'plugins' | 'creator' | 'wallet' | 'settings'>('market');
  const [plugins, setPlugins] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [authState, setAuthState] = useState<any>(AUTH_ENABLED ? null : { isLoggedIn: true });

  useEffect(() => { if (AUTH_ENABLED) { ipc.auth.getState().then(setAuthState); const u = onOpenUrl((urls) => { try { const url = new URL(urls[0]); if (url.protocol === 'morget:' && url.hostname === 'auth') { const c = url.searchParams.get('code'); const s = url.searchParams.get('state'); if (c && s) ipc.auth.callback(c, s).then(() => ipc.auth.getState().then(setAuthState)); } } catch (e) {} }); return () => { u.then(fn => fn()); }; } }, []);
  useEffect(() => { if (authState?.isLoggedIn) { ipc.plugin.list().then(setPlugins); ipc.settings.get().then(setSettings); } }, [authState]);
  useEffect(() => { if (settings) { Lang.set(settings.language); document.body.className = settings.theme === 'dark' ? 'dark' : 'light'; } }, [settings]);

  if (AUTH_ENABLED && !authState?.isLoggedIn) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',flexDirection:'column'}}><h1>{Lang.get('app.name')}</h1><button onClick={() => ipc.auth.login()} style={{padding:'10px 20px', background:'#00a8ff', color:'#fff', border:'none', borderRadius:6, cursor:'pointer'}}>{Lang.get('auth.login')}</button></div>;
  if (!settings) return <div style={{textAlign:'center',marginTop:100}}>{Lang.get('common.loading')}</div>;

  return (
    <div style={{display:'flex',height:'100vh',background:'#f5f5f5'}}>
      <aside style={{width:200,background:'#111',color:'#fff',padding:20, display:'flex', flexDirection:'column'}}>
        <h2>{Lang.get('app.name')}</h2>
        <button onClick={() => setView('market')} style={{display:'block',margin:'15px 0',background:view==='market'?'#333':'transparent',border:'none',color:'#fff',cursor:'pointer',fontSize:16,padding:'8px 12px',borderRadius:4,width:'100%',textAlign:'left'}}>{Lang.get('nav.market')}</button>
        <button onClick={() => setView('plugins')} style={{display:'block',margin:'15px 0',background:view==='plugins'?'#333':'transparent',border:'none',color:'#fff',cursor:'pointer',fontSize:16,padding:'8px 12px',borderRadius:4,width:'100%',textAlign:'left'}}>{Lang.get('nav.plugins')}</button>
        <button onClick={() => setView('creator')} style={{display:'block',margin:'15px 0',background:view==='creator'?'#333':'transparent',border:'none',color:'#fff',cursor:'pointer',fontSize:16,padding:'8px 12px',borderRadius:4,width:'100%',textAlign:'left'}}>{Lang.get('nav.creator')}</button>
        <button onClick={() => setView('wallet')} style={{display:'block',margin:'15px 0',background:view==='wallet'?'#333':'transparent',border:'none',color:'#fff',cursor:'pointer',fontSize:16,padding:'8px 12px',borderRadius:4,width:'100%',textAlign:'left'}}>{Lang.get('nav.wallet')}</button>
        <button onClick={() => setView('settings')} style={{display:'block',margin:'15px 0',background:view==='settings'?'#333':'transparent',border:'none',color:'#fff',cursor:'pointer',fontSize:16,padding:'8px 12px',borderRadius:4,width:'100%',textAlign:'left'}}>{Lang.get('nav.settings')}</button>
        <div style={{flex:1}}></div>
        {AUTH_ENABLED && <button onClick={() => { ipc.auth.logout(); setAuthState({isLoggedIn:false}); }} style={{display:'block',margin:'15px 0',background:'transparent',border:'none',color:'red',cursor:'pointer',fontSize:16,padding:'8px 12px',borderRadius:4,width:'100%',textAlign:'left'}}>{Lang.get('nav.logout')}</button>}
      </aside>
      <main style={{flex:1,overflow:'auto'}}>
        {view === 'market' && <MarketView />}
        {view === 'creator' && <CreatorView />}
        {view === 'wallet' && <WalletView />}
        {view === 'settings' && <SettingsView />}
        {view === 'plugins' && (
          <div style={{padding:20}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:20}}><h2>{Lang.get('plugins.title')} ({plugins.length})</h2><button onClick={async () => { const r = await ipc.plugin.installViaDialog(); if(r.success){ dlg.alert(Lang.get('plugins.install.success')); ipc.plugin.list().then(setPlugins); } }} style={{padding:'8px 16px',background:'#00a8ff',color:'#fff',border:'none',borderRadius:4,cursor:'pointer'}}>{Lang.get('plugins.install')}</button></div>
            {plugins.length === 0 && <p style={{color:'#666'}}>{Lang.get('plugins.empty')}</p>}
            {plugins.map((p: any) => (<div key={p.id} style={{background:'#fff',border:'1px solid #ddd',padding:15,marginBottom:10,display:'flex',justifyContent:'space-between',borderRadius:8}}><div><strong>{p.name}</strong> <span style={{color:'#666'}}>v{p.version}</span></div><button onClick={async () => { if(await dlg.confirm(Lang.get('plugins.uninstall.confirm', {name: p.name}))) { await ipc.plugin.uninstall(p.id); ipc.plugin.list().then(setPlugins); } }} style={{padding:'5px 10px',background:'#ff4757',color:'#fff',border:'none',borderRadius:4,cursor:'pointer'}}>{Lang.get('plugins.uninstall')}</button></div>))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() { return <DlgProvider><AppContent /></DlgProvider>; }
