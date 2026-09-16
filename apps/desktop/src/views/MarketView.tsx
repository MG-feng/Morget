import React, { useState, useEffect } from 'react';
import { ipc } from '../ipc/client';
import { useLang } from '../i18n/Lang';
import type { MarketPlugin } from '@morget/ipc-contract';

export default function MarketView() {
  const Lang = useLang();
  const [plugins, setPlugins] = useState<MarketPlugin[]>([]);
  const [selected, setSelected] = useState<MarketPlugin | null>(null);
  const [search, setSearch] = useState('');
  const [timer, setTimer] = useState(0);

  useEffect(() => { ipc.market.search('').then(setPlugins).catch(console.error); }, []);

  useEffect(() => {
    let interval: any;
    if (selected) interval = setInterval(() => setTimer(t => t + 1), 1000);
    else setTimer(0);
    return () => clearInterval(interval);
  }, [selected]);

  useEffect(() => {
    if (timer === 10 && selected) {
      ipc.market.reportView(selected.id, 10).then((res: any) => {
        if (res.g_coins_earned && res.g_coins_earned > 0) window.alert(`🎉 獲得 ${res.g_coins_earned} G 幣！`);
      });
    }
  }, [timer, selected]);

  const handleDownload = async (p: MarketPlugin, v: any) => {
    const res: any = await ipc.market.download(p.id, v.id);
    if (res.success) window.alert(`✅ 下載成功！獲得 ${res.g_coins_earned} G 幣。\n(本地 Mock 模式)`);
  };

  if (selected) {
    return (
      <div style={{padding:20}}>
        <button onClick={() => setSelected(null)} style={{marginBottom:20, background:'transparent', border:'1px solid #ddd', padding:'8px 16px', borderRadius:4, cursor:'pointer'}}>&larr; {Lang.get('market.back')}</button>
        <h1>{selected.name} <small style={{color:'#666'}}>by {selected.author}</small></h1>
        <p>{selected.description}</p>
        <div style={{margin:'20px 0', padding:15, background:'#f0f8ff', borderRadius:8, border:'1px solid #00a8ff'}}>
          {timer < 10 ? Lang.get('market.detail_view') + ` (${10 - timer}s)` : '✅ 瀏覽獎勵已發放！'}
        </div>
        <h3>Versions</h3>
        {selected.versions.map((v: any) => (
          <div key={v.id} style={{display:'flex',justifyContent:'space-between',padding:10,borderBottom:'1px solid #eee'}}>
            <span>v{v.version}</span>
            <button onClick={() => handleDownload(selected, v)} style={{background:'#28a745',color:'#fff',border:'none',padding:'5px 15px',borderRadius:4,cursor:'pointer'}}>{Lang.get('market.download_btn')}</button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{padding:20}}>
      <h2>{Lang.get('nav.market')}</h2>
      <input type="text" placeholder={Lang.get('market.search')} value={search} onChange={e => setSearch(e.target.value)} style={{width:'100%',padding:10,marginBottom:20,border:'1px solid #ddd',borderRadius:4}} />
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))',gap:20}}>
        {plugins.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map((p: any) => (
          <div key={p.id} onClick={() => setSelected(p)} style={{background:'#fff',border:'1px solid #ddd',borderRadius:8,padding:15,cursor:'pointer',transition:'transform 0.2s',boxShadow:'0 2px 4px rgba(0,0,0,0.05)'}} onMouseOver={e => (e.currentTarget.style.transform='translateY(-2px)')} onMouseOut={e => (e.currentTarget.style.transform='none')}>
            <h3 style={{margin:0}}>{p.name}</h3>
            <p style={{color:'#666',fontSize:14,margin:'10px 0'}}>{p.description}</p>
            <div style={{display:'flex',gap:15,fontSize:12,color:'#888'}}>
              <span>👁 {p.views}</span><span>👍 {p.likes}</span><span>⬇️ {p.downloads}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
