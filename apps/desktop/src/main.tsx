import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// ✅ 路径更新
import { I18nProvider } from './frontends/default/I18nProvider'; 
import { MorgetDialogProvider } from './components/MorgetDialog';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider initialLocale="zh-TW">
      <MorgetDialogProvider>
        <App />
      </MorgetDialogProvider>
    </I18nProvider>
  </React.StrictMode>,
);
