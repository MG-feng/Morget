import React, { useState, useEffect } from 'react';
import { ipc } from '../ipc/client';

const Loading = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-secondary)', fontSize: 16, letterSpacing: 3 }}>
    === 載入中 ===
  </div>
);

const Tip = ({ label, desc }: { label: string; desc: string }) => (
  <span className="tip">
    {label}
    <span className="tip-icon">?</span>
    <span className="tip-text">{desc}</span>
  </span>
);

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

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const settings = await ipc.settings.get();
      setS(settings);
    } catch (e: any) {
      setError(`設置加載失敗: ${e?.message || e}`);
      setLoading(false);
      return;
    }
    try { setCacheSize(await ipc.settings.getCacheSize()); } catch { setCacheSize(0); }
    try { setIsAdmin(await (ipc.settings as any).checkAdmin?.() ?? false); } catch { setIsAdmin(false); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const up = async (key: string, value: any) => {
    if (!s) return;
    setS({ ...s, [key]: value });
    try { await ipc.settings.set({ [key]: value } as any); } catch (e) { console.error('保存失敗:', e); }
  };

  if (loading) return <Loading />;

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ color: 'var(--danger)', fontSize: 14 }}>{error}</div>
      <button className="btn btn-outline" onClick={load}>重試</button>
    </div>
  );

  if (!s) return <Loading />;

  return (
    <div>
      <div className="panel-header"><h2>系統設置</h2></div>
      <div className="settings-flat">

        {/* ===== 常規 ===== */}
        <div className="settings-section-title">常規</div>

        <div className="setting-row">
          <div className="setting-label"><span>語言 (Language)</span><small>更改後即時生效</small></div>
          <div className="setting-control">
            <select value={s.language} onChange={e => up('language', e.target.value)}>
              <option value="zh-TW">繁體中文</option>
              <option value="zh-CN">簡體中文</option>
              <option value="en-US">English</option>
            </select>
          </div>
        </div>

        <div className="setting-row">
          <div className="setting-label"><span><Tip label="應用自動更新" desc="當 Morget 發布新版本時，選擇提示您或自動在後台下載安裝。" /></span></div>
          <div className="setting-control">
            <select value={s.autoUpdate} onChange={e => up('autoUpdate', e.target.value)}>
              <option value="prompt">提示我</option>
              <option value="auto">自動更新</option>
              <option value="off">關閉</option>
            </select>
          </div>
        </div>

        <div className="setting-row">
          <div className="setting-label"><span><Tip label="插件自動更新" desc="當已安裝的插件發布新版本時的處理策略。" /></span></div>
          <div className="setting-control">
            <select value={s.pluginAutoUpdate} onChange={e => up('pluginAutoUpdate', e.target.value)}>
              <option value="prompt">提示我</option>
              <option value="auto">自動更新</option>
              <option value="off">關閉</option>
            </select>
          </div>
        </div>

        {/* ===== 行為 ===== */}
        <div className="settings-section-title">行為</div>

        <div className="setting-row">
          <div className="setting-label"><span><Tip label="開機自啟動" desc="隨 Windows 啟動自動運行 Morget。" /></span></div>
          <div className="setting-control">
            <label className="toggle"><input type="checkbox" checked={!!s.autoStart} onChange={e => up('autoStart', e.target.checked)} /><span className="slider"></span></label>
          </div>
        </div>

        <div className="setting-row">
          <div className="setting-label"><span><Tip label="延遲啟動" desc="開機時僅啟動輕量級守護進程，30 秒後再啟動主程序。" /></span></div>
          <div className="setting-control">
            <label className="toggle"><input type="checkbox" checked={!!s.delayedStart} onChange={e => up('delayedStart', e.target.checked)} /><span className="slider"></span></label>
          </div>
        </div>

        <div className="setting-row">
          <div className="setting-label"><span>關閉按鈕行為</span></div>
          <div className="setting-control">
            <select value={s.closeBehavior} onChange={e => up('closeBehavior', e.target.value)}>
              <option value="exit">直接退出程序</option>
              <option value="minimize">最小化到系統托盤</option>
            </select>
          </div>
        </div>

        {/* ===== 通知 ===== */}
        <div className="settings-section-title">通知</div>

        <div className="setting-row">
          <div className="setting-label"><span>系統托盤圖標</span></div>
          <div className="setting-control">
            <label className="toggle"><input type="checkbox" checked={!!s.showTrayIcon} onChange={e => up('showTrayIcon', e.target.checked)} /><span className="slider"></span></label>
          </div>
        </div>

        <div className="setting-row">
          <div className="setting-label"><span>桌面通知</span></div>
          <div className="setting-control">
            <label className="toggle"><input type="checkbox" checked={!!s.desktopNotifications} onChange={e => up('desktopNotifications', e.target.checked)} /><span className="slider"></span></label>
          </div>
        </div>

        <div className="setting-row">
          <div className="setting-label"><span>聲音通知</span></div>
          <div className="setting-control">
            <label className="toggle"><input type="checkbox" checked={!!s.soundNotifications} onChange={e => up('soundNotifications', e.target.checked)} /><span className="slider"></span></label>
          </div>
        </div>

        {/* ===== 外觀 ===== */}
        <div className="settings-section-title">外觀</div>

        <div className="setting-row">
          <div className="setting-label"><span>主題模式</span></div>
          <div className="setting-control">
            <select value={s.theme} onChange={e => up('theme', e.target.value)}>
              <option value="dark">深色模式</option>
              <option value="light">淺色模式</option>
              <option value="system">跟隨系統</option>
            </select>
          </div>
        </div>

        <div className="setting-row">
          <div className="setting-label"><span><Tip label="界面縮放" desc="整體 UI 縮放比例，影響所有界面元素大小。" /></span></div>
          <div className="setting-control">
            <SliderInput min={80} max={150} step={5} value={Math.round((s.scale || 1) * 100)} unit="%"
              onChange={v => up('scale', v / 100)} />
          </div>
        </div>

        <div className="setting-row">
          <div className="setting-label"><span><Tip label="字體大小" desc="全局基礎字體大小，影響所有文字顯示。" /></span></div>
          <div className="setting-control">
            <SliderInput min={10} max={24} step={1} value={s.fontSize || 14} unit="px"
              onChange={v => up('fontSize', v)} />
          </div>
        </div>

        <div className="setting-row">
          <div className="setting-label"><span><Tip label="FPS 限制" desc="限制前端渲染幀率。0 為無限制。開啟垂直同步時此選項自動禁用。" /></span></div>
          <div className="setting-control">
            <SliderInput min={0} max={300} step={5} value={s.fpsLimit ?? 60} unit="fps"
              disabled={!!s.vsync} onChange={v => up('fpsLimit', v)} />
          </div>
        </div>

        <div className="setting-row">
          <div className="setting-label"><span><Tip label="垂直同步" desc="同步顯示器刷新率，防止畫面撕裂。開啟後 FPS 限制將被禁用。" /></span></div>
          <div className="setting-control">
            <label className="toggle"><input type="checkbox" checked={!!s.vsync} onChange={e => up('vsync', e.target.checked)} /><span className="slider"></span></label>
          </div>
        </div>

        <div className="setting-row">
          <div className="setting-label"><span>視窗模式</span></div>
          <div className="setting-control">
            <select value={s.windowMode} onChange={e => up('windowMode', e.target.value)}>
              <option value="window">窗口</option>
              <option value="fullscreen">全屏 (F11)</option>
            </select>
          </div>
        </div>

        <div className="setting-row">
          <div className="setting-label"><span>前端主題包</span></div>
          <div className="setting-control">
            <select value={s.frontendPack} onChange={e => up('frontendPack', e.target.value)}>
              <option value="default">Morget Default</option>
            </select>
          </div>
        </div>

        <div className="setting-row">
          <div className="setting-label"><span><Tip label="精美界面與動畫" desc="開啟光影、毛玻璃與彈性動畫。關閉可釋放 GPU 資源。" /></span></div>
          <div className="setting-control">
            <label className="toggle"><input type="checkbox" checked={!!s.premiumUI} onChange={e => up('premiumUI', e.target.checked)} /><span className="slider"></span></label>
          </div>
        </div>

        {/* ===== 控制 ===== */}
        <div className="settings-section-title">控制</div>

        <div className="setting-row">
          <div className="setting-label"><span>全屏切換快捷鍵</span></div>
          <div className="setting-control">
            <input type="text" value={s.hotkeyFullscreen || 'F11'} readOnly style={{ width: 100, textAlign: 'center', opacity: 0.7 }} />
          </div>
        </div>

        {/* ===== 高級與性能 ===== */}
        <div className="settings-section-title">高級與性能</div>

        <div className="setting-row">
          <div className="setting-label">
            <span><Tip label="管理員模式" desc="開啟後解鎖下方高級設置。需要系統管理員權限。" /></span>
            <small>{isAdmin ? '✅ 已獲取管理員權限' : '❌ 未獲取管理員權限'}</small>
          </div>
          <div className="setting-control">
            <label className="toggle"><input type="checkbox" checked={!!s.adminMode} disabled={!isAdmin} onChange={e => up('adminMode', e.target.checked)} /><span className="slider"></span></label>
          </div>
        </div>

        <div style={{ opacity: s.adminMode ? 1 : 0.35, pointerEvents: s.adminMode ? 'auto' : 'none' }}>
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
            <div className="setting-label"><span><Tip label="自適應 FPS" desc="失去焦點 30 秒後 FPS 自動減半；失去焦點 10 分鐘後降至 10 FPS。" /></span></div>
            <div className="setting-control">
              <label className="toggle"><input type="checkbox" checked={s.adaptiveFps !== false} onChange={e => up('adaptiveFps', e.target.checked)} /><span className="slider"></span></label>
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
            <div className="setting-label"><span><Tip label="行為日誌" desc="記錄用戶操作日誌。每 20MB 自動滾動到新文件。" /></span></div>
            <div className="setting-control">
              <label className="toggle"><input type="checkbox" checked={s.logEnabled !== false} onChange={e => up('logEnabled', e.target.checked)} /><span className="slider"></span></label>
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

        {/* ===== 數據與存儲 ===== */}
        <div className="settings-section-title">數據與存儲</div>

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
              } catch (e) { console.error(e); }
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
              try {
                const r = await ipc.settings.clearCache();
                alert(`已清理 ${r.freedMB.toFixed(2)} MB`);
                setCacheSize(0);
              } catch (e) { alert('清理失敗'); }
            }}>清理緩存</button>
          </div>
        </div>

        <div className="setting-row">
          <div className="setting-label">
            <span style={{ color: 'var(--danger)', fontWeight: 600 }}>恢復出廠設置</span>
            <small>清空所有數據與設置，此操作不可逆</small>
          </div>
          <div className="setting-control">
            <button className="btn btn-danger" onClick={async () => {
              if (confirm('⚠️ 確定要清空所有數據並恢復出廠設置嗎？此操作不可逆！')) {
                try {
                  await (ipc.settings as any).resetAllData?.();
                  alert('數據已重置，應用即將重啟。');
                  window.location.reload();
                } catch (e) { alert('重置失敗: ' + e); }
              }
            }}>重置應用</button>
          </div>
        </div>

      </div>
    </div>
  );
}
