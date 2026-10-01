export const ROLES = {
  SITE_MANAGER: 'SITE_MANAGER',
  PROCUREMENT: 'PROCUREMENT',
  CEO: 'CEO',
  CHAIRMAN: 'CHAIRMAN',
  ACCOUNTANT: 'ACCOUNTANT',
  TREASURER: 'TREASURER',
};

export const ROLE_CONFIG = {
  [ROLES.SITE_MANAGER]: {
    label: 'Trưởng thi công',
    email: 'thicong@flow.vn',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badge: 'bg-emerald-500',
    description: 'Tạo yêu cầu cấp vật tư',
  },
  [ROLES.PROCUREMENT]: {
    label: 'Thu mua',
    email: 'thumua@flow.vn',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    badge: 'bg-blue-500',
    description: 'Khảo sát NCC & Ký hợp đồng',
  },
  [ROLES.CEO]: {
    label: 'Giám đốc (CEO)',
    email: 'ceo@flow.vn',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    badge: 'bg-purple-500',
    description: 'Duyệt PR, NCC & Đề xuất TT (<50tr)',
  },
  [ROLES.CHAIRMAN]: {
    label: 'Chủ tịch',
    email: 'chutich@flow.vn',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    badge: 'bg-rose-500',
    description: 'Duyệt NCC & Đề xuất TT (≥50tr)',
  },
  [ROLES.ACCOUNTANT]: {
    label: 'Kế toán',
    email: 'ketoan@flow.vn',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    badge: 'bg-amber-500',
    description: 'Lập đề xuất thanh toán theo HĐ',
  },
  [ROLES.TREASURER]: {
    label: 'Thủ quỹ',
    email: 'thuquy@flow.vn',
    color: 'bg-teal-50 text-teal-700 border-teal-200',
    badge: 'bg-teal-500',
    description: 'Chi tiền & Xác nhận UNC',
  },
};

export const STAGES = [
  { id: 'REQUEST', name: '1. Yêu cầu vật tư', role: 'SITE_MANAGER', icon: 'ClipboardList' },
  { id: 'VENDOR', name: '2. Khảo sát NCC', role: 'PROCUREMENT', icon: 'Building2' },
  { id: 'CONTRACT', name: '3. Hợp đồng', role: 'PROCUREMENT', icon: 'FileText' },
  { id: 'PAYMENT', name: '4. Đề xuất TT', role: 'ACCOUNTANT', icon: 'Receipt' },
  { id: 'DISBURSE', name: '5. Chi quỹ', role: 'TREASURER', icon: 'CheckCircle2' },
];

export const STATUS_LABELS = {
  // PR
  DRAFT: { label: 'Bản nháp', color: 'bg-gray-100 text-gray-700' },
  PENDING_CEO_APPROVAL: { label: 'Chờ CEO duyệt', color: 'bg-amber-100 text-amber-800 border border-amber-200' },
  APPROVED_BY_CEO: { label: 'CEO đã duyệt', color: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
  REJECTED: { label: 'Đã từ chối', color: 'bg-rose-100 text-rose-800 border border-rose-200' },
  
  // Vendor
  PENDING_APPROVAL: { label: 'Chờ duyệt NCC', color: 'bg-amber-100 text-amber-800 border border-amber-200' },
  APPROVED_BY_CHAIRMAN: { label: 'CT đã duyệt', color: 'bg-blue-100 text-blue-800 border border-blue-200' },
  VENDOR_APPROVED: { label: 'Đã duyệt NCC', color: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
  
  // Contract
  UPLOADED: { label: 'Đã upload HĐ', color: 'bg-blue-100 text-blue-800 border border-blue-200' },
  HANDED_TO_ACCOUNTANT: { label: 'Đã giao Kế toán', color: 'bg-indigo-100 text-indigo-800 border border-indigo-200' },
  
  // Payment
  PENDING_CHAIRMAN: { label: 'Chờ Chủ tịch duyệt', color: 'bg-orange-100 text-orange-800 border border-orange-200' },
  WAITING_CHAIRMAN_APPROVAL: { label: 'Chờ Chủ tịch duyệt', color: 'bg-orange-100 text-orange-800 border border-orange-200' },
  APPROVED_READY_TO_PAY: { label: 'Sẵn sàng chi', color: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
  
  // Disbursement
  PAID: { label: 'Đã chi tiền', color: 'bg-teal-100 text-teal-800 border border-teal-200' },
};

export const CHAIRMAN_APPROVAL_THRESHOLD = 50_000_000; // 50,000,000 VNĐ

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
