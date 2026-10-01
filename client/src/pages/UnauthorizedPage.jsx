import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_CONFIG } from '../utils/constants';
import { ShieldX, ArrowLeft, LogOut } from 'lucide-react';

const UnauthorizedPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const roleLabel = ROLE_CONFIG[user?.role]?.label || user?.role;

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-inner">
          <ShieldX className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-600 bg-rose-100/60 px-2.5 py-1 rounded-full">
            HTTP 403 Forbidden
          </span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Truy Cập Bị Từ Chối (Không Đủ Quyền)
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Tài khoản hiện tại của bạn không có thẩm quyền thực hiện hoặc truy cập phân hệ này theo chính sách bảo mật RBAC.
          </p>
        </div>

        {/* Current user badge */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-left text-xs space-y-1.5">
          <div className="flex justify-between items-center text-slate-500">
            <span>Tài khoản đang đăng nhập:</span>
            <span className="font-bold text-slate-900">{user?.fullName}</span>
          </div>
          <div className="flex justify-between items-center text-slate-500">
            <span>Vai trò phiên làm việc:</span>
            <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${ROLE_CONFIG[user?.role]?.color || 'bg-slate-200'}`}>
              {roleLabel}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-2.5 px-4 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Về Dashboard
          </button>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-500/20 transition flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-4 h-4" /> Đổi Tài Khoản
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
