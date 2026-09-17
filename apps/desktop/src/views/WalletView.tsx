// WalletView.tsx
import React from 'react';
import { useLang } from '../i18n/Lang';
export default function WalletView({ isLoggedIn }: { isLoggedIn: boolean }) {
  const Lang = useLang();
  if (!isLoggedIn) return <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', color:'#888'}}><h2>🔒 需要登錄</h2><p>請先登錄以查看您的 G 幣錢包。</p></div>;
  return <div className="panel" style={{padding:20}}><h2>{Lang.get('nav.wallet')}</h2><p style={{color:'#ff4757'}}>⚠️ 錢包系統尚未接入真實數據庫。</p></div>;
}
