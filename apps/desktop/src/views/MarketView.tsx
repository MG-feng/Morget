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

  if (!isLoggedIn) return <div className="empty-state" style={{marginTop:'40px'}}><h2>{Lang.get('auth.guard.title')}</h2><p style={{marginTop:'10px'}}>{Lang.get('auth.guard.desc')}</p></div>;
  if (error) return <div className="empty-state" style={{marginTop:'40px', color:'var(--danger)', borderColor:'var(--danger)'}}>⚠️ {error === 'MARKET_NOT_CONFIGURED' ? Lang.get('market.not_configured') : error}</div>;

  return (
    <div>
      <div className="card" style={{padding:'12px 16px', background:'var(--accent-glow)', border:`1px solid ${Lang.get('app.name') === 'MORGET' ? 'rgba(0,168,255,0.3)' : 'var(--border-subtle)'}`, marginBottom:'24px', display:'flex', alignItems:'center', gap:'8px'}}>
        <span style={{color:'var(--accent)'}}>ℹ️</span>
        <span style={{color:'var(--accent)', fontSize:'13px'}}>{Lang.get('market.demo_notice')}</span>
      </div>

      <div className="panel-header"><h2>{Lang.get('nav.market')}</h2></div>
      {plugins.length === 0 ? <div className="empty-state">Market Empty or Network Disconnected.</div> : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'16px'}}>
          {plugins.map((p) => (
            <div key={p.id} className="card" style={{display:'flex', flexDirection:'column', alignItems:'flex-start'}}>
              <h3 style={{margin:0, fontSize:'16px', color:'var(--text-main)'}}>{p.name}</h3>
              <p style={{color:'var(--text-muted)', fontSize:'13px', margin:'8px 0'}}>{p.description}</p>
              <div style={{display:'flex', gap:'15px', fontSize:'12px', color:'var(--text-muted)', marginTop:'auto'}}>
                <span>👁 {p.views}</span><span>👍 {p.likes}</span><span>⬇️ {p.downloads}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
