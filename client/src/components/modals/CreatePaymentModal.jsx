import React, { useState } from 'react';
import { paymentApi } from '../../services/api';
import { formatCurrency } from '../../utils/constants';
import {
  Receipt,
  X,
  CreditCard,
  Send,
  AlertTriangle,
  Building,
  ShieldAlert,
} from 'lucide-react';

const CreatePaymentModal = ({ isOpen, onClose, contract, onSuccess }) => {
  const [paymentType, setPaymentType] = useState('ONE_TIME');
  const [proposedAmount, setProposedAmount] = useState(contract?.totalValue || 60000000);
  const [bankAccount, setBankAccount] = useState({
    accountNumber: '190333888999',
    accountName: contract?.vendorName ? `CONG TY CP ${contract.vendorName.toUpperCase()}` : 'CONG TY CP THEP POMINA',
    bankName: 'Techcombank',
    branch: 'Chi nhánh Sài Gòn',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !contract) return null;

  const isHighValue = proposedAmount >= 50000000;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!proposedAmount || proposedAmount <= 0) {
      setError('Số tiền đề xuất phải lớn hơn 0');
      return;
    }
    if (!bankAccount.accountNumber.trim() || !bankAccount.accountName.trim() || !bankAccount.bankName.trim()) {
      setError('Vui lòng điền đủ thông tin tài khoản thụ hưởng');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await paymentApi.create({
        contractId: contract._id,
        paymentType,
        proposedAmount,
        bankAccount,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo đề xuất thanh toán');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Lập Đề Xuất Thanh Toán Hợp Đồng</h3>
              <p className="text-xs text-slate-500">Nghiệp vụ Kế toán trình Ban Giám đốc</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Hợp đồng liên kết */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <div className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-blue-600" />
              Hợp đồng: <strong className="text-slate-800">{contract.code}</strong>
            </div>
            <div className="font-bold text-slate-900 text-sm">{contract.vendorName}</div>
            <div className="text-slate-600">
              Tổng giá trị hợp đồng: <strong className="text-blue-700">{formatCurrency(contract.totalValue)}</strong>
            </div>
          </div>

          {/* Loại thanh toán & Số tiền */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Hình thức thanh toán <span className="text-rose-500">*</span>
              </label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl outline-none focus:border-amber-500"
              >
                <option value="ONE_TIME">Thanh toán 1 lần (100%)</option>
                <option value="MILESTONE">Theo đợt nghiệm thu</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Số tiền đề xuất (VNĐ) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                max={contract.totalValue}
                value={proposedAmount}
                onChange={(e) => setProposedAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-bold text-blue-700 bg-white border border-slate-300 rounded-xl outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* BADGE CẢNH BÁO THEO NGƯỠNG TÀI CHÍNH */}
          {isHighValue ? (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Cảnh báo tài chính (≥ 50,000,000 VNĐ):</strong>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Đề xuất này sẽ cần <strong>CEO duyệt sơ bộ</strong> rồi chuyển sang <strong>Chủ tịch duyệt bước cuối</strong> trước khi Thủ quỹ được chi tiền.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
              ✓ Đề xuất dưới 50 triệu VNĐ — Chỉ cần 1 cấp <strong>Giám đốc (CEO)</strong> duyệt là sẵn sàng chi.
            </div>
          )}

          {/* Thông tin thụ hưởng */}
          <div className="space-y-2.5 pt-1">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
              Tài khoản ngân hàng thụ hưởng:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="text-slate-500 text-[11px] block mb-1">Số tài khoản:</label>
                <input
                  type="text"
                  required
                  value={bankAccount.accountNumber}
                  onChange={(e) => setBankAccount({ ...bankAccount, accountNumber: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-500 text-[11px] block mb-1">Tên chủ tài khoản:</label>
                <input
                  type="text"
                  required
                  value={bankAccount.accountName}
                  onChange={(e) => setBankAccount({ ...bankAccount, accountName: e.target.value.toUpperCase() })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-slate-500 text-[11px] block mb-1">Ngân hàng:</label>
                <input
                  type="text"
                  required
                  value={bankAccount.bankName}
                  onChange={(e) => setBankAccount({ ...bankAccount, bankName: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="text-slate-500 text-[11px] block mb-1">Chi nhánh:</label>
                <input
                  type="text"
                  value={bankAccount.branch}
                  onChange={(e) => setBankAccount({ ...bankAccount, branch: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none"
                />
              </div>
            </div>
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
              className="px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 disabled:opacity-50 rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-2 transition"
            >
              <Send className="w-3.5 h-3.5" />
              {loading ? 'Đang gửi...' : 'Trình Duyệt Thanh Toán'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePaymentModal;
