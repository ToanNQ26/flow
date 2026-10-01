import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';
import { ROLE_CONFIG } from '../utils/constants';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('flow_token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Khởi tạo: kiểm tra token hợp lệ bằng cách gọi /api/auth/me
  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('flow_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await authApi.getMe();
        if (res.data.success && res.data.data.user) {
          // Role được trích xuất trực tiếp từ JWT Token sau khi server giải mã
          setUser(res.data.data.user);
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Phiên đăng nhập hết hạn hoặc không hợp lệ:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();

    // Lắng nghe sự kiện logout khi token hết hạn từ Axios interceptor
    const handleLogout = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('auth-logout', handleLogout);
    return () => window.removeEventListener('auth-logout', handleLogout);
  }, []);

  // Đăng nhập bằng Email & Mật khẩu
  const login = async (email, password) => {
    try {
      const res = await authApi.login(email.trim(), password);
      const { token: newToken, user: userData } = res.data.data;

      // Lưu token vào localStorage
      localStorage.setItem('flow_token', newToken);
      setToken(newToken);
      setUser(userData);

      return { success: true, user: userData };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Email hoặc mật khẩu không chính xác.',
      };
    }
  };

  // Đăng xuất hoàn toàn
  const logout = () => {
    localStorage.removeItem('flow_token');
    localStorage.removeItem('flow_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        token,
        isAuthenticated: !!user && !!token,
        loading,
        login,
        logout,
        currentRoleConfig: user ? ROLE_CONFIG[user.role] : null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
