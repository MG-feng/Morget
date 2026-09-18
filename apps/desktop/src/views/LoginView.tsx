import React, { useState } from 'react';
import { ipc } from '../ipc/client';
import { useLang } from '../i18n/Lang';

export default function LoginView() {
  const Lang = useLang();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try { await ipc.auth.login(); } catch (e) { console.error(e); setLoading(false); }
  };

  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',flexDirection:'column', background: '#121212', color: '#fff'}}>
      <h1 style={{fontSize: 48, marginBottom: 10, letterSpacing: 4, color: '#0ea5e9', fontWeight: 800}}>{Lang.get('app.name')}</h1>
      <p style={{color: '#a3a3a3', marginBottom: 30}}>{Lang.get('auth.subtitle')}</p>
      <button onClick={handleLogin} disabled={loading} style={{padding: '12px 24px', fontSize: 16, background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', width: 250, fontWeight: 'bold'}}>
        {loading ? Lang.get('common.loading') : Lang.get('auth.login')}
      </button>
    </div>
  );
}
