import React, { useState, useEffect, createContext, useContext } from 'react';
import { ipc } from '../ipc/client.ts';
import type { AppSettings } from '@morget/ipc-contract';

// 內置簡易 Dialog (避免依賴外部文件)
const DlgCtx = createContext<{ alert: (m: string) => Promise<void>; confirm: (m: string) => Promise<boolean> } | null>(null);
const useDlg = () => useContext(DlgCtx)!;
function DlgProvider({ children }: { children: React.ReactNode }) {
  const [st, setSt] = useState<any>({ visible: false });
  const alert = (msg: string) => new Promise<void>(res => setSt({ visible: true, msg, type: 'alert', res }));
  const confirm = (msg: string) => new Promise<boolean>(res => setSt({ visible: true, msg, type: 'confirm', res }));
  return (
    <DlgCtx.Provider value={{ alert, confirm }}>
      {children}
      {st.visible && (
        <div className="morget-dialog-overlay">
          <div className="morget-dialog">
            <h3>MORGET</h3><p>{st.msg}</p>
            <div className="morget-dialog-actions">
              {st.type === 'confirm' && <button className="btn btn-outline" onClick={() => { setSt({ visible: false }); st.res(false); }}>取消</button>}
              <button className="btn btn-primary" onClick={() => { setSt({ visible: false }); st.res(true); }}>確認</button>
            </div>
          </div>
        </div>
      )}
    </DlgCtx.Provider>
  );
}

const Tip = ({ label, desc }: { label: string, desc: string }) => (
  <span className="tooltip-wrapper">{label}<span className="tooltip-text">{desc}</span></span>
);

export default function SettingsView() {
  return <DlgProvider><SettingsContent /></DlgProvider>;
}

function SettingsContent() {
  const dlg = useDlg();
  const [activeMenu, setActiveMenu] = useState('general_basic');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cacheSize, setCacheSize] = useState(0);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const s = await ipc.settings.get();
    setSettings(s);
    setCacheSize(await ipc.settings.getCacheSize());
    setIsAdmin(await ipc.settings.checkAdmin());
  };

  const update = async (key: keyof AppSettings, value: any) => {
    if (!settings) return;
    const n = { ...settings, [key]: value };
    setSettings(n);
    await ipc.settings.set({ [key]: value });
  };

  const handleResetAll = async () => {
    if (await dlg.confirm('⚠️ 確定要清空所有數據並恢復出廠設置嗎？此操作不可逆！')) {
      await ipc.settings.resetAllData();
      dlg.alert('數據已重置，應用即將重啟。');
      window.location.reload();
    }
  };

  if (!settings) return <div>載入中...</div>;

  const menus = [
    { group: '常規', items: [{ id: 'general_basic', label: '常規' }, { id: 'general_behavior', label: '行為' }, { id: 'general_notify', label: '通知' }] },
    { group: '外觀', items: [{ id: 'app_basic', label: '常規' }, { id: 'app_other', label: '其他' }] },
    { group: '控制', items: [{ id: 'control_hotkeys', label: '快捷鍵' }] },
    { group: '高級與性能', items: [{ id: 'adv_basic', label: '常規' }, { id: 'adv_network', label: '網絡' }, { id: 'adv_perf', label: '性能' }, { id: 'adv_data', label: '數據與磁盤' }] },
  ];

  return (
    <div>
      <div className="panel-header"><h2>系統設置</h2></div>
      <div className="settings-layout">
        <div className="settings-sidebar">
          {menus.map(m => (
            <div key={m.group} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, paddingLeft: 12 }}>{m.group}</div>
              {m.items.map(i => (
                <div key={i.id} className={`settings-nav-item ${activeMenu === i.id ? 'active' : ''}`} onClick={() => setActiveMenu(i.id)}>{i.label}</div>
              ))}
            </div>
          ))}
        </div>

        <div className="settings-content">
          {/* 常規 > 常規 */}
          {activeMenu === 'general_basic' && (
            <div className="settings-group">
              <h3>常規設置</h3>
              <div className="setting-row">
                <div className="setting-label"><span>語言 (Language)</span></div>
                <div className="setting-control">
                  <select value={settings.language} onChange={e => update('language', e.target.value)}>
                    <option value="zh-TW">繁體中文</option><option value="zh-CN">簡體中文</option><option value="en-US">English</option>
                  </select>
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-label"><span><Tip label="應用自動更新" desc="當 Morget 發布新版本時，選擇提示您或自動在後台下載安裝。" /></span></div>
                <div className="setting-control">
                  <select value={settings.autoUpdate} onChange={e => update('autoUpdate', e.target.value)}>
                    <option value="prompt">提示我</option><option value="auto">自動更新</option><option value="off">關閉</option>
                  </select>
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-label"><span><Tip label="插件自動更新" desc="當已安裝的插件發布新版本時的處理策略。" /></span></div>
                <div className="setting-control">
                  <select value={settings.pluginAutoUpdate} onChange={e => update('pluginAutoUpdate', e.target.value)}>
                    <option value="prompt">提示我</option><option value="auto">自動更新</option><option value="off">關閉</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 常規 > 行為 */}
          {activeMenu === 'general_behavior' && (
            <div className="settings-group">
              <h3>行為設置</h3>
              <div className="setting-row">
                <div className="setting-label"><span><Tip label="開機自啟動" desc="隨 Windows 啟動自動運行 Morget。" /></span></div>
                <div className="setting-control"><label className="toggle"><input type="checkbox" checked={settings.autoStart} onChange={e => update('autoStart', e.target.checked)} /><span className="slider"></span></label></div>
              </div>
              <div className="setting-row">
                <div className="setting-label"><span><Tip label="延遲啟動" desc="開機時僅啟動輕量級守護進程，等待 30 秒後再啟動主程序以加快開機速度。" /></span></div>
                <div className="setting-control"><label className="toggle"><input type="checkbox" checked={settings.delayedStart} onChange={e => update('delayedStart', e.target.checked)} /><span className="slider"></span></label></div>
              </div>
              <div className="setting-row">
                <div className="setting-label"><span>關閉按鈕行為</span></div>
                <div className="setting-control">
                  <select value={settings.closeBehavior} onChange={e => update('closeBehavior', e.target.value)}>
                    <option value="exit">直接退出程序</option><option value="minimize">最小化到系統托盤</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 常規 > 通知 */}
          {activeMenu === 'general_notify' && (
            <div className="settings-group">
              <h3>通知設置</h3>
              <div className="setting-row">
                <div className="setting-label"><span>系統托盤圖標</span></div>
                <div className="setting-control"><label className="toggle"><input type="checkbox" checked={settings.showTrayIcon} onChange={e => update('showTrayIcon', e.target.checked)} /><span className="slider"></span></label></div>
              </div>
              <div className="setting-row">
                <div className="setting-label"><span>桌面通知</span></div>
                <div className="setting-control"><label className="toggle"><input type="checkbox" checked={settings.desktopNotifications} onChange={e => update('desktopNotifications', e.target.checked)} /><span className="slider"></span></label></div>
              </div>
              <div className="setting-row">
                <div className="setting-label"><span>聲音通知</span></div>
                <div className="setting-control"><label className="toggle"><input type="checkbox" checked={settings.soundNotifications} onChange={e => update('soundNotifications', e.target.checked)} /><span className="slider"></span></label></div>
              </div>
            </div>
          )}

          {/* 外觀 > 常規 */}
          {activeMenu === 'app_basic' && (
            <div className="settings-group">
              <h3>外觀常規</h3>
              <div className="setting-row">
                <div className="setting-label"><span>主題模式</span></div>
                <div className="setting-control">
                  <select value={settings.theme} onChange={e => update('theme', e.target.value)}>
                    <option value="dark">深色模式</option><option value="light">淺色模式</option><option value="system">跟隨系統</option>
                  </select>
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-label"><span>界面縮放</span><small>當前: {Math.round(settings.scale * 100)}%</small></div>
                <div className="setting-control"><input type="range" min="0.8" max="1.5" step="0.1" value={settings.scale} onChange={e => update('scale', parseFloat(e.target.value))} style={{ width: 150 }} /></div>
              </div>
              <div className="setting-row">
                <div className="setting-label"><span><Tip label="FPS 限制" desc="限制前端渲染幀率。0 為無限制。開啟垂直同步時此選項失效。" /></span></div>
                <div className="setting-control"><input type="number" min="0" max="300" value={settings.fpsLimit} disabled={settings.vsync} onChange={e => update('fpsLimit', parseInt(e.target.value))} style={{ width: 80 }} /></div>
              </div>
              <div className="setting-row">
                <div className="setting-label"><span>垂直同步 (VSync)</span></div>
                <div className="setting-control"><label className="toggle"><input type="checkbox" checked={settings.vsync} onChange={e => update('vsync', e.target.checked)} /><span className="slider"></span></label></div>
              </div>
            </div>
          )}

          {/* 外觀 > 其他 */}
          {activeMenu === 'app_other' && (
            <div className="settings-group">
              <h3>外觀其他</h3>
              <div className="setting-row">
                <div className="setting-label"><span>視窗模式</span></div>
                <div className="setting-control">
                  <select value={settings.windowMode} onChange={e => update('windowMode', e.target.value)}>
                    <option value="window">窗口</option><option value="fullscreen">全屏 (F11)</option>
                  </select>
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-label"><span>字體大小</span></div>
                <div className="setting-control"><input type="number" min="10" max="24" value={settings.fontSize} onChange={e => update('fontSize', parseInt(e.target.value))} style={{ width: 80 }} /></div>
              </div>
              <div className="setting-row">
                <div className="setting-label"><span>前端主題包</span></div>
                <div className="setting-control">
                  <select value={settings.frontendPack} onChange={e => update('frontendPack', e.target.value)}>
                    <option value="default">Morget Default</option>
                  </select>
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-label"><span><Tip label="精美界面與動畫" desc="開啟光影、毛玻璃與彈性動畫。關閉可釋放 GPU 資源。" /></span></div>
                <div className="setting-control"><label className="toggle"><input type="checkbox" checked={settings.premiumUI} onChange={e => update('premiumUI', e.target.checked)} /><span className="slider"></span></label></div>
              </div>
            </div>
          )}

          {/* 控制 > 快捷鍵 */}
          {activeMenu === 'control_hotkeys' && (
            <div className="settings-group">
              <h3>快捷鍵</h3>
              <div className="setting-row">
                <div className="setting-label"><span>全屏切換</span></div>
                <div className="setting-control"><input type="text" value={settings.hotkeyFullscreen} readOnly style={{ width: 100, textAlign: 'center' }} /></div>
              </div>
            </div>
          )}

          {/* 高級 > 常規 (管理員門禁) */}
          {activeMenu === 'adv_basic' && (
            <div className="settings-group">
              <h3>權限管理</h3>
              <div className="setting-row">
                <div className="setting-label"><span><Tip label="管理員模式" desc="開啟後解鎖高級網絡與性能設置。需要系統管理員權限。" /></span><small>{isAdmin ? '✅ 已獲取管理員權限' : '❌ 未獲取管理員權限'}</small></div>
                <div className="setting-control"><label className="toggle"><input type="checkbox" checked={settings.adminMode} disabled={!isAdmin} onChange={e => update('adminMode', e.target.checked)} /><span className="slider"></span></label></div>
              </div>
            </div>
          )}

          {/* 高級 > 網絡 */}
          {activeMenu === 'adv_network' && (
            <div className="settings-group" style={{ opacity: settings.adminMode ? 1 : 0.5, pointerEvents: settings.adminMode ? 'auto' : 'none' }}>
              <h3>網絡設置 (需管理員)</h3>
              <div className="setting-row">
                <div className="setting-label"><span>代理設置</span></div>
                <div className="setting-control">
                  <select value={settings.proxyMode} onChange={e => update('proxyMode', e.target.value)}>
                    <option value="system">跟隨系統</option><option value="direct">直連模式</option><option value="custom">自定義</option>
                  </select>
                </div>
              </div>
              {settings.proxyMode === 'custom' && (
                <div className="setting-row">
                  <div className="setting-label"><span>代理地址</span></div>
                  <div className="setting-control"><input type="text" placeholder="http://127.0.0.1:7890" value={settings.proxyUrl} onChange={e => update('proxyUrl', e.target.value)} /></div>
                </div>
              )}
              <div className="setting-row">
                <div className="setting-label"><span>請求超時 (秒)</span></div>
                <div className="setting-control"><input type="number" min="5" max="120" value={settings.networkTimeout} onChange={e => update('networkTimeout', parseInt(e.target.value))} style={{ width: 80 }} /></div>
              </div>
            </div>
          )}

          {/* 高級 > 性能 */}
          {activeMenu === 'adv_perf' && (
            <div className="settings-group" style={{ opacity: settings.adminMode ? 1 : 0.5, pointerEvents: settings.adminMode ? 'auto' : 'none' }}>
              <h3>性能設置 (需管理員)</h3>
              <div className="setting-row">
                <div className="setting-label"><span>渲染硬件</span></div>
                <div className="setting-control">
                  <select value={settings.hardwareRender} onChange={e => update('hardwareRender', e.target.value)}>
                    <option value="gpu">GPU 硬件加速</option><option value="cpu">CPU 軟件渲染</option>
                  </select>
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-label"><span><Tip label="自適應 FPS" desc="失去焦點 30 秒後 FPS 減半，失去焦點 10 分鐘後降至 10 FPS。" /></span></div>
                <div className="setting-control"><label className="toggle"><input type="checkbox" checked={settings.adaptiveFps} onChange={e => update('adaptiveFps', e.target.checked)} /><span className="slider"></span></label></div>
              </div>
              <div className="setting-row">
                <div className="setting-label"><span>CPU 預渲染幀</span></div>
                <div className="setting-control"><input type="number" min="1" max="10" value={settings.cpuPrerenderFrames} onChange={e => update('cpuPrerenderFrames', parseInt(e.target.value))} style={{ width: 80 }} /></div>
              </div>
            </div>
          )}

          {/* 高級 > 數據與磁盤 */}
          {activeMenu === 'adv_data' && (
            <div className="settings-group" style={{ opacity: settings.adminMode ? 1 : 0.5, pointerEvents: settings.adminMode ? 'auto' : 'none' }}>
              <h3>數據與磁盤 (需管理員)</h3>
              <div className="setting-row">
                <div className="setting-label"><span>緩存管理</span><small>當前: {cacheSize.toFixed(2)} MB</small></div>
                <div className="setting-control"><button className="btn btn-outline" onClick={async () => { const r = await ipc.settings.clearCache(); dlg.alert(`已清理 ${r.freedMB.toFixed(2)} MB`); setCacheSize(0); }}>清理緩存</button></div>
              </div>
              <div className="setting-row">
                <div className="setting-label"><span><Tip label="行為日誌記錄" desc="記錄用戶操作。每 20MB 自動滾動。" /></span></div>
                <div className="setting-control"><label className="toggle"><input type="checkbox" checked={settings.logEnabled} onChange={e => update('logEnabled', e.target.checked)} /><span className="slider"></span></label></div>
              </div>
              <div className="setting-row">
                <div className="setting-label"><span>日誌最大限制 (MB)</span></div>
                <div className="setting-control"><input type="number" min="20" max="1000" value={settings.logMaxSizeMb} onChange={e => update('logMaxSizeMb', parseInt(e.target.value))} style={{ width: 80 }} /></div>
              </div>
              <div className="setting-row">
                <div className="setting-label"><span style={{ color: 'var(--danger)' }}>恢復出廠設置</span><small>清空所有數據與設置</small></div>
                <div className="setting-control"><button className="btn btn-danger" onClick={handleResetAll}>重置應用</button></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
