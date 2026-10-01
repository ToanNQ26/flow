import React, { useState } from 'react';
import { contractApi } from '../../services/api';
import { formatCurrency } from '../../utils/constants';
import { FileText, X, Upload, CheckCircle2, AlertTriangle, Send } from 'lucide-react';

const ContractUploadModal = ({ isOpen, onClose, vendorQuote, onSuccess }) => {
  const [totalValue, setTotalValue] = useState(
    vendorQuote?.vendors?.find((v) => v.isRecommended)?.quotedPrice || 0
  );
  const [note, setNote] = useState('Hợp đồng mua sắm vật tư đã ký kết hai bên');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !vendorQuote) return null;

  const recommendedVendor = vendorQuote.vendors?.find((v) => v.isRecommended);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!totalValue || totalValue <= 0) {
      setError('Giá trị hợp đồng phải lớn hơn 0');
      return;
    }
    if (files.length === 0) {
      setError('Vui lòng đính kèm ít nhất 1 file hợp đồng đã ký (PDF hoặc ảnh)');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('vendorQuoteId', vendorQuote._id);
      formData.append('totalValue', totalValue);
      formData.append('note', note.trim());
      files.forEach((f) => formData.append('files', f));

      const res = await contractApi.create(formData);
      const contractId = res.data.data._id;

      // Tự động chuyển giao luôn cho Kế toán để liền mạch quy trình
      await contractApi.handover(contractId);

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo hợp đồng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Upload & Bàn Giao Hợp Đồng Đã Ký</h3>
              <p className="text-xs text-slate-500">Dành cho bộ phận Thu mua</p>
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

          {/* NCC đã được duyệt */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1">
            <div className="text-blue-600 font-semibold text-[11px] uppercase tracking-wider">
              Nhà cung cấp đã được CEO & Chủ tịch phê duyệt:
            </div>
            <div className="font-bold text-slate-900 text-sm">
              {recommendedVendor?.vendorName || 'NCC'}
            </div>
            <div className="text-slate-600">
              Báo giá được duyệt: <strong className="text-blue-800">{formatCurrency(recommendedVendor?.quotedPrice)}</strong>
            </div>
          </div>

          {/* Giá trị hợp đồng */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Giá trị tổng hợp đồng (VNĐ) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              required
              min="1"
              value={totalValue}
              onChange={(e) => setTotalValue(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2 text-sm font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Đính kèm file hợp đồng đã ký (PDF / Ảnh) <span className="text-rose-500">*</span>
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-blue-500 transition cursor-pointer bg-slate-50/50">
              <input
                type="file"
                multiple
                accept=".pdf,image/*"
                onChange={handleFileChange}
                className="hidden"
                id="contract-file-input"
              />
              <label htmlFor="contract-file-input" className="cursor-pointer block">
                <Upload className="w-8 h-8 text-blue-500 mx-auto mb-1.5" />
                <span className="text-xs font-bold text-blue-600 hover:underline">
                  Bấm để chọn file
                </span>
                <span className="text-slate-500 text-[11px] block mt-0.5">
                  Định dạng PDF, JPG, PNG (Tối đa 10MB/file)
                </span>
              </label>
            </div>

            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                {files.map((f, i) => (
                  <div key={i} className="text-xs bg-slate-100 px-3 py-1.5 rounded-lg flex items-center justify-between text-slate-700 font-medium">
                    <span className="truncate max-w-[280px]">📄 {f.name}</span>
                    <span className="text-[11px] text-slate-400">{(f.size / 1024).toFixed(1)} KB</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Ghi chú hợp đồng
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Hợp đồng số 12/2026/HĐMB..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-500"
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
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition"
            >
              <Send className="w-3.5 h-3.5" />
              {loading ? 'Đang tải lên...' : 'Lưu & Bàn Giao Kế Toán'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContractUploadModal;
