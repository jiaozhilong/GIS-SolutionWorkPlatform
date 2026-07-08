import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import './styles.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          colorSuccess: '#52c41a',
          colorWarning: '#faad14',
          colorError: '#ff4d4f',
          colorBgLayout: '#f5f7fa',
          borderRadius: 8,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif",
          fontSize: 14
        },
        components: {
          Layout: { siderBg: '#001529', headerBg: '#ffffff', headerHeight: 56 },
          Menu: { darkItemBg: '#001529', darkItemSelectedBg: '#1677ff' },
          Card: { borderRadiusLG: 8 }
        }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ConfigProvider>
  </React.StrictMode>
);

