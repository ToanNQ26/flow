import React, { useState } from 'react';
import { paymentApi } from '../../services/api';
import { formatCurrency } from '../../utils/constants';
import {
  Banknote,
  X,
  CheckCircle2,
  AlertTriangle,
  Building,
  CreditCard,
  Hash,
  ShieldCheck,
} from 'lucide-react';

const DisbursementModal = ({ isOpen, onClose, payment, onSuccess }) => {
  const [transactionCode, setTransactionCode] = useState(
    `UNC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(
      new Date().getDate()
    ).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [note, setNote] = useState('Đã chuyển khoản qua Internet Banking');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !payment) return null;

  const handleDisburse = async (e) => {
    e.preventDefault();
    if (!transactionCode.trim()) {
      setError('Vui lòng nhập Mã giao dịch / Số ủy nhiệm chi');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await paymentApi.disburse(payment._id, {
        transactionCode: transactionCode.trim(),
        note: note.trim(),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi xác nhận chi quỹ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-teal-50/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Xác Nhận Chi Quỹ & Ủy Nhiệm Chi</h3>
              <p className="text-xs text-slate-500">Nghiệp vụ Thủ quỹ thực hiện chuyển khoản</p>
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
        <form onSubmit={handleDisburse} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Số tiền cần chi */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md">
            <span className="text-xs text-teal-100 font-medium block mb-1">SỐ TIỀN CẦN THỰC CHI:</span>
            <div className="text-2xl sm:text-3xl font-black tracking-tight">
              {formatCurrency(payment.proposedAmount)}
            </div>
            <div className="text-[11px] text-teal-100 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-200" />
              Đã được Ban Giám đốc phê duyệt trạng thái: APPROVED_READY_TO_PAY
            </div>
          </div>

          {/* Thông tin thụ hưởng */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
            <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
              Thông tin người thụ hưởng:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500 block text-[11px]">Đơn vị nhận:</span>
                <span className="font-bold text-slate-900 block truncate">
                  {payment.bankAccount?.accountName || payment.contract?.vendorName}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Số tài khoản:</span>
                <span className="font-mono font-bold text-blue-700 block">
                  {payment.bankAccount?.accountNumber}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block text-[11px]">Ngân hàng:</span>
                <span className="font-medium text-slate-800">
                  {payment.bankAccount?.bankName} {payment.bankAccount?.branch && `- ${payment.bankAccount.branch}`}
                </span>
              </div>
            </div>
          </div>

          {/* Mã giao dịch / UNC */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Mã giao dịch / Số Ủy nhiệm chi (UNC) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Hash className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={transactionCode}
                onChange={(e) => setTransactionCode(e.target.value)}
                placeholder="VD: UNC-VCB-998822..."
                className="w-full pl-9 pr-3.5 py-2.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
              />
            </div>
          </div>

          {/* Ghi chú chi quỹ */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Ghi chú chi tiền
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Chuyển khoản đợt 1 qua Internet Banking..."
              className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:scale-95 disabled:opacity-50 rounded-xl shadow-md shadow-teal-500/20 flex items-center gap-2 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              {loading ? 'Đang ghi nhận...' : 'Xác nhận Đã Chi Tiền (PAID)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DisbursementModal;
