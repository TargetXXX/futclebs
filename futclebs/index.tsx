import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme } from 'antd';
import App from './App';
import './index.css';

import { AuthProvider } from './contexts/AuthContext';
import { OrganizationProvider } from './contexts/OrganizationContext';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <ConfigProvider
    theme={{
      algorithm: theme.darkAlgorithm,
      token: {
        colorPrimary: '#22d3ee',
        colorBgBase: '#020617',
        colorBgContainer: '#0f172a',
        colorBorder: '#334155',
        borderRadius: 14,
      },
      components: {
        Card: { colorBgContainer: '#0b1223', colorBorderSecondary: '#243145' },
        Modal: { contentBg: '#0b1223', headerBg: '#0b1223' },
        Drawer: { colorBgElevated: '#0b1223' },
        Segmented: { itemSelectedBg: 'rgba(34, 211, 238, 0.25)' },
      },
    }}
  >
    <AuthProvider>
      <OrganizationProvider>
        <App />
      </OrganizationProvider>
    </AuthProvider>
  </ConfigProvider>
);
