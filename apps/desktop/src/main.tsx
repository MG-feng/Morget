import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { I18nProvider } from './frontends/default/I18nProvider.tsx';
import { MorgetDialogProvider } from './components/MorgetDialog.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider initialLocale="zh-TW">
      <MorgetDialogProvider>
        <App />
      </MorgetDialogProvider>
    </I18nProvider>
  </React.StrictMode>,
);
