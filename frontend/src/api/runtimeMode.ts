import { useAuthStore } from '../stores/authStore';

export const PREVIEW_WRITE_EVENT = 'geoagent:preview-write';
export const PREVIEW_WRITE_MESSAGE = '仅本地预览，未写入服务器';

export function isPreviewMode() {
  return useAuthStore.getState().runtimeMode === 'PREVIEW';
}

export function emitPreviewWriteNotice() {
  window.dispatchEvent(new CustomEvent(PREVIEW_WRITE_EVENT));
}

export function onPreviewWrite(listener: () => void) {
  window.addEventListener(PREVIEW_WRITE_EVENT, listener);
  return () => window.removeEventListener(PREVIEW_WRITE_EVENT, listener);
}

export function isPreviewFallbackAllowed(error: unknown) {
  const candidate = error as {
    status?: number;
    code?: number | string;
    message?: string;
    response?: { status?: number };
  };
  const status = candidate.status ?? candidate.response?.status;
  const code = Number(candidate.code);
  const message = candidate.message || '';

  if (status === 401 || status === 403 || code === 401 || code === 403) return false;
  if (status && status < 500) return false;
  return !status || status >= 500 || /Network|timeout|系统异常|连接|ECONN/i.test(message);
}
