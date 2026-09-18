import React, { useState } from 'react';
import { ipc } from '../ipc/client';
import { useLang } from '../i18n/Lang';

export default function LoginView() {
  const Lang = useLang();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try { 
      // 喚起系統瀏覽器進行 WorkOS OAuth。
      // 注意：此處不重置 loading，因為組件會保持掛起狀態等待 Deep Link 回調。
      // 當 Deep Link 回調成功修改 authState 後，App.tsx 會直接卸載此 LoginView，因此保持轉圈是防止重複點擊的正確 UX。
      await ipc.auth.login(); 
    } catch (e) { 
      console.error(e); 
      setLoading(false); // 僅在喚起瀏覽器失敗時重置
    }
  };

  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',flexDirection:'column', background: 'var(--bg-app)', color: 'var(--text-primary)'}}>
      <h1 style={{fontSize: 48, marginBottom: 10, letterSpacing: 4, color: 'var(--accent-blue)', fontWeight: 800}}>{Lang.get('app.name')}</h1>
      <p style={{color: 'var(--text-secondary)', marginBottom: 30}}>{Lang.get('auth.subtitle')}</p>
      <button onClick={handleLogin} disabled={loading} style={{padding: '12px 24px', fontSize: 16, background: 'var(--accent-blue)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', width: 250, fontWeight: 'bold'}}>
        {loading ? Lang.get('common.loading') : Lang.get('auth.login')}
      </button>
    </div>
  );
}
