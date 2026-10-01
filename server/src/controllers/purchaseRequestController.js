const PurchaseRequest = require('../models/PurchaseRequest');
const {
  ROLES,
  PURCHASE_REQUEST_STATUS,
} = require('../utils/constants');

/**
 * POST /api/requests
 * Trưởng thi công tạo yêu cầu cấp vật tư
 * Role: SITE_MANAGER
 */
const createRequest = async (req, res) => {
  try {
    const { projectName, items, note } = req.body;

    // ── Validate ────────────────────────────────────────────
    if (!projectName || !projectName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Tên công trình là bắt buộc.',
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cần ít nhất 1 vật tư trong danh sách.',
      });
    }

    // Validate từng dòng vật tư
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.name || !item.name.trim()) {
        return res.status(400).json({
          success: false,
          message: `Vật tư dòng ${i + 1}: Tên vật tư là bắt buộc.`,
        });
      }
      if (!item.unit || !item.unit.trim()) {
        return res.status(400).json({
          success: false,
          message: `Vật tư dòng ${i + 1}: Đơn vị tính là bắt buộc.`,
        });
      }
      if (!item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: `Vật tư dòng ${i + 1}: Số lượng phải lớn hơn 0.`,
        });
      }
    }

    // ── Tạo yêu cầu ────────────────────────────────────────
    const purchaseRequest = await PurchaseRequest.create({
      projectName: projectName.trim(),
      items,
      note: note?.trim() || '',
      status: PURCHASE_REQUEST_STATUS.PENDING_CEO_APPROVAL,
      createdBy: req.user._id,
    });

    // Populate thông tin người tạo
    await purchaseRequest.populate('createdBy', 'fullName email role');

    res.status(201).json({
      success: true,
      message: 'Tạo yêu cầu cấp vật tư thành công.',
      data: purchaseRequest,
    });
  } catch (error) {
    console.error('createRequest error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join('; '),
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi tạo yêu cầu.',
    });
  }
};

/**
 * GET /api/requests
 * Lấy danh sách yêu cầu mua sắm
 * - SITE_MANAGER: chỉ xem của mình
 * - CEO, CHAIRMAN: xem tất cả
 * - Các role khác: xem tất cả (read-only)
 */
const getRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};

    // SITE_MANAGER chỉ xem yêu cầu của mình
    if (req.user.role === ROLES.SITE_MANAGER) {
      filter.createdBy = req.user._id;
    }

    // Lọc theo trạng thái nếu có
    if (status && Object.values(PURCHASE_REQUEST_STATUS).includes(status)) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [requests, total] = await Promise.all([
      PurchaseRequest.find(filter)
        .populate('createdBy', 'fullName email role')
        .populate('approvedBy', 'fullName email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      PurchaseRequest.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('getRequests error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi lấy danh sách yêu cầu.',
    });
  }
};

/**
 * GET /api/requests/:id
 * Xem chi tiết 1 yêu cầu
 */
const getRequestById = async (req, res) => {
  try {
    const request = await PurchaseRequest.findById(req.params.id)
      .populate('createdBy', 'fullName email role')
      .populate('approvedBy', 'fullName email role');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu mua sắm.',
      });
    }

    // SITE_MANAGER chỉ xem yêu cầu của mình
    if (
      req.user.role === ROLES.SITE_MANAGER &&
      request.createdBy._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem yêu cầu này.',
      });
    }

    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error('getRequestById error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống.',
    });
  }
};

/**
 * PATCH /api/requests/:id/ceo-approve
 * CEO duyệt hoặc từ chối yêu cầu mua sắm
 * Role: CEO
 * Body: { action: 'approve' | 'reject', rejectionReason?: string }
 */
const ceoApproveRequest = async (req, res) => {
  try {
    const { action, rejectionReason } = req.body;

    // ── Validate action ─────────────────────────────────────
    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Hành động phải là "approve" hoặc "reject".',
      });
    }

    if (action === 'reject' && (!rejectionReason || !rejectionReason.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Lý do từ chối là bắt buộc khi từ chối yêu cầu.',
      });
    }

    // ── Tìm yêu cầu ────────────────────────────────────────
    const request = await PurchaseRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu mua sắm.',
      });
    }

    // ── Kiểm tra trạng thái hợp lệ ─────────────────────────
    if (request.status !== PURCHASE_REQUEST_STATUS.PENDING_CEO_APPROVAL) {
      return res.status(400).json({
        success: false,
        message: `Không thể thao tác. Trạng thái hiện tại: "${request.status}". Yêu cầu phải ở trạng thái "PENDING_CEO_APPROVAL".`,
      });
    }

    // ── Xử lý duyệt/từ chối ────────────────────────────────
    if (action === 'approve') {
      request.status = PURCHASE_REQUEST_STATUS.APPROVED_BY_CEO;
      request.approvedBy = req.user._id;
      request.approvedAt = new Date();
    } else {
      request.status = PURCHASE_REQUEST_STATUS.REJECTED;
      request.rejectionReason = rejectionReason.trim();
      request.approvedBy = req.user._id;
      request.approvedAt = new Date();
    }

    await request.save();
    await request.populate('createdBy', 'fullName email role');
    await request.populate('approvedBy', 'fullName email role');

    res.json({
      success: true,
      message:
        action === 'approve'
          ? 'Đã duyệt yêu cầu mua sắm thành công.'
          : 'Đã từ chối yêu cầu mua sắm.',
      data: request,
    });
  } catch (error) {
    console.error('ceoApproveRequest error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi xử lý phê duyệt.',
    });
  }
};

module.exports = {
  createRequest,
  getRequests,
  getRequestById,
  ceoApproveRequest,
};
