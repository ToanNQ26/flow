const router = require('express').Router();
const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const {
  createContract,
  getContracts,
  getContractById,
  handoverToAccountant,
} = require('../controllers/contractController');
const { ROLES } = require('../utils/constants');

// Tất cả routes đều cần đăng nhập
router.use(authenticate);

// GET  /api/contracts         - Danh sách hợp đồng
router.get('/', getContracts);

// GET  /api/contracts/:id     - Chi tiết hợp đồng
router.get('/:id', getContractById);

// POST /api/contracts         - Tạo hợp đồng + upload file (chỉ Thu mua)
router.post(
  '/',
  authorizeRoles(ROLES.PROCUREMENT),
  upload.array('files', 5),
  createContract
);

// PATCH /api/contracts/:id/handover  - Chuyển giao cho Kế toán (chỉ Thu mua)
router.patch(
  '/:id/handover',
  authorizeRoles(ROLES.PROCUREMENT),
  handoverToAccountant
);

module.exports = router;
