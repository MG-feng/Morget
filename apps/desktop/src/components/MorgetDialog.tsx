import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useI18n } from '../frontends/default/I18nProvider.tsx';

interface DialogState {
  visible: boolean;
  title: string;
  message: string;
  type: 'alert' | 'confirm';
  resolve?: (value: boolean) => void;
}

interface DialogContextType {
  alert: (message: string, title?: string) => Promise<void>;
  confirm: (message: string, title?: string) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextType | null>(null);

export function MorgetDialogProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [dialog, setDialog] = useState<DialogState>({
    visible: false,
    title: '',
    message: '',
    type: 'alert',
  });

  const alert = useCallback((message: string, title?: string) => {
    return new Promise<void>((resolve) => {
      setDialog({
        visible: true,
        title: title || t('app.name'),
        message,
        type: 'alert',
        resolve: () => {
          setDialog(prev => ({ ...prev, visible: false }));
          resolve();
        },
      });
    });
  }, [t]);

  const confirm = useCallback((message: string, title?: string) => {
    return new Promise<boolean>((resolve) => {
      setDialog({
        visible: true,
        title: title || t('dialog.confirm'),
        message,
        type: 'confirm',
        resolve: (value: boolean) => {
          setDialog(prev => ({ ...prev, visible: false }));
          resolve(value);
        },
      });
    });
  }, [t]);

  return (
    <DialogContext.Provider value={{ alert, confirm }}>
      {children}
      {dialog.visible && (
        <div className="morget-dialog-overlay">
          <div className="morget-dialog">
            <h3>{dialog.title}</h3>
            <p>{dialog.message}</p>
            <div className="morget-dialog-actions">
              {dialog.type === 'confirm' && (
                <button className="btn btn-outline" onClick={() => dialog.resolve?.(false)}>
                  {t('dialog.cancel')}
                </button>
              )}
              <button className="btn btn-primary" onClick={() => dialog.resolve?.(true)}>
                {t('dialog.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useMorgetDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useMorgetDialog must be used within MorgetDialogProvider');
  return ctx;
}
