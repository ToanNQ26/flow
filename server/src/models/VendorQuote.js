const mongoose = require('mongoose');
const { VENDOR_COMPARISON_STATUS } = require('../utils/constants');

// Schema cho từng NCC được báo giá
const vendorEntrySchema = new mongoose.Schema(
  {
    vendorName: {
      type: String,
      required: [true, 'Tên nhà cung cấp là bắt buộc'],
      trim: true,
    },
    contactInfo: {
      type: String,
      trim: true,
      default: '',
    },
    // Báo giá tổng
    quotedPrice: {
      type: Number,
      required: [true, 'Giá báo là bắt buộc'],
      min: [0, 'Giá báo không được âm'],
    },
    // Hạn giao hàng (số ngày)
    deliveryDays: {
      type: Number,
      required: [true, 'Hạn giao hàng là bắt buộc'],
      min: [1, 'Hạn giao hàng tối thiểu 1 ngày'],
    },
    // NCC được Thu mua đề xuất
    isRecommended: {
      type: Boolean,
      default: false,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const vendorQuoteSchema = new mongoose.Schema(
  {
    // Liên kết PurchaseRequest
    purchaseRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseRequest',
      required: [true, 'Yêu cầu mua sắm liên kết là bắt buộc'],
    },
    // Danh sách NCC so sánh
    vendors: {
      type: [vendorEntrySchema],
      validate: {
        validator: function (v) {
          if (!Array.isArray(v) || v.length < 1) return false;
          // Đảm bảo chỉ có đúng 1 NCC được recommend
          const recommended = v.filter((vendor) => vendor.isRecommended);
          return recommended.length === 1;
        },
        message:
          'Cần ít nhất 1 NCC và phải có đúng 1 NCC được đề xuất (isRecommended)',
      },
    },
    // Trạng thái duyệt
    status: {
      type: String,
      enum: Object.values(VENDOR_COMPARISON_STATUS),
      default: VENDOR_COMPARISON_STATUS.DRAFT,
    },
    // Người tạo (Thu mua)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // CEO duyệt
    ceoApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    ceoApprovedAt: {
      type: Date,
      default: null,
    },
    // Chairman duyệt
    chairmanApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    chairmanApprovedAt: {
      type: Date,
      default: null,
    },
    // Lý do từ chối
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index
vendorQuoteSchema.index({ purchaseRequest: 1 });
vendorQuoteSchema.index({ status: 1 });
vendorQuoteSchema.index({ createdBy: 1 });

// Virtual: lấy NCC được recommend
vendorQuoteSchema.virtual('recommendedVendor').get(function () {
  if (!this.vendors) return null;
  return this.vendors.find((v) => v.isRecommended) || null;
});

module.exports = mongoose.model('VendorQuote', vendorQuoteSchema);
