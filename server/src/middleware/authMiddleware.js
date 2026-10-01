const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware xác thực JWT Token
 * Gắn `req.user` nếu token hợp lệ
 */
const authenticate = async (req, res, next) => {
  try {
    // Lấy token từ header Authorization: Bearer <token>
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token xác thực. Vui lòng đăng nhập.',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token đã hết hạn. Vui lòng đăng nhập lại.',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ.',
      });
    }

    // Tìm user trong DB
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại hoặc đã bị vô hiệu hóa.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị khóa. Liên hệ quản trị viên.',
      });
    }

    // Gắn user vào request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi xác thực hệ thống.',
    });
  }
};

/**
 * Middleware phân quyền theo vai trò (RBAC)
 * Sử dụng: authorizeRoles('CEO', 'CHAIRMAN')
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực. Vui lòng đăng nhập.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Vai trò "${req.user.role}" không có quyền thực hiện thao tác này. Yêu cầu: ${allowedRoles.join(', ')}.`,
      });
    }

    next();
  };
};

module.exports = { authenticate, authorizeRoles };
