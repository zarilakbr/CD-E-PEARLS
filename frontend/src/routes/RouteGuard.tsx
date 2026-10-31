import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AccessDeniedPage } from '../pages/common/AccessDeniedPage';
import type { AllowedRole } from './manifest';

interface RouteGuardProps {
  allowedRoles: AllowedRole[];
  children: React.ReactNode;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ allowedRoles, children }) => {
  const { user, role, isAuthenticated, isLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Show page skeleton while authenticating
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBF8F3] dark:bg-[#0D1C2B] flex flex-col items-center justify-center p-8 text-center">
        <div className="relative w-12 h-12 mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-[#E6DDD0] dark:border-white/10" />
          <div className="absolute inset-0 rounded-full border-2 border-[#8A6A2F] border-t-transparent animate-spin" />
        </div>
        <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#8A6A2F]">
          CD'E Pearls Lombok Atelier
        </span>
        <p className="text-xs text-[#4A5666] dark:text-[#D9B877] mt-1 font-light">
          Menyelaraskan kredensial...
        </p>
      </div>
    );
  }

  // 1. If route is public, everyone is allowed
  if (allowedRoles.includes('public')) {
    return <>{children}</>;
  }

  // 2. If route is guest-only (e.g. /masuk, /daftar, /lupa-kata-sandi, /atur-ulang-kata-sandi)
  if (allowedRoles.includes('guest')) {
    if (isAuthenticated && role) {
      const dashboardTarget = role === 'admin' ? '/admin' : role === 'spi' ? '/spi' : '/akun';
      return <Navigate to={dashboardTarget} replace />;
    }
    return <>{children}</>;
  }

  // 3. Protected route: user is NOT authenticated
  if (!isAuthenticated || !user) {
    const fullPath = location.pathname + location.search;
    return <Navigate to={`/masuk?next=${encodeURIComponent(fullPath)}`} replace />;
  }

  // 4. Role mismatch check (RBAC)
  const currentRole = role || user.role;
  const isRoleAllowed =
    allowedRoles.includes(currentRole as AllowedRole) ||
    allowedRoles.includes('public');

  if (!isRoleAllowed) {
    const dashboardTarget = currentRole === 'admin' ? '/admin' : currentRole === 'spi' ? '/spi' : '/akun';

    return (
      <AccessDeniedPage
        currentRole={currentRole}
        attemptedPath={location.pathname}
        onNavigateHome={() => navigate('/')}
        onNavigateDashboard={() => navigate(dashboardTarget)}
        onOpenLogin={async () => {
          await logout();
          navigate('/masuk');
        }}
        onLogout={async () => {
          await logout();
          navigate('/');
        }}
      />
    );
  }

  return <>{children}</>;
};

export default RouteGuard;
