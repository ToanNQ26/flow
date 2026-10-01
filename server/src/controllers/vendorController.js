const VendorQuote = require('../models/VendorQuote');
const PurchaseRequest = require('../models/PurchaseRequest');
const {
  ROLES,
  PURCHASE_REQUEST_STATUS,
  VENDOR_COMPARISON_STATUS,
} = require('../utils/constants');

/**
 * POST /api/requests/:id/vendors
 * Thu mua nhập danh sách NCC báo giá và chọn NCC đề xuất
 * Role: PROCUREMENT
 */
const createVendorQuote = async (req, res) => {
  try {
    const purchaseRequestId = req.params.id;
    const { vendors } = req.body;

    // ── Validate PurchaseRequest tồn tại & đã duyệt ────────
    const purchaseRequest = await PurchaseRequest.findById(purchaseRequestId);
    if (!purchaseRequest) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu mua sắm.',
      });
    }

    if (purchaseRequest.status !== PURCHASE_REQUEST_STATUS.APPROVED_BY_CEO) {
      return res.status(400).json({
        success: false,
        message: `Yêu cầu mua sắm chưa được CEO duyệt. Trạng thái hiện tại: "${purchaseRequest.status}".`,
      });
    }

    // Kiểm tra đã có VendorQuote cho PR này chưa
    const existing = await VendorQuote.findOne({ purchaseRequest: purchaseRequestId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Đã có bảng so sánh NCC cho yêu cầu này. Không thể tạo trùng.',
      });
    }

    // ── Validate danh sách NCC ──────────────────────────────
    if (!Array.isArray(vendors) || vendors.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'Cần ít nhất 1 nhà cung cấp trong danh sách.',
      });
    }

    // Validate từng NCC
    for (let i = 0; i < vendors.length; i++) {
      const v = vendors[i];
      if (!v.vendorName || !v.vendorName.trim()) {
        return res.status(400).json({
          success: false,
          message: `NCC dòng ${i + 1}: Tên nhà cung cấp là bắt buộc.`,
        });
      }
      if (v.quotedPrice === undefined || v.quotedPrice === null || v.quotedPrice < 0) {
        return res.status(400).json({
          success: false,
          message: `NCC dòng ${i + 1}: Giá báo phải >= 0.`,
        });
      }
      if (!v.deliveryDays || v.deliveryDays < 1) {
        return res.status(400).json({
          success: false,
          message: `NCC dòng ${i + 1}: Hạn giao hàng tối thiểu 1 ngày.`,
        });
      }
    }

    // Kiểm tra đúng 1 NCC được recommend
    const recommendedCount = vendors.filter((v) => v.isRecommended === true).length;
    if (recommendedCount !== 1) {
      return res.status(400).json({
        success: false,
        message: `Phải có đúng 1 NCC được đề xuất (isRecommended: true). Hiện tại: ${recommendedCount}.`,
      });
    }

    // ── Tạo VendorQuote ─────────────────────────────────────
    const vendorQuote = await VendorQuote.create({
      purchaseRequest: purchaseRequestId,
      vendors,
      status: VENDOR_COMPARISON_STATUS.PENDING_APPROVAL,
      createdBy: req.user._id,
    });

    await vendorQuote.populate('createdBy', 'fullName email role');
    await vendorQuote.populate('purchaseRequest', 'code projectName');

    res.status(201).json({
      success: true,
      message: 'Tạo bảng so sánh NCC thành công. Chờ CEO & Chairman duyệt.',
      data: vendorQuote,
    });
  } catch (error) {
    console.error('createVendorQuote error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join('; '),
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi tạo bảng so sánh NCC.',
    });
  }
};

/**
 * GET /api/requests/:id/vendors
 * Xem bảng so sánh NCC của 1 yêu cầu
 */
const getVendorQuote = async (req, res) => {
  try {
    const vendorQuote = await VendorQuote.findOne({
      purchaseRequest: req.params.id,
    })
      .populate('createdBy', 'fullName email role')
      .populate('purchaseRequest', 'code projectName items')
      .populate('ceoApprovedBy', 'fullName email role')
      .populate('chairmanApprovedBy', 'fullName email role')
      .populate('rejectedBy', 'fullName email role');

    if (!vendorQuote) {
      return res.status(404).json({
        success: false,
        message: 'Chưa có bảng so sánh NCC cho yêu cầu này.',
      });
    }

    res.json({
      success: true,
      data: vendorQuote,
    });
  } catch (error) {
    console.error('getVendorQuote error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống.',
    });
  }
};

/**
 * GET /api/vendor-quotes
 * Lấy toàn bộ danh sách VendorQuote (dành cho CEO/Chairman review)
 */
const getAllVendorQuotes = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status && Object.values(VENDOR_COMPARISON_STATUS).includes(status)) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [quotes, total] = await Promise.all([
      VendorQuote.find(filter)
        .populate('createdBy', 'fullName email role')
        .populate('purchaseRequest', 'code projectName')
        .populate('ceoApprovedBy', 'fullName email role')
        .populate('chairmanApprovedBy', 'fullName email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      VendorQuote.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: quotes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('getAllVendorQuotes error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống.',
    });
  }
};

/**
 * PATCH /api/requests/:id/vendor-approval
 * CEO và CHAIRMAN duyệt lựa chọn NCC
 * Role: CEO | CHAIRMAN
 * Body: { action: 'approve' | 'reject', rejectionReason?: string }
 *
 * Logic:
 *  - Cả CEO và Chairman đều phải duyệt mới chuyển sang VENDOR_APPROVED
 *  - Ai duyệt trước thì ghi nhận, chờ người còn lại
 *  - Bất kỳ ai reject đều chuyển sang REJECTED
 */
const approveVendorQuote = async (req, res) => {
  try {
    const { action, rejectionReason } = req.body;
    const userRole = req.user.role;

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
        message: 'Lý do từ chối là bắt buộc.',
      });
    }

    // ── Tìm VendorQuote ─────────────────────────────────────
    const vendorQuote = await VendorQuote.findOne({
      purchaseRequest: req.params.id,
    });

    if (!vendorQuote) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bảng so sánh NCC.',
      });
    }

    // ── Kiểm tra trạng thái hợp lệ ─────────────────────────
    const validStatuses = [
      VENDOR_COMPARISON_STATUS.PENDING_APPROVAL,
      VENDOR_COMPARISON_STATUS.APPROVED_BY_CEO,
      VENDOR_COMPARISON_STATUS.APPROVED_BY_CHAIRMAN,
    ];
    if (!validStatuses.includes(vendorQuote.status)) {
      return res.status(400).json({
        success: false,
        message: `Không thể thao tác. Trạng thái hiện tại: "${vendorQuote.status}".`,
      });
    }

    // ── Từ chối ─────────────────────────────────────────────
    if (action === 'reject') {
      vendorQuote.status = VENDOR_COMPARISON_STATUS.REJECTED;
      vendorQuote.rejectionReason = rejectionReason.trim();
      vendorQuote.rejectedBy = req.user._id;
      await vendorQuote.save();
      await vendorQuote.populate('rejectedBy', 'fullName email role');

      return res.json({
        success: true,
        message: 'Đã từ chối bảng so sánh NCC.',
        data: vendorQuote,
      });
    }

    // ── Duyệt ───────────────────────────────────────────────
    if (userRole === ROLES.CEO) {
      // Kiểm tra CEO đã duyệt chưa
      if (vendorQuote.ceoApprovedBy) {
        return res.status(400).json({
          success: false,
          message: 'CEO đã duyệt trước đó.',
        });
      }

      vendorQuote.ceoApprovedBy = req.user._id;
      vendorQuote.ceoApprovedAt = new Date();

      // Nếu Chairman đã duyệt rồi -> VENDOR_APPROVED
      if (vendorQuote.chairmanApprovedBy) {
        vendorQuote.status = VENDOR_COMPARISON_STATUS.VENDOR_APPROVED;
      } else {
        vendorQuote.status = VENDOR_COMPARISON_STATUS.APPROVED_BY_CEO;
      }
    } else if (userRole === ROLES.CHAIRMAN) {
      // Kiểm tra Chairman đã duyệt chưa
      if (vendorQuote.chairmanApprovedBy) {
        return res.status(400).json({
          success: false,
          message: 'Chủ tịch đã duyệt trước đó.',
        });
      }

      vendorQuote.chairmanApprovedBy = req.user._id;
      vendorQuote.chairmanApprovedAt = new Date();

      // Nếu CEO đã duyệt rồi -> VENDOR_APPROVED
      if (vendorQuote.ceoApprovedBy) {
        vendorQuote.status = VENDOR_COMPARISON_STATUS.VENDOR_APPROVED;
      } else {
        vendorQuote.status = VENDOR_COMPARISON_STATUS.APPROVED_BY_CHAIRMAN;
      }
    }

    await vendorQuote.save();
    await vendorQuote.populate('ceoApprovedBy', 'fullName email role');
    await vendorQuote.populate('chairmanApprovedBy', 'fullName email role');
    await vendorQuote.populate('purchaseRequest', 'code projectName');

    const isFullyApproved =
      vendorQuote.status === VENDOR_COMPARISON_STATUS.VENDOR_APPROVED;

    res.json({
      success: true,
      message: isFullyApproved
        ? 'NCC đã được cả CEO và Chủ tịch phê duyệt. Sẵn sàng tạo hợp đồng.'
        : `${userRole === ROLES.CEO ? 'CEO' : 'Chủ tịch'} đã duyệt. Chờ ${userRole === ROLES.CEO ? 'Chủ tịch' : 'CEO'} duyệt thêm.`,
      data: vendorQuote,
    });
  } catch (error) {
    console.error('approveVendorQuote error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi xử lý phê duyệt NCC.',
    });
  }
};

module.exports = {
  createVendorQuote,
  getVendorQuote,
  getAllVendorQuotes,
  approveVendorQuote,
};
