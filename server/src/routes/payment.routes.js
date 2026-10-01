const router = require('express').Router();
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const {
  createPaymentProposal,
  getPaymentProposals,
  getPaymentProposalById,
  approvePaymentProposal,
  disbursePayment,
} = require('../controllers/paymentController');
const { ROLES } = require('../utils/constants');

// Tất cả routes đều cần đăng nhập
router.use(authenticate);

// GET  /api/payments         - Danh sách đề xuất thanh toán
router.get('/', getPaymentProposals);

// GET  /api/payments/:id     - Chi tiết đề xuất
router.get('/:id', getPaymentProposalById);

// POST /api/payments         - Tạo đề xuất thanh toán (chỉ Kế toán)
router.post('/', authorizeRoles(ROLES.ACCOUNTANT), createPaymentProposal);

// PATCH /api/payments/:id/approve  - CEO/Chairman duyệt
router.patch(
  '/:id/approve',
  authorizeRoles(ROLES.CEO, ROLES.CHAIRMAN),
  approvePaymentProposal
);

// PATCH /api/payments/:id/disburse - Thủ quỹ xác nhận chi tiền
router.patch(
  '/:id/disburse',
  authorizeRoles(ROLES.TREASURER),
  disbursePayment
);

module.exports = router;
