import React, { useState, useEffect } from 'react';
import { ipc } from '../ipc/client.ts';

// ✅ 自定義彈窗 (替代原生 alert/confirm)
function Modal({ title, message, onConfirm, onCancel, danger }: any) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 28, minWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <h3 style={{ fontSize: 18, marginBottom: 12, color: danger ? 'var(--danger)' : 'var(--text-primary)' }}>{title}</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-outline" onClick={onCancel}>取消</button>
          <button className={danger ? 'btn btn-danger' : 'btn btn-primary'} onClick={onConfirm}>確認</button>
        </div>
      </div>
    </div>
  );
}

// ✅ 快捷鍵錄製器
function HotkeyRecorder({ value, onChange }: any) {
  const [recording, setRecording] = useState(false);
  const [tempKeys, setTempKeys] = useState<string[]>([]);
  useEffect(() => {
    if (!recording) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      const keys: string[] = [];
      if (e.ctrlKey) keys.push('Ctrl'); if (e.shiftKey) keys.push('Shift'); if (e.altKey) keys.push('Alt');
      if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) keys.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);
      if (e.key === 'Escape') { setRecording(false); return; }
      setTempKeys(keys);
    };
    const upHandler = (e: KeyboardEvent) => {
      if (tempKeys.length > 0 && !e.ctrlKey && !e.shiftKey && !e.altKey) { onChange(tempKeys.join('+')); setRecording(false); setTempKeys([]); }
    };
    window.addEventListener('keydown', handler, true); window.addEventListener('keyup', upHandler, true);
    return () => { window.removeEventListener('keydown', handler, true); window.removeEventListener('keyup', upHandler, true); };
  }, [recording, tempKeys, onChange]);
  return (
    <button onClick={() => { setRecording(true); setTempKeys([]); }} style={{ padding: '6px 14px', borderRadius: 4, cursor: 'pointer', fontSize: 13, background: recording ? 'var(--accent)' : 'var(--bg-input)', color: recording ? '#fff' : 'var(--text-primary)', border: recording ? '1px solid var(--accent)' : '1px solid var(--border)', minWidth: 120, textAlign: 'center' }}>
      {recording ? (tempKeys.length > 0 ? tempKeys.join(' + ') : '按下按鍵...') : (value || '未設置')}
    </button>
  );
}

// ✅ 1秒延遲 Tooltip
const Tip = ({ label, desc }: any) => (<span className="tip">{label}<span className="tip-icon">?</span><span className="tip-text">{desc}</span></span>);

// ✅ 滑塊 + 輸入框組合
const SliderInput = ({ min, max, step, value, onChange, unit, disabled }: any) => (
  <div className="slider-input-group">
    <input type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={e => onChange(parseFloat(e.target.value))} />
    <input type="number" min={min} max={max} step={step} value={value} disabled={disabled} onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(v); }} />
    {unit && <span className="slider-unit">{unit}</span>}
  </div>
);

export default function SettingsView() {
  const [s, setS] = useState<any>(null);
  const [cacheSize, setCacheSize] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try { setS(await ipc.settings.get()); } catch { setS({ language: 'zh-TW', theme: 'dark', scale: 1.0, fontSize: 14, fpsLimit: 60 }); }
    try { setCacheSize(await ipc.settings.getCacheSize()); } catch { setCacheSize(0); }
    try { setIsAdmin(await ipc.settings.checkAdmin()); } catch { setIsAdmin(false); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // ✅ 核心：誠實報錯機制。若後端未實現該 IPC，會自動回滾 UI 並彈出提示
  const up = async (key: string, value: any, action?: () => Promise<any>) => {
    if (!s) return;
    const prev = s[key];
    setS({ ...s, [key]: value });
    try {
      if (action) await action();
      else await ipc.settings.set({ [key]: value });
    } catch (e: any) {
      setS({ ...s, [key]: prev }); // 誠實回滾
      setModal({
        title: '⚠️ 功能尚未開放',
        message: `該功能將在後續版本開放 (NotImplemented)。\n\n底層錯誤: ${e?.message || e}`,
        onConfirm: () => {}
      });
    }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-secondary)', fontSize: 16, letterSpacing: 3 }}>=== 載入中 ===</div>;
  if (!s) return null;

  return (
    <div>
      <div className="panel-header"><h2>系統設置</h2></div>
      {modal && <Modal {...modal} onConfirm={() => { modal.onConfirm(); setModal(null); }} onCancel={() => setModal(null)} />}

      <div className="settings-section-title">常規</div>
      <div className="settings-group">
        <div className="setting-row"><div className="setting-label"><span>語言 (Language)</span></div><div className="setting-control"><select value={s.language} onChange={e => up('language', e.target.value)}><option value="zh-TW">繁體中文</option><option value="zh-CN">簡體中文</option><option value="en-US">English</option></select></div></div>
        <div className="setting-row"><div className="setting-label"><span><Tip label="應用自動更新" desc="當 Morget 發布新版本時的處理方式。" /></span></div><div className="setting-control"><select value={s.appAutoUpdate || 'notify'} onChange={e => up('appAutoUpdate', e.target.value)}><option value="notify">通知我</option><option value="auto">自動更新</option><option value="off">關閉</option></select></div></div>
        <div className="setting-row"><div className="setting-label"><span>應用更新渠道</span></div><div className="setting-control"><select value={s.appUpdateChannel || 'stable'} onChange={e => up('appUpdateChannel', e.target.value)}><option value="all">全部版本</option><option value="beta_rc">僅 Beta/RC/Stable</option><option value="stable">僅 Stable</option></select></div></div>
      </div>

      <div className="settings-section-title">行為</div>
      <div className="settings-group">
        <div className="setting-row"><div className="setting-label"><span><Tip label="開機自啟動" desc="隨 Windows 啟動自動運行。" /></span></div><div className="setting-control"><label className="toggle"><input type="checkbox" checked={!!s.autoStart} onChange={e => up('autoStart', e.target.checked, () => ipc.settings.setAutoStart(e.target.checked))} /><span className="slider"></span></label></div></div>
        <div className="setting-row"><div className="setting-label"><span>關閉行為</span></div><div className="setting-control"><select value={s.closeBehavior || 'exit'} onChange={e => up('closeBehavior', e.target.value, () => ipc.settings.setCloseBehavior(e.target.value))}><option value="exit">直接退出</option><option value="minimize">最小化到托盤</option></select></div></div>
      </div>

      <div className="settings-section-title">通知</div>
      <div className="settings-group">
        <div className="setting-row"><div className="setting-label"><span>系統托盤圖標</span></div><div className="setting-control"><label className="toggle"><input type="checkbox" checked={!!s.showTrayIcon} onChange={e => up('showTrayIcon', e.target.checked, () => ipc.settings.setTrayIcon(e.target.checked))} /><span className="slider"></span></label></div></div>
        <div className="setting-row"><div className="setting-label"><span>桌面通知</span></div><div className="setting-control"><label className="toggle"><input type="checkbox" checked={!!s.desktopNotifications} onChange={e => up('desktopNotifications', e.target.checked)} /><span className="slider"></span></label><button className="btn btn-outline" style={{padding:'4px 10px',fontSize:12}} onClick={() => up('test', 1, ipc.settings.testNotification)}>測試</button></div></div>
        <div className="setting-row"><div className="setting-label"><span>聲音通知</span></div><div className="setting-control"><label className="toggle"><input type="checkbox" checked={!!s.soundNotifications} onChange={e => up('soundNotifications', e.target.checked)} /><span className="slider"></span></label><button className="btn btn-outline" style={{padding:'4px 10px',fontSize:12}} onClick={() => up('test', 1, ipc.settings.testSound)}>測試</button></div></div>
      </div>

      <div className="settings-section-title">外觀</div>
      <div className="settings-group">
        <div className="setting-row"><div className="setting-label"><span>主題模式</span></div><div className="setting-control"><select value={s.theme} onChange={e => up('theme', e.target.value)}><option value="dark">深色</option><option value="light">淺色</option><option value="system">跟隨系統</option></select></div></div>
        <div className="setting-row"><div className="setting-label"><span>界面縮放</span></div><div className="setting-control"><SliderInput min={80} max={150} step={5} value={Math.round((s.scale || 1) * 100)} unit="%" onChange={v => up('scale', v / 100)} /></div></div>
        <div className="setting-row"><div className="setting-label"><span>字體大小</span></div><div className="setting-control"><SliderInput min={10} max={24} step={1} value={s.fontSize || 14} unit="px" onChange={v => up('fontSize', v)} /></div></div>
        <div className="setting-row"><div className="setting-label"><span><Tip label="FPS 限制" desc="0 為無限制。開啟 VSync 時禁用。" /></span></div><div className="setting-control"><SliderInput min={0} max={300} step={5} value={s.fpsLimit ?? 60} unit="fps" disabled={!!s.vsync} onChange={v => up('fpsLimit', v)} /></div></div>
        <div className="setting-row"><div className="setting-label"><span>垂直同步</span></div><div className="setting-control"><label className="toggle"><input type="checkbox" checked={!!s.vsync} onChange={e => up('vsync', e.target.checked)} /><span className="slider"></span></label></div></div>
        <div className="setting-row"><div className="setting-label"><span>精美界面與動畫</span></div><div className="setting-control"><label className="toggle"><input type="checkbox" checked={!!s.premiumUI} onChange={e => up('premiumUI', e.target.checked)} /><span className="slider"></span></label></div></div>
      </div>

      <div className="settings-section-title">視窗</div>
      <div className="settings-group">
        <div className="setting-row"><div className="setting-label"><span>視窗模式</span></div><div className="setting-control"><select value={s.windowMode || 'window'} onChange={e => up('windowMode', e.target.value, () => ipc.settings.setWindowMode(e.target.value))}><option value="window">窗口</option><option value="fullscreen">全屏</option></select></div></div>
        <div className="setting-row"><div className="setting-label"><span>全屏快捷鍵</span></div><div className="setting-control"><HotkeyRecorder value={s.hotkeyFullscreen || 'F11'} onChange={v => up('hotkeyFullscreen', v)} /></div></div>
      </div>

      <div className="settings-section-title">高級與性能</div>
      <div className="settings-group">
        <div className="setting-row"><div className="setting-label"><span>管理員模式</span><small>{isAdmin ? '✅ 已獲取' : '❌ 未獲取'}</small></div><div className="setting-control"><label className="toggle"><input type="checkbox" checked={!!s.adminMode} disabled={!isAdmin} onChange={e => up('adminMode', e.target.checked)} /><span className="slider"></span></label></div></div>
      </div>
      <div style={{ opacity: s.adminMode && isAdmin ? 1 : 0.35, pointerEvents: s.adminMode && isAdmin ? 'auto' : 'none' }}>
        <div className="settings-group">
          <div className="setting-row"><div className="setting-label"><span>代理設置</span></div><div className="setting-control"><select value={s.proxyMode || 'system'} onChange={e => up('proxyMode', e.target.value)}><option value="system">跟隨系統</option><option value="direct">直連</option><option value="custom">自定義</option></select></div></div>
          {s.proxyMode === 'custom' && <div className="setting-row"><div className="setting-label"><span>代理地址</span></div><div className="setting-control"><input type="text" value={s.proxyUrl || ''} onChange={e => up('proxyUrl', e.target.value)} /></div></div>}
          <div className="setting-row"><div className="setting-label"><span>請求超時</span></div><div className="setting-control"><SliderInput min={5} max={120} step={5} value={s.networkTimeout ?? 30} unit="秒" onChange={v => up('networkTimeout', v)} /></div></div>
          <div className="setting-row"><div className="setting-label"><span>渲染硬件</span></div><div className="setting-control"><select value={s.hardwareRender || 'gpu'} onChange={e => up('hardwareRender', e.target.value)}><option value="gpu">GPU</option><option value="cpu">CPU</option></select></div></div>
          <div className="setting-row"><div className="setting-label"><span>自適應 FPS</span></div><div className="setting-control"><label className="toggle"><input type="checkbox" checked={s.adaptiveFps !== false} onChange={e => up('adaptiveFps', e.target.checked)} /><span className="slider"></span></label></div></div>
        </div>
      </div>

      <div className="settings-section-title">數據與存儲</div>
      <div className="settings-group">
        <div className="setting-row"><div className="setting-label"><span>下載路徑</span><small className="path-display">{s.downloadPath || '未設置'}</small></div><div className="setting-control"><button className="btn btn-outline" onClick={async () => { const dir = await ipc.settings.selectDirectory(); if (dir) up('downloadPath', dir); }}>更改</button></div></div>
        <div className="setting-row"><div className="setting-label"><span>緩存</span><small>{cacheSize.toFixed(2)} MB</small></div><div className="setting-control"><button className="btn btn-danger" onClick={() => setModal({ title: '清理緩存', message: `確定清理 ${cacheSize.toFixed(2)} MB？`, onConfirm: async () => { const r = await ipc.settings.clearCache(); setCacheSize(0); setModal({title:'成功', message:`已清理 ${r.freedMB.toFixed(2)} MB`, onConfirm:()=>{}}); } })}>清理</button></div></div>
        <div className="setting-row"><div className="setting-label"><span>重置設置</span></div><div className="setting-control"><button className="btn btn-danger" onClick={() => setModal({ title: '重置設置', message: '確定恢復默認設置？', danger: true, onConfirm: async () => { await ipc.settings.resetAll(); load(); } })}>重置</button></div></div>
        <div className="setting-row"><div className="setting-label"><span style={{color:'var(--danger)',fontWeight:600}}>恢復出廠設置</span></div><div className="setting-control"><button className="btn btn-danger" onClick={() => setModal({ title: '⚠️ 恢復出廠', message: '清空所有數據，不可逆！', danger: true, onConfirm: async () => { await ipc.settings.factoryReset(); window.location.reload(); } })}>恢復</button></div></div>
      </div>
    </div>
  );
}
