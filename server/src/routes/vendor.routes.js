const router = require('express').Router();
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const {
  createVendorQuote,
  getVendorQuote,
  getAllVendorQuotes,
  approveVendorQuote,
} = require('../controllers/vendorController');
const { ROLES } = require('../utils/constants');

// Tất cả routes đều cần đăng nhập
router.use(authenticate);

// GET  /api/vendor-quotes         - Danh sách tất cả VendorQuote
router.get('/', getAllVendorQuotes);

// GET  /api/requests/:id/vendors  - Xem VendorQuote của 1 PR
// (mount từ index.js tại /api/requests/:id/vendors)

// Nested routes (mount trên purchaseRequest router sẽ được xử lý ở index.js)

module.exports = router;
