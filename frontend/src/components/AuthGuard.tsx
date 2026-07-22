import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function AuthGuard() {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.runtimeMode === 'PREVIEW' || Boolean(state.token));
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
