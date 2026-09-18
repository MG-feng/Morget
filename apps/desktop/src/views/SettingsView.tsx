import React, { useState, useEffect, useCallback } from 'react';
import { ipc } from '../ipc/client';

// 自定義彈窗（不是 Windows 原生）
function Modal({ title, message, onConfirm, onCancel, danger }: {
  title: string; message: string; onConfirm: () => void; onCancel: () => void; danger?: boolean;
}) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 28, minWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <h3 style={{ fontSize: 18, marginBottom: 12, color: danger ? 'var(--danger)' : 'var(--text-primary)' }}>{title}</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-outline" onClick={onCancel}>取消</button>
          <button className={danger ? 'btn btn-danger' : 'btn btn-primary'} onClick={onConfirm}>確認</button>
        </div>
      </div>
    </div>
  );
}

// 快捷鍵錄製器
function HotkeyRecorder({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [recording, setRecording] = useState(false);
  const [tempKeys, setTempKeys] = useState<string[]>([]);

  useEffect(() => {
    if (!recording) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const keys: string[] = [];
      if (e.ctrlKey) keys.push('Ctrl');
      if (e.shiftKey) keys.push('Shift');
      if (e.altKey) keys.push('Alt');
      if (e.key !== 'Control' && e.key !== 'Shift' && e.key !== 'Alt' && e.key !== 'Meta') {
        keys.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);
      }
      if (e.key === 'Escape') { setRecording(false); setTempKeys([]); return; }
      setTempKeys(keys);
    };
    const upHandler = (e: KeyboardEvent) => {
      if (tempKeys.length > 0 && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        onChange(tempKeys.join('+'));
        setRecording(false);
        setTempKeys([]);
      }
    };
    window.addEventListener('keydown', handler, true);
    window.addEventListener('keyup', upHandler, true);
    return () => { window.removeEventListener('keydown', handler, true); window.removeEventListener('keyup', upHandler, true); };
  }, [recording, tempKeys, onChange]);

  return (
    <button
      onClick={() => { setRecording(true); setTempKeys([]); }}
      style={{
        padding: '6px 14px', borderRadius: 4, cursor: 'pointer', fontSize: 13,
        background: recording ? 'var(--accent)' : 'var(--bg-input)',
        color: recording ? '#fff' : 'var(--text-primary)',
        border: recording ? '1px solid var(--accent)' : '1px solid var(--border)',
        minWidth: 120, textAlign: 'center',
      }}
    >
      {recording ? (tempKeys.length > 0 ? tempKeys.join(' + ') : '按下按鍵...') : (value || '未設置')}
    </button>
  );
}

// Tooltip
const Tip = ({ label, desc }: { label: string; desc: string }) => (
  <span className="tip">
    {label}
    <span className="tip-icon">?</span>
    <span className="tip-text">{desc}</span>
  </span>
);

// 滑塊+輸入框
const SliderInput = ({ min, max, step, value, onChange, unit, disabled }: {
  min: number; max: number; step: number; value: number;
  onChange: (v: number) => void; unit?: string; disabled?: boolean;
}) => (
  <div className="slider-input-group">
    <input type="range" min={min} max={max} step={step} value={value} disabled={disabled}
      onChange={e => onChange(parseFloat(e.target.value))} />
    <input type="number" min={min} max={max} step={step} value={value} disabled={disabled}
      onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(v); }} />
    {unit && <span className="slider-unit">{unit}</span>}
  </div>
);

export default function SettingsView() {
  const [s, setS] = useState<any>(null);
  const [cacheSize, setCacheSize] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ title: string; message: string; onConfirm: () => void; danger?: boolean } | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const settings = await ipc.settings.get();
      setS(settings);
    } catch (e: any) { setError(`設置加載失敗: ${e?.message || e}`); setLoading(false); return; }
    try { setCacheSize(await ipc.settings.getCacheSize()); } catch { setCacheSize(0); }
    try { setIsAdmin(await ipc.settings.checkAdmin()); } catch { setIsAdmin(false); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const up = async (key: string, value: any) => {
    if (!s) return;
    setS({ ...s, [key]: value });
    try { await ipc.settings.set({ [key]: value }); } catch (e) { console.error('保存失敗:', e); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-secondary)', fontSize: 16, letterSpacing: 3 }}>
      === 載入中 ===
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ color: 'var(--danger)', fontSize: 14 }}>{error}</div>
      <button className="btn btn-outline" onClick={load}>重試</button>
    </div>
  );

  if (!s) return null;

  return (
    <div>
      <div className="panel-header"><h2>系統設置</h2></div>

      {modal && <Modal title={modal.title} message={modal.message} danger={modal.danger}
        onConfirm={() => { modal.onConfirm(); setModal(null); }}
        onCancel={() => setModal(null)} />}

      {/* ===== 常規 ===== */}
      <div className="settings-section-title">常規</div>
      <div className="settings-group">
        <div className="setting-row">
          <div className="setting-label"><span>語言 (Language)</span><small>即時生效</small></div>
          <div className="setting-control">
            <select value={s.language} onChange={e => up('language', e.target.value)}>
              <option value="zh-TW">繁體中文</option>
              <option value="zh-CN">簡體中文</option>
              <option value="en-US">English</option>
            </select>
          </div>
        </div>
        <div className="setting-row">
          <div className="setting-label">
            <span><Tip label="應用自動更新" desc="當 Morget 發布新版本時的處理方式。選擇「通知我」會彈出桌面通知提醒您。" /></span>
          </div>
          <div className="setting-control">
            <select value={s.appAutoUpdate} onChange={e => up('appAutoUpdate', e.target.value)}>
              <option value="notify">通知我</option>
              <option value="auto">自動更新</option>
              <option value="off">關閉</option>
            </select>
          </div>
        </div>
        <div className="setting-row">
          <div className="setting-label">
            <span><Tip label="應用更新渠道" desc="選擇接收哪個版本的更新通知或自動更新。" /></span>
          </div>
          <div className="setting-control">
            <select value={s.appUpdateChannel} onChange={e => up('appUpdateChannel', e.target.value)}>
              <option value="all">全部版本 (Alpha / Beta / Stable)</option>
              <option value="beta_rc">僅 Beta 和 RC / Stable</option>
              <option value="stable">僅 RC / Stable (穩定版)</option>
            </select>
          </div>
        </div>
        <div className="setting-row">
          <div className="setting-label">
            <span><Tip label="插件自動更新" desc="當已安裝的插件發布新版本時的處理方式。" /></span>
          </div>
          <div className="setting-control">
            <select value={s.pluginAutoUpdate} onChange={e => up('pluginAutoUpdate', e.target.value)}>
              <option value="notify">通知我</option>
              <option value="auto">自動更新</option>
              <option value="off">關閉</option>
            </select>
          </div>
        </div>
        <div className="setting-row">
          <div className="setting-label">
            <span><Tip label="插件更新渠道" desc="選擇接收哪個版本的插件更新通知或自動更新。" /></span>
          </div>
          <div className="setting-control">
            <select value={s.pluginUpdateChannel} onChange={e => up('pluginUpdateChannel', e.target.value)}>
              <option value="all">全部版本 (Alpha / Beta / Stable)</option>
              <option value="beta_rc">僅 Beta 和 RC / Stable</option>
              <option value="stable">僅 RC / Stable (穩定版)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ===== 行為 ===== */}
      <div className="settings-section-title">行為</div>
      <div className="settings-group">
        <div className="setting-row">
          <div className="setting-label">
            <span><Tip label="開機自啟動" desc="隨 Windows 啟動自動運行。開啟後可在任務管理器的「啟動」選項卡中看到。" /></span>
          </div>
          <div className="setting-control">
            <label className="toggle">
              <input type="checkbox" checked={!!s.autoStart} onChange={async e => {
                try { await ipc.settings.setAutoStart(e.target.checked); up('autoStart', e.target.checked); }
                catch { alert('設置開機自啟動失敗'); }
              }} />
              <span className="slider"></span>
            </label>
          </div>
        </div>
        <div className="setting-row">
          <div className="setting-label">
            <span><Tip label="延遲啟動" desc="開機時僅啟動輕量守護進程，30 秒後再啟動主程序。需要先開啟開機自啟動。" /></span>
          </div>
          <div className="setting-control">
            <label className="toggle">
              <input type="checkbox" checked={!!s.delayedStart} disabled={!s.autoStart}
                onChange={e => up('delayedStart', e.target.checked)} />
              <span className="slider"></span>
            </label>
          </div>
        </div>
        <div className="setting-row">
          <div className="setting-label">
            <span><Tip label="關閉行為" desc="點擊窗口右上角關閉按鈕時的行為。選擇「最小化到系統托盤」後，程序會在右下角托盤區和任務管理器中保持運行。" /></span>
          </div>
          <div className="setting-control">
            <select value={s.closeBehavior} onChange={async e => {
              try { await ipc.settings.setCloseBehavior(e.target.value); up('closeBehavior', e.target.value); }
              catch { up('closeBehavior', e.target.value); }
            }}>
              <option value="exit">直接退出程序</option>
              <option value="minimize">最小化到系統托盤</option>
            </select>
          </div>
        </div>
      </div>

      {/* ===== 通知 ===== */}
      <div className="settings-section-title">通知</div>
      <div className="settings-group">
        <div className="setting-row">
          <div className="setting-label"><span>系統托盤圖標</span><small>在任務欄右下角顯示圖標</small></div>
          <div className="setting-control">
            <label className="toggle">
              <input type="checkbox" checked={!!s.showTrayIcon} onChange={async e => {
                try { await ipc.settings.setTrayIcon(e.target.checked); }
                catch { /* ignore */ }
                up('showTrayIcon', e.target.checked);
              }} />
              <span className="slider"></span>
            </label>
          </div>
        </div>
        <div className="setting-row">
          <div className="setting-label"><span>桌面通知</span><small>接收系統桌面通知</small></div>
          <div className="setting-control">
            <label className="toggle">
              <input type="checkbox" checked={!!s.desktopNotifications} onChange={e => up('desktopNotifications', e.target.checked)} />
              <span className="slider"></span>
            </label>
            <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={async () => {
              try { await ipc.settings.testNotification(); } catch { alert('通知發送失敗'); }
            }}>測試</button>
          </div>
        </div>
        <div className="setting-row">
          <div className="setting-label"><span>聲音通知</span><small>通知時播放提示音</small></div>
          <div className="setting-control">
            <label className="toggle">
              <input type="checkbox" checked={!!s.soundNotifications} onChange={e => up('soundNotifications', e.target.checked)} />
              <span className="slider"></span>
            </label>
            <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={async () => {
              try { await ipc.settings.testSound(); } catch { alert('聲音播放失敗'); }
            }}>測試</button>
          </div>
        </div>
      </div>

      {/* ===== 外觀 ===== */}
      <div className="settings-section-title">外觀</div>
      <div className="settings-group">
        <div className="setting-row">
          <div className="setting-label"><span>主題模式</span><small>即時生效</small></div>
          <div className="setting-control">
            <select value={s.theme} onChange={e => up('theme', e.target.value)}>
              <option value="dark">深色模式</option>
              <option value="light">淺色模式</option>
              <option value="system">跟隨系統</option>
            </select>
          </div>
        </div>
        <div className="setting-row">
          <div className="setting-label"><span>界面縮放</span><small>即時生效，當前: {Math.round((s.scale || 1) * 100)}%</small></div>
          <div className="setting-control">
            <SliderInput min={80} max={150} step={5} value={Math.round((s.scale || 1) * 100)} unit="%"
              onChange={v => up('scale', v / 100)} />
          </div>
        </div>
        <div className="setting-row">
          <div className="setting-label"><span>字體大小</span><small>即時生效，當前: {s.fontSize || 14}px</small></div>
          <div className="setting-control">
            <SliderInput min={10} max={24} step={1} value={s.fontSize || 14} unit="px"
              onChange={v => up('fontSize', v)} />
          </div>
        </div>
        <div className="setting-row">
          <div className="setting-label">
            <span><Tip label="FPS 限制" desc="限制前端渲染幀率。0 為無限制。開啟垂直同步時此選項自動禁用。即時生效。" /></span>
          </div>
          <div className="setting-control">
            <SliderInput min={0} max={300} step={5} value={s.fpsLimit ?? 60} unit="fps"
              disabled={!!s.vsync} onChange={v => up('fpsLimit', v)} />
          </div>
        </div>
        <div className="setting-row">
          <div className="setting-label">
            <span><Tip label="垂直同步" desc="同步顯示器刷新率，防止畫面撕裂。開啟後 FPS 限制自動禁用。即時生效。" /></span>
          </div>
          <div className="setting-control">
            <label className="toggle">
              <input type="checkbox" checked={!!s.vsync} onChange={e => up('vsync', e.target.checked)} />
              <span className="slider"></span>
            </label>
          </div>
        </div>
        <div className="setting-row">
          <div className="setting-label">
            <span><Tip label="精美界面與動畫" desc="開啟光影、毛玻璃與彈性動畫。關閉可釋放 GPU 資源。即時生效，無需重啟。" /></span>
          </div>
          <div className="setting-control">
            <label className="toggle">
              <input type="checkbox" checked={!!s.premiumUI} onChange={e => up('premiumUI', e.target.checked)} />
              <span className="slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* ===== 視窗 ===== */}
      <div className="settings-section-title">視窗</div>
      <div className="settings-group">
        <div className="setting-row">
          <div className="setting-label"><span>視窗模式</span><small>即時切換</small></div>
          <div className="setting-control">
            <select value={s.windowMode} onChange={async e => {
              try { await ipc.settings.setWindowMode(e.target.value); }
              catch { /* ignore */ }
              up('windowMode', e.target.value);
            }}>
              <option value="window">窗口</option>
              <option value="fullscreen">全屏</option>
            </select>
          </div>
        </div>
        <div className="setting-row">
          <div className="setting-label">
            <span><Tip label="全屏快捷鍵" desc="點擊按鈕後按下按鍵組合即可錄製。支持多鍵組合，如 Ctrl+Shift+F。按 Escape 取消。" /></span>
          </div>
          <div className="setting-control">
            <HotkeyRecorder value={s.hotkeyFullscreen || 'F11'} onChange={v => up('hotkeyFullscreen', v)} />
          </div>
        </div>
      </div>

      {/* ===== 高級與性能 ===== */}
      <div className="settings-section-title">高級與性能</div>
      <div className="settings-group">
        <div className="setting-row">
          <div className="setting-label">
            <span><Tip label="管理員模式" desc="開啟後解鎖下方高級設置。需要系統管理員權限。" /></span>
            <small>{isAdmin ? '✅ 已獲取管理員權限' : '❌ 未獲取管理員權限（需以管理員身份運行）'}</small>
          </div>
          <div className="setting-control">
            <label className="toggle">
              <input type="checkbox" checked={!!s.adminMode} disabled={!isAdmin}
                onChange={e => up('adminMode', e.target.checked)} />
              <span className="slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div style={{ opacity: s.adminMode && isAdmin ? 1 : 0.35, pointerEvents: s.adminMode && isAdmin ? 'auto' : 'none' }}>
        <div className="settings-group">
          <div className="setting-row">
            <div className="setting-label"><span>代理設置</span></div>
            <div className="setting-control">
              <select value={s.proxyMode} onChange={e => up('proxyMode', e.target.value)}>
                <option value="system">跟隨系統</option>
                <option value="direct">直連模式</option>
                <option value="custom">自定義</option>
              </select>
            </div>
          </div>
          {s.proxyMode === 'custom' && (
            <div className="setting-row">
              <div className="setting-label"><span>代理地址</span></div>
              <div className="setting-control">
                <input type="text" placeholder="http://127.0.0.1:7890" value={s.proxyUrl || ''} onChange={e => up('proxyUrl', e.target.value)} />
              </div>
            </div>
          )}
          <div className="setting-row">
            <div className="setting-label"><span>網絡請求超時</span></div>
            <div className="setting-control">
              <SliderInput min={5} max={120} step={5} value={s.networkTimeout ?? 30} unit="秒"
                onChange={v => up('networkTimeout', v)} />
            </div>
          </div>
          <div className="setting-row">
            <div className="setting-label"><span>渲染硬件</span></div>
            <div className="setting-control">
              <select value={s.hardwareRender} onChange={e => up('hardwareRender', e.target.value)}>
                <option value="gpu">GPU 硬件加速</option>
                <option value="cpu">CPU 軟件渲染</option>
              </select>
            </div>
          </div>
          <div className="setting-row">
            <div className="setting-label">
              <span><Tip label="自適應 FPS" desc="失去焦點 30 秒後 FPS 自動減半；失去焦點 10 分鐘後降至 10 FPS。即時生效。" /></span>
            </div>
            <div className="setting-control">
              <label className="toggle">
                <input type="checkbox" checked={s.adaptiveFps !== false} onChange={e => up('adaptiveFps', e.target.checked)} />
                <span className="slider"></span>
              </label>
            </div>
          </div>
          <div className="setting-row">
            <div className="setting-label"><span>CPU 預渲染幀</span></div>
            <div className="setting-control">
              <SliderInput min={1} max={10} step={1} value={s.cpuPrerenderFrames ?? 3} unit="幀"
                onChange={v => up('cpuPrerenderFrames', v)} />
            </div>
          </div>
          <div className="setting-row">
            <div className="setting-label">
              <span><Tip label="行為日誌" desc="記錄用戶操作日誌。每 20MB 自動滾動到新文件。" /></span>
            </div>
            <div className="setting-control">
              <label className="toggle">
                <input type="checkbox" checked={s.logEnabled !== false} onChange={e => up('logEnabled', e.target.checked)} />
                <span className="slider"></span>
              </label>
            </div>
          </div>
          <div className="setting-row">
            <div className="setting-label"><span>日誌最大限制</span></div>
            <div className="setting-control">
              <SliderInput min={20} max={1000} step={20} value={s.logMaxSizeMb ?? 100} unit="MB"
                onChange={v => up('logMaxSizeMb', v)} />
            </div>
          </div>
        </div>
      </div>

      {/* ===== 數據與存儲 ===== */}
      <div className="settings-section-title">數據與存儲</div>
      <div className="settings-group">
        <div className="setting-row">
          <div className="setting-label">
            <span>插件下載路徑</span>
            <small className="path-display">{s.downloadPath || '未設置'}</small>
          </div>
          <div className="setting-control">
            <button className="btn btn-outline" onClick={async () => {
              try {
                const dir = await ipc.settings.selectDirectory();
                if (dir) up('downloadPath', dir);
              } catch { /* ignore */ }
            }}>更改</button>
          </div>
        </div>
        <div className="setting-row">
          <div className="setting-label">
            <span>緩存</span>
            <small>當前: {cacheSize.toFixed(2)} MB</small>
          </div>
          <div className="setting-control">
            <button className="btn btn-danger" onClick={async () => {
              setModal({
                title: '清理緩存',
                message: `確定要清理 ${cacheSize.toFixed(2)} MB 的緩存嗎？`,
                onConfirm: async () => {
                  try {
                    const r = await ipc.settings.clearCache();
                    setCacheSize(0);
                    alert(`已清理 ${r.freedMB.toFixed(2)} MB`);
                  } catch { alert('清理失敗'); }
                }
              });
            }}>清理緩存</button>
          </div>
        </div>
        <div className="setting-row">
          <div className="setting-label">
            <span>重置設置</span>
            <small>將所有設置恢復為默認值</small>
          </div>
          <div className="setting-control">
            <button className="btn btn-danger" onClick={() => {
              setModal({
                title: '重置設置',
                message: '確定要將所有設置恢復為默認值嗎？此操作不可撤銷。',
                danger: true,
                onConfirm: async () => {
                  try {
                    await ipc.settings.resetAll();
                    load();
                  } catch { alert('重置失敗'); }
                }
              });
            }}>重置設置</button>
          </div>
        </div>
        <div className="setting-row">
          <div className="setting-label">
            <span style={{ color: 'var(--danger)', fontWeight: 600 }}>恢復出廠設置</span>
            <small>清空所有數據與設置，此操作不可逆</small>
          </div>
          <div className="setting-control">
            <button className="btn btn-danger" onClick={() => {
              setModal({
                title: '⚠️ 恢復出廠設置',
                message: '此操作將清空所有數據、插件和設置，並恢復到初始狀態。\n此操作不可逆，確定要繼續嗎？',
                danger: true,
                onConfirm: async () => {
                  try {
                    await ipc.settings.factoryReset();
                    window.location.reload();
                  } catch { alert('重置失敗'); }
                }
              });
            }}>恢復出廠設置</button>
          </div>
        </div>
      </div>
    </div>
  );
}
