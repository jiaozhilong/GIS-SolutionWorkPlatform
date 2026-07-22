import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import { queryClient } from './api/queryClient';
import AppErrorBoundary from './components/AppErrorBoundary';
import './styles.css';
import './styles/gis-theme.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#167D64',
          colorSuccess: '#167D64',
          colorWarning: '#F59E0B',
          colorError: '#DC5A5A',
          colorInfo: '#0891B2',
          colorBgLayout: '#F4F7F6',
          colorBgContainer: '#FFFFFF',
          colorText: '#18211E',
          colorTextSecondary: '#667570',
          colorBorder: '#DFE7E3',
          borderRadius: 8,
          wireframe: false,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif",
          fontSize: 14
        },
        components: {
          Layout: {
            bodyBg: '#F4F7F6',
            headerBg: '#FFFFFF',
            siderBg: 'transparent',
            headerHeight: 64
          },
          Menu: {
            darkItemBg: 'transparent',
            darkItemSelectedBg: 'rgba(65, 226, 204, 0.18)',
            darkItemSelectedColor: '#f0feff',
            itemBorderRadius: 8
          },
          Card: {
            borderRadiusLG: 8,
            colorBgContainer: '#FFFFFF'
          },
          Table: {
            headerBg: '#F8FBFA',
            headerColor: '#18211E',
            rowHoverBg: '#F4FAF8'
          },
          Modal: {
            contentBg: '#FFFFFF',
            headerBg: '#FFFFFF',
            titleColor: '#18211E'
          },
          Button: {
            borderRadius: 8,
            primaryShadow: '0 0 18px rgba(65, 226, 204, 0.24)'
          }
        }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AppErrorBoundary>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AppErrorBoundary>
      </QueryClientProvider>
    </ConfigProvider>
  </React.StrictMode>
);
