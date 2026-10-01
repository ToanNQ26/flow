import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * Component bảo vệ tuyến đường theo trạng thái đăng nhập và RBAC role
 * @param {Array} allowedRoles - Danh sách các vai trò được phép truy cập
 */
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-xs font-semibold text-slate-500">Đang kiểm tra quyền truy cập...</span>
        </div>
      </div>
    );
  }

  // 1. Chưa đăng nhập -> Chuyển hướng về trang Login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Đã đăng nhập nhưng không đủ quyền vai trò -> Chuyển về Unauthorized
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
