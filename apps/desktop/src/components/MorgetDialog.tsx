import React, { createContext, useContext, useState, useCallback } from 'react';
import { Lang } from '../i18n/Lang';

interface DialogContextType { alert: (msg: string) => Promise<void>; confirm: (msg: string) => Promise<boolean>; }
const DialogContext = createContext<DialogContextType | null>(null);
export const useMorgetDialog = () => { const ctx = useContext(DialogContext); if (!ctx) throw new Error('Dialog Provider missing'); return ctx; };

export function MorgetDialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<any>({ visible: false });
  const alert = useCallback((msg: string): Promise<void> => new Promise(res => setState({ visible: true, msg, onConfirm: () => { setState({ visible: false }); res(); } })), []);
  const confirm = useCallback((msg: string): Promise<boolean> => new Promise(res => setState({ visible: true, msg, showCancel: true, onConfirm: () => { setState({ visible: false }); res(true); }, onCancel: () => { setState({ visible: false }); res(false); } })), []);
  return (
    <DialogContext.Provider value={{ alert, confirm }}>
      {children}
      {state.visible && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999}}>
          <div className="morget-dialog" style={{background:'#1a1a1a',padding:24,borderRadius:10,minWidth:340,color:'#fff',border:'1px solid #2e2e2e',boxShadow:'0 20px 50px rgba(0,0,0,0.5)'}}>
            <div style={{marginBottom:24,fontSize:15,lineHeight:1.5,color:'#e5e5e5'}}>{state.msg}</div>
            <div style={{textAlign:'right',display:'flex',gap:10,justifyContent:'flex-end'}}>
              {state.showCancel && <button onClick={state.onCancel} style={{padding:'8px 16px',cursor:'pointer',background:'transparent',border:'1px solid #444',color:'#aaa',borderRadius:6,fontSize:13}}>{Lang.get('common.cancel')}</button>}
              <button onClick={state.onConfirm} style={{padding:'8px 16px',background:'#0ea5e9',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:'600',fontSize:13}}>{Lang.get('common.confirm')}</button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}
