import React, { useState, useEffect } from 'react';
import { vendorApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ROLES, formatCurrency } from '../../utils/constants';
import {
  Building2,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Send,
  AlertTriangle,
  Award,
} from 'lucide-react';

const VendorSelectionModal = ({ isOpen, onClose, request, onSuccess }) => {
  const { user } = useAuth();
  const [existingQuote, setExistingQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  // Form state cho Thu mua tạo mới báo giá
  const [vendors, setVendors] = useState([
    {
      vendorName: 'Công ty CP Thép Pomina Sài Gòn',
      contactInfo: '0908.112.233 - sales@pomina.com.vn',
      quotedPrice: 135000000,
      deliveryDays: 3,
      isRecommended: true,
      note: 'Chiết khấu 4%, giao hàng tận chân công trình, CO/CQ đầy đủ',
    },
    {
      vendorName: 'Công ty TNHH VLXD Hòa Phát Miền Nam',
      contactInfo: '0912.445.566 - kd@hoaphatmn.vn',
      quotedPrice: 142000000,
      deliveryDays: 5,
      isRecommended: false,
      note: 'Thương hiệu tốt nhưng thời gian cấp hàng lâu hơn',
    },
    {
      vendorName: 'Nhà phân phối Thép VinaKyoei Miền Đông',
      contactInfo: '0933.778.899',
      quotedPrice: 138500000,
      deliveryDays: 4,
      isRecommended: false,
      note: 'Giá cạnh tranh, thanh toán linh hoạt 30 ngày',
    },
  ]);

  useEffect(() => {
    if (isOpen && request?._id) {
      loadVendorQuote();
    }
  }, [isOpen, request]);

  const loadVendorQuote = async () => {
    setLoading(true);
    setError('');
    setShowRejectInput(false);
    setRejectReason('');
    try {
      const res = await vendorApi.getByRequestId(request._id);
      setExistingQuote(res.data.data);
    } catch (err) {
      // 404 nghĩa là chưa có bảng khảo sát
      setExistingQuote(null);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !request) return null;

  const isProcurement = user?.role === ROLES.PROCUREMENT;
  const isApprover = user?.role === ROLES.CEO || user?.role === ROLES.CHAIRMAN;

  // Thêm dòng NCC (Thu mua)
  const handleAddVendor = () => {
    setVendors([
      ...vendors,
      {
        vendorName: '',
        contactInfo: '',
        quotedPrice: 0,
        deliveryDays: 3,
        isRecommended: false,
        note: '',
      },
    ]);
  };

  const handleRemoveVendor = (index) => {
    if (vendors.length <= 1) return;
    const isRemovingRecommended = vendors[index].isRecommended;
    const updated = vendors.filter((_, i) => i !== index);
    if (isRemovingRecommended && updated.length > 0) {
      updated[0].isRecommended = true;
    }
    setVendors(updated);
  };

  const handleVendorChange = (index, field, value) => {
    const updated = [...vendors];
    updated[index][field] = value;
    setVendors(updated);
  };

  const handleSelectRecommended = (index) => {
    const updated = vendors.map((v, i) => ({
      ...v,
      isRecommended: i === index,
    }));
    setVendors(updated);
  };

  // Thu mua gửi báo giá lên CEO & Chairman
  const handleSubmitVendors = async (e) => {
    e.preventDefault();
    setError('');

    if (vendors.length === 0) {
      setError('Cần ít nhất 1 nhà cung cấp');
      return;
    }

    const recommended = vendors.filter((v) => v.isRecommended);
    if (recommended.length !== 1) {
      setError('Vui lòng chọn đúng 1 nhà cung cấp tối ưu (Được đề xuất)');
      return;
    }

    setSubmitting(true);
    try {
      await vendorApi.create(request._id, vendors);
      await loadVendorQuote();
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu bảng khảo sát');
    } finally {
      setSubmitting(false);
    }
  };

  // CEO / Chairman duyệt hoặc từ chối
  const handleApproveOrReject = async (action) => {
    setError('');
    if (action === 'reject' && !rejectReason.trim()) {
      setShowRejectInput(true);
      setError('Vui lòng nhập lý do từ chối NCC');
      return;
    }

    setSubmitting(true);
    try {
      await vendorApi.approve(request._id, action, rejectReason.trim());
      await loadVendorQuote();
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi phê duyệt');
    } finally {
      setSubmitting(false);
    }
  };

  const quoteData = existingQuote || null;
  const vendorList = quoteData ? quoteData.vendors : vendors;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Khảo Sát & So Sánh Báo Giá Nhà Cung Cấp
                </h3>
                <span className="text-xs font-mono font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                  {request.code}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Công trình: <span className="font-semibold text-slate-700">{request.projectName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Vật tư trong yêu cầu */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Danh sách vật tư yêu cầu từ công trường:
            </div>
            <div className="flex flex-wrap gap-2">
              {request.items?.map((it, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 text-xs bg-white px-3 py-1 rounded-lg border border-slate-200 font-medium text-slate-800"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  <strong>{it.name}</strong>: {it.quantity} {it.unit}
                </span>
              ))}
            </div>
          </div>

          {/* DUAL APPROVAL STATUS TRACKER (Nếu đã nộp báo giá) */}
          {quoteData && (
            <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 p-4 rounded-xl border border-blue-200/80">
              <div className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Tiến trình duyệt 2 cấp (CEO & Chủ tịch):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* CEO Approval Status */}
                <div
                  className={`p-3 rounded-lg border ${
                    quoteData.ceoApprovedBy
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>1. Cấp Giám đốc (CEO):</span>
                    {quoteData.ceoApprovedBy ? (
                      <span className="flex items-center gap-1 text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã duyệt
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600">
                        <Clock className="w-3.5 h-3.5" /> Đang chờ
                      </span>
                    )}
                  </div>
                  {quoteData.ceoApprovedBy && (
                    <div className="text-[11px] text-emerald-600 mt-1">
                      Người duyệt: {quoteData.ceoApprovedBy?.fullName || 'CEO'}
                    </div>
                  )}
                </div>

                {/* Chairman Approval Status */}
                <div
                  className={`p-3 rounded-lg border ${
                    quoteData.chairmanApprovedBy
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>2. Cấp Chủ tịch (Chairman):</span>
                    {quoteData.chairmanApprovedBy ? (
                      <span className="flex items-center gap-1 text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã duyệt
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600">
                        <Clock className="w-3.5 h-3.5" /> Đang chờ
                      </span>
                    )}
                  </div>
                  {quoteData.chairmanApprovedBy && (
                    <div className="text-[11px] text-emerald-600 mt-1">
                      Người duyệt: {quoteData.chairmanApprovedBy?.fullName || 'Chủ tịch'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* BẢNG SO SÁNH NHÀ CUNG CẤP */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Bảng so sánh nhà cung cấp ({vendorList.length} đơn vị)
              </label>
              {!quoteData && isProcurement && (
                <button
                  type="button"
                  onClick={handleAddVendor}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-2.5 py-1 rounded-lg flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm NCC khảo sát
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3">
              {vendorList.map((vendor, idx) => {
                const isSelected = vendor.isRecommended;
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/30 shadow-md ring-1 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Radio button chọn NCC tối ưu */}
                      <div className="flex items-start gap-3 flex-1">
                        <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                          <input
                            type="radio"
                            name="recommendedVendor"
                            checked={isSelected}
                            disabled={!!quoteData}
                            onChange={() => handleSelectRecommended(idx)}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                          />
                        </label>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {!quoteData && isProcurement ? (
                              <input
                                type="text"
                                value={vendor.vendorName}
                                onChange={(e) => handleVendorChange(idx, 'vendorName', e.target.value)}
                                placeholder="Tên nhà cung cấp..."
                                className="font-bold text-sm text-slate-900 border-b border-slate-300 focus:border-blue-600 outline-none w-72"
                              />
                            ) : (
                              <span className="font-bold text-sm text-slate-900">
                                {vendor.vendorName}
                              </span>
                            )}

                            {isSelected && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <Award className="w-3.5 h-3.5 text-emerald-600" />
                                Đề xuất tối ưu nhất
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            {/* Báo giá */}
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                              <span className="text-slate-500 block text-[11px] mb-0.5">Báo giá tổng (VNĐ):</span>
                              {!quoteData && isProcurement ? (
                                <input
                                  type="number"
                                  value={vendor.quotedPrice}
                                  onChange={(e) =>
                                    handleVendorChange(idx, 'quotedPrice', parseFloat(e.target.value) || 0)
                                  }
                                  className="w-full text-xs font-bold text-slate-900 border rounded px-2 py-1 outline-none focus:border-blue-500"
                                />
                              ) : (
                                <span className="text-sm font-extrabold text-blue-700">
                                  {formatCurrency(vendor.quotedPrice)}
                                </span>
                              )}
                            </div>

                            {/* Hạn giao hàng */}
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                              <span className="text-slate-500 block text-[11px] mb-0.5">Hạn giao hàng:</span>
                              {!quoteData && isProcurement ? (
                                <input
                                  type="number"
                                  value={vendor.deliveryDays}
                                  onChange={(e) =>
                                    handleVendorChange(idx, 'deliveryDays', parseInt(e.target.value) || 1)
                                  }
                                  className="w-full text-xs font-bold text-slate-900 border rounded px-2 py-1 outline-none focus:border-blue-500"
                                />
                              ) : (
                                <span className="font-bold text-slate-800 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                                  {vendor.deliveryDays} ngày
                                </span>
                              )}
                            </div>

                            {/* Liên hệ */}
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                              <span className="text-slate-500 block text-[11px] mb-0.5">Thông tin liên hệ:</span>
                              {!quoteData && isProcurement ? (
                                <input
                                  type="text"
                                  value={vendor.contactInfo}
                                  onChange={(e) => handleVendorChange(idx, 'contactInfo', e.target.value)}
                                  placeholder="SĐT / Email..."
                                  className="w-full text-xs font-medium text-slate-800 border rounded px-2 py-1 outline-none focus:border-blue-500"
                                />
                              ) : (
                                <span className="text-slate-700 font-medium truncate block">
                                  {vendor.contactInfo || '-'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Ghi chú điểm mạnh */}
                          <div className="text-xs">
                            <span className="text-slate-500 text-[11px]">Đánh giá ưu thế / Ghi chú: </span>
                            {!quoteData && isProcurement ? (
                              <input
                                type="text"
                                value={vendor.note}
                                onChange={(e) => handleVendorChange(idx, 'note', e.target.value)}
                                placeholder="Chiết khấu, tiến độ, CO/CQ..."
                                className="w-full text-xs text-slate-800 border rounded px-2 py-1 outline-none focus:border-blue-500 mt-1"
                              />
                            ) : (
                              <span className="text-slate-700 italic">"{vendor.note || 'Không có'}"</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Xóa dòng nếu là Thu mua đang soạn */}
                      {!quoteData && isProcurement && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVendor(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ô nhập lý do từ chối nếu có */}
          {showRejectInput && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 animate-in fade-in">
              <label className="block text-xs font-bold text-rose-800 uppercase tracking-wider">
                Lý do từ chối bảng so sánh NCC <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do chi tiết yêu cầu Thu mua khảo sát lại..."
                className="w-full px-3 py-2 text-xs bg-white border border-rose-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition"
          >
            Đóng
          </button>

          {/* CASE 1: Thu mua tạo bảng khảo sát mới */}
          {!quoteData && isProcurement && (
            <button
              onClick={handleSubmitVendors}
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? 'Đang gửi...' : 'Nộp Bảng So Sánh & Trình Duyệt'}
            </button>
          )}

          {/* CASE 2: CEO hoặc Chairman phê duyệt / từ chối */}
          {quoteData && isApprover && quoteData.status !== 'VENDOR_APPROVED' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!showRejectInput) {
                    setShowRejectInput(true);
                  } else {
                    handleApproveOrReject('reject');
                  }
                }}
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition"
              >
                {showRejectInput ? 'Xác nhận Từ chối' : 'Từ chối NCC'}
              </button>

              <button
                type="button"
                onClick={() => handleApproveOrReject('approve')}
                disabled={submitting}
                className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 rounded-xl shadow-md shadow-emerald-500/20 flex items-center gap-2 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                {submitting ? 'Đang duyệt...' : `Duyệt lựa chọn NCC (${user?.role === ROLES.CEO ? 'CEO' : 'Chủ tịch'})`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorSelectionModal;
