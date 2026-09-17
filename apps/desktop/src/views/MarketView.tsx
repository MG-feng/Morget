import React, { useState, useEffect } from 'react';
import { ipc } from '../ipc/client';
import { useLang } from '../i18n/Lang';
import type { MarketPlugin } from '@morget/ipc-contract';

export default function MarketView({ isLoggedIn }: { isLoggedIn: boolean }) {
  const Lang = useLang();
  const [plugins, setPlugins] = useState<MarketPlugin[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoggedIn) return;
    ipc.market.search('').then(setPlugins).catch(e => setError(e));
  }, [isLoggedIn]);

  if (!isLoggedIn) return <AuthGuard />;
  if (error) return <div style={{padding:40, textAlign:'center', color:'#ff4757'}}>⚠️ {error === 'MARKET_NOT_CONFIGURED' ? 'Market API 未配置，請聯繫管理員。' : error}</div>;

  return (
    <div className="panel" style={{padding:20}}>
      <h2>{Lang.get('nav.market')}</h2>
      {plugins.length === 0 ? (
        <div style={{textAlign:'center', padding:60, color:'#888'}}>市場暫無數據，或網絡未連接。</div>
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:20}}>
          {plugins.map(p => (
            <div key={p.id} className="plugin-card">
              <h3>{p.name}</h3><p>{p.description}</p>
              <div style={{fontSize:12, color:'#888'}}>👁 {p.views} | 👍 {p.likes} | ⬇️ {p.downloads}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AuthGuard() {
  return (
    <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', color:'#888'}}>
      <h2>🔒 需要登錄</h2>
      <p>請先登錄您的帳號以訪問插件市場與 G 幣系統。</p>
    </div>
  );
}
