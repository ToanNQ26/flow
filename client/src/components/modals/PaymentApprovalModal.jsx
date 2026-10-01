import React, { useState } from 'react';
import { paymentApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ROLES, formatCurrency, formatDate, CHAIRMAN_APPROVAL_THRESHOLD } from '../../utils/constants';
import {
  Receipt,
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building,
  CreditCard,
  FileText,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

const PaymentApprovalModal = ({ isOpen, onClose, payment, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  if (!isOpen || !payment) return null;

  const amount = payment.proposedAmount || 0;
  const isHighValue = amount >= 50000000;
  const isCeo = user?.role === ROLES.CEO;
  const isChairman = user?.role === ROLES.CHAIRMAN;
  const canApprove =
    (isCeo && payment.status === 'PENDING_CEO_APPROVAL') ||
    (isChairman && (payment.status === 'PENDING_CHAIRMAN' || payment.status === 'WAITING_CHAIRMAN_APPROVAL'));

  const handleApprove = async () => {
    setError('');
    setLoading(true);
    try {
      await paymentApi.approve(payment._id, 'approve');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi phê duyệt đề xuất');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('Vui lòng nhập lý do từ chối đề xuất thanh toán');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await paymentApi.approve(payment._id, 'reject', rejectReason.trim());
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi từ chối đề xuất');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Thẩm Xét & Phê Duyệt Thanh Toán</h3>
                <span className="text-xs font-mono font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                  {payment.code}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Vai trò hiện tại: <strong className="text-slate-800">{user?.fullName} ({user?.role})</strong>
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
        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SỐ TIỀN & BADGE CẢNH BÁO TÀI CHÍNH QUAN TRỌNG */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>SỐ TIỀN ĐỀ XUẤT THANH TOÁN</span>
              <span className="font-mono bg-white/10 px-2 py-0.5 rounded">
                {payment.paymentType === 'ONE_TIME' ? 'Thanh toán 1 lần' : 'Theo đợt (Milestone)'}
              </span>
            </div>

            <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
              {formatCurrency(amount)}
            </div>

            {/* FINANCIAL WARNING BADGE (Yêu cầu đề bài) */}
            {isHighValue ? (
              <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/40 px-3.5 py-2 rounded-xl text-amber-300 text-xs font-bold animate-pulse">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>⚠️ Yêu cầu 2 cấp duyệt (CEO + Chủ tịch) — Giá trị từ 50,000,000 VNĐ trở lên</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Số tiền dưới 50 triệu VNĐ — Chỉ cần 1 cấp Giám đốc (CEO) phê duyệt để chi quỹ.</span>
              </div>
            )}
          </div>

          {/* Chi tiết Hợp đồng & Nhà cung cấp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
              <div className="text-slate-500 font-semibold flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-blue-600" /> Hợp đồng liên kết:
              </div>
              <div className="font-bold text-slate-900 text-sm">
                {payment.contract?.code || 'HĐ-CT2026'}
              </div>
              <div className="text-slate-600">
                Tổng giá trị: <strong className="text-blue-700">{formatCurrency(payment.contract?.totalValue)}</strong>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
              <div className="text-slate-500 font-semibold flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-blue-600" /> Nhà cung cấp thụ hưởng:
              </div>
              <div className="font-bold text-slate-900 text-sm">
                {payment.contract?.vendorName || 'Công ty cung ứng VLXD'}
              </div>
              <div className="text-slate-500">
                Người lập đề xuất: <strong>{payment.createdBy?.fullName || 'Kế toán'}</strong>
              </div>
            </div>
          </div>

          {/* Thông tin tài khoản thụ hưởng */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-2.5">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              Thông tin tài khoản ngân hàng thụ hưởng:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200/60">
              <div>
                <span className="text-slate-500 block text-[11px]">Số tài khoản:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {payment.bankAccount?.accountNumber || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Chủ tài khoản:</span>
                <span className="font-bold text-slate-900">
                  {payment.bankAccount?.accountName || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Ngân hàng:</span>
                <span className="font-semibold text-slate-800">
                  {payment.bankAccount?.bankName} {payment.bankAccount?.branch && `(${payment.bankAccount.branch})`}
                </span>
              </div>
            </div>
          </div>

          {/* Tiến trình duyệt */}
          <div className="text-xs p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
              Trạng thái phê duyệt tài chính:
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <span className={`px-2 py-0.5 rounded font-bold ${payment.ceoApprovedBy ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                1. CEO Duyệt: {payment.ceoApprovedBy ? '✅ Đã duyệt' : '⏳ Chưa duyệt'}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className={`px-2 py-0.5 rounded font-bold ${payment.chairmanApprovedBy ? 'bg-emerald-100 text-emerald-800' : isHighValue ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-400'}`}>
                2. Chủ tịch Duyệt: {payment.chairmanApprovedBy ? '✅ Đã duyệt' : isHighValue ? '⏳ Cần duyệt' : 'Không bắt buộc'}
              </span>
            </div>
          </div>

          {/* Ô nhập lý do từ chối */}
          {isRejecting && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2 animate-in fade-in">
              <label className="block text-xs font-bold text-rose-800 uppercase tracking-wider">
                Lý do từ chối đề xuất thanh toán <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="VD: Nghiệm thu công trường chưa đạt tiêu chuẩn, yêu cầu giữ lại 10%..."
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

          {canApprove && (
            <div className="flex items-center gap-2.5">
              {!isRejecting ? (
                <button
                  type="button"
                  onClick={() => setIsRejecting(true)}
                  className="px-4 py-2.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" /> Từ chối
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={loading}
                  className="px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-md shadow-rose-500/20 transition flex items-center gap-1.5"
                >
                  {loading ? 'Đang xử lý...' : 'Xác nhận Từ chối'}
                </button>
              )}

              <button
                type="button"
                onClick={handleApprove}
                disabled={loading}
                className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 rounded-xl shadow-md shadow-emerald-500/20 transition flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {loading
                  ? 'Đang duyệt...'
                  : isHighValue && isCeo
                  ? 'Phê duyệt sơ bộ (Chuyển Chủ tịch)'
                  : 'Phê duyệt & Sẵn sàng chi'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentApprovalModal;
