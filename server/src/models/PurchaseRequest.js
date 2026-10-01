const mongoose = require('mongoose');
const { PURCHASE_REQUEST_STATUS } = require('../utils/constants');

// Schema cho từng dòng vật tư trong yêu cầu
const materialItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên vật tư là bắt buộc'],
      trim: true,
    },
    unit: {
      type: String,
      required: [true, 'Đơn vị tính là bắt buộc'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Số lượng là bắt buộc'],
      min: [0.01, 'Số lượng phải lớn hơn 0'],
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const purchaseRequestSchema = new mongoose.Schema(
  {
    // Mã yêu cầu tự sinh
    code: {
      type: String,
      unique: true,
    },
    // Công trình / dự án
    projectName: {
      type: String,
      required: [true, 'Tên công trình là bắt buộc'],
      trim: true,
    },
    // Danh sách vật tư
    items: {
      type: [materialItemSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Cần ít nhất 1 vật tư trong danh sách',
      },
    },
    // Ghi chú chung
    note: {
      type: String,
      trim: true,
      default: '',
    },
    // Trạng thái phê duyệt
    status: {
      type: String,
      enum: Object.values(PURCHASE_REQUEST_STATUS),
      default: PURCHASE_REQUEST_STATUS.DRAFT,
    },
    // Người tạo (Trưởng thi công)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // CEO duyệt
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    // Lý do từ chối (nếu có)
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index
purchaseRequestSchema.index({ status: 1 });
purchaseRequestSchema.index({ createdBy: 1 });

// Tự sinh mã PR-YYYYMMDD-XXXX
purchaseRequestSchema.pre('save', async function (next) {
  if (this.isNew && !this.code) {
    const today = new Date();
    const dateStr =
      today.getFullYear().toString() +
      String(today.getMonth() + 1).padStart(2, '0') +
      String(today.getDate()).padStart(2, '0');

    const count = await mongoose.model('PurchaseRequest').countDocuments({
      code: { $regex: `^PR-${dateStr}` },
    });

    this.code = `PR-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('PurchaseRequest', purchaseRequestSchema);

