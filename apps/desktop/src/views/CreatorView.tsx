// CreatorView.tsx
import React from 'react';
import { useLang } from '../i18n/Lang';
export default function CreatorView({ isLoggedIn }: { isLoggedIn: boolean }) {
  const Lang = useLang();
  if (!isLoggedIn) return <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', color:'#888'}}><h2>🔒 需要登錄</h2><p>請先登錄以使用創作者中心發布插件。</p></div>;
  return <div className="panel" style={{padding:20}}><h2>{Lang.get('nav.creator')}</h2><p style={{color:'#ff4757'}}>⚠️ GitHub OAuth 尚未接入，請等待 Phase 5 更新。</p></div>;
}
