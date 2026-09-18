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
    ipc.market.search('').then(setPlugins).catch(e => {
      const msg = typeof e === 'string' ? e : (e instanceof Error ? e.message : 'Unknown Error');
      setError(msg);
    });
  }, [isLoggedIn]);

  if (!isLoggedIn) return <div className="empty-state" style={{marginTop:40}}><h2>{Lang.get('auth.guard.title')}</h2><p style={{marginTop:10}}>{Lang.get('auth.guard.desc')}</p></div>;
  if (error) return <div className="empty-state" style={{marginTop:40, color:'#ef4444', border:'1px solid #ef4444'}}>⚠️ {error === 'MARKET_NOT_CONFIGURED' ? Lang.get('market.not_configured') : error}</div>;

  return (
    <div>
      <div style={{padding:'10px 16px', background:'rgba(14,165,233,0.08)', border:'1px solid rgba(14,165,233,0.2)', borderRadius:6, marginBottom:20, fontSize:13, color:'#0ea5e9', display:'flex', alignItems:'center', gap:8}}>
        <span>ℹ️</span>
        <span>{Lang.get('market.demo_notice')}</span>
      </div>

      <div className="panel-header"><h2>{Lang.get('nav.market')}</h2></div>
      {plugins.length === 0 ? <div className="empty-state">Market Empty or Network Disconnected.</div> : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:16}}>
          {plugins.map((p) => (<div key={p.id} className="market-card" style={{flexDirection:'column', alignItems:'flex-start'}}><h3 style={{margin:0, fontSize:16}}>{p.name}</h3><p style={{color:'#a3a3a3', fontSize:13, margin:'8px 0'}}>{p.description}</p><div style={{display:'flex', gap:15, fontSize:12, color:'#737373'}}><span>👁 {p.views}</span><span>👍 {p.likes}</span><span>⬇️ {p.downloads}</span></div></div>))}
        </div>
      )}
    </div>
  );
}
