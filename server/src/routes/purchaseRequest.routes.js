const router = require('express').Router();
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const {
  createRequest,
  getRequests,
  getRequestById,
  ceoApproveRequest,
} = require('../controllers/purchaseRequestController');
const { ROLES } = require('../utils/constants');

// Tất cả routes đều cần đăng nhập
router.use(authenticate);

// GET  /api/requests         - Danh sách yêu cầu (tất cả role đều xem được)
router.get('/', getRequests);

// GET  /api/requests/:id     - Chi tiết 1 yêu cầu
router.get('/:id', getRequestById);

// POST /api/requests         - Tạo yêu cầu (chỉ Trưởng thi công)
router.post('/', authorizeRoles(ROLES.SITE_MANAGER), createRequest);

// PATCH /api/requests/:id/ceo-approve  - CEO duyệt/từ chối
router.patch('/:id/ceo-approve', authorizeRoles(ROLES.CEO), ceoApproveRequest);

module.exports = router;
