import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import './styles.css';
import './styles/gis-theme.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#18d6c8',
          colorSuccess: '#4ade80',
          colorWarning: '#facc15',
          colorError: '#fb7185',
          colorInfo: '#38bdf8',
          colorBgLayout: '#071521',
          colorBgContainer: 'rgba(9, 25, 39, 0.86)',
          colorText: '#e6f7ff',
          colorTextSecondary: '#94a9bd',
          colorBorder: 'rgba(122, 220, 255, 0.18)',
          borderRadius: 8,
          wireframe: false,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif",
          fontSize: 14
        },
        components: {
          Layout: {
            bodyBg: 'transparent',
            headerBg: 'rgba(7, 21, 33, 0.82)',
            siderBg: 'transparent',
            headerHeight: 64
          },
          Menu: {
            darkItemBg: 'transparent',
            darkItemSelectedBg: 'rgba(24, 214, 200, 0.18)',
            darkItemSelectedColor: '#e6fffb',
            itemBorderRadius: 8
          },
          Card: {
            borderRadiusLG: 8,
            colorBgContainer: 'rgba(9, 25, 39, 0.82)'
          },
          Table: {
            headerBg: 'rgba(11, 31, 47, 0.92)',
            headerColor: '#b8f7ff',
            rowHoverBg: 'rgba(24, 214, 200, 0.08)'
          },
          Modal: {
            contentBg: '#0a1d2d',
            headerBg: '#0a1d2d',
            titleColor: '#e6f7ff'
          },
          Button: {
            borderRadius: 8,
            primaryShadow: '0 0 18px rgba(24, 214, 200, 0.22)'
          }
        }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ConfigProvider>
  </React.StrictMode>
);
