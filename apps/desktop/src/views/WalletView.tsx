import React, { useState, useEffect } from 'react';
import { ipc } from '../ipc/client';
import { useLang } from '../i18n/Lang';
import type { WalletInfo } from '@morget/ipc-contract';

export default function WalletView() {
  const Lang = useLang();
  const [wallet, setWallet] = useState<WalletInfo | null>(null);

  useEffect(() => { ipc.wallet.getInfo().then(setWallet); }, []);

  if (!wallet) return <div style={{textAlign:'center', marginTop:100}}>{Lang.get('common.loading')}</div>;

  return (
    <div style={{padding:20, maxWidth:800, margin:'0 auto'}}>
      <h2>{Lang.get('nav.wallet')}</h2>
      <div style={{background:'linear-gradient(135deg, #00a8ff, #0077cc)', color:'#fff', padding:30, borderRadius:12, marginBottom:20, boxShadow:'0 4px 12px rgba(0,168,255,0.3)'}}>
        <div style={{fontSize:14, opacity:0.8}}>{Lang.get('wallet.balance')}</div>
        <div style={{fontSize:48, fontWeight:'bold', margin:'10px 0'}}>{wallet.balance} <span style={{fontSize:20}}>G</span></div>
      </div>
      <h3>{Lang.get('wallet.history')}</h3>
      <div style={{background:'#fff', borderRadius:8, border:'1px solid #ddd'}}>
        {wallet.transactions.map(tx => (
          <div key={tx.id} style={{padding:15, borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between'}}>
            <div>
              <div style={{fontWeight:500}}>{tx.reason}</div>
              <div style={{fontSize:12, color:'#888'}}>{new Date(tx.created_at).toLocaleString()}</div>
            </div>
            <div style={{fontWeight:'bold', color: tx.amount > 0 ? '#28a745' : '#dc3545'}}>
              {tx.amount > 0 ? '+' : ''}{tx.amount} G
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
