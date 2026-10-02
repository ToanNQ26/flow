const AdvanceRequest = require('../models/AdvanceRequest');

const sendError = (res, status, message) => res.status(status).json({ success: false, message });
const isRole = (req, role) => req.user?.role === role;

const list = async (req, res) => {
  try {
    // Applicants always see their own requests; approvers see requests awaiting their role.
    const approvableStatuses = {
      CEO: ['PENDING_CEO'],
      CHAIRMAN: ['PENDING_CHAIRMAN'],
      ACCOUNTANT: ['PENDING_DISBURSEMENT', 'PENDING_SHORTFALL', 'PENDING_SURPLUS_CONFIRMATION', 'PENDING_EXACT_CONFIRMATION'],
    }[req.user.role] || [];
    const records = await AdvanceRequest.find({
      $or: [
        { createdBy: req.user._id },
        ...(approvableStatuses.length ? [{ status: { $in: approvableStatuses } }] : []),
      ],
    }).populate('createdBy', 'fullName email role').sort({ createdAt: -1 });
    res.json({ success: true, data: records });
  } catch (error) { sendError(res, 500, error.message); }
};

const create = async (req, res) => {
  try {
    const { amount, recipientAccount, department, reason } = req.body;
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0 || !recipientAccount?.trim() || !department?.trim() || !reason?.trim()) {
      return sendError(res, 400, 'Vui lòng nhập số tiền, tài khoản nhận, bộ phận và lý do hợp lệ.');
    }
    const request = await AdvanceRequest.create({ amount: Number(amount), recipientAccount: recipientAccount.trim(), department: department.trim(), reason: reason.trim(), createdBy: req.user._id });
    await request.populate('createdBy', 'fullName email role');
    res.status(201).json({ success: true, data: request });
  } catch (error) { sendError(res, 400, error.message); }
};

const approve = async (req, res) => {
  try {
    const request = await AdvanceRequest.findById(req.params.id);
    if (!request) return sendError(res, 404, 'Không tìm thấy đơn tạm ứng.');
    const { action, rejectionReason = '' } = req.body;
    if (!['approve', 'reject'].includes(action)) return sendError(res, 400, 'Thao tác không hợp lệ.');
    if (isRole(req, 'CEO') && request.status === 'PENDING_CEO') {
      if (action === 'reject') { request.status = 'REJECTED'; request.rejectionReason = rejectionReason; }
      else { request.status = 'PENDING_CHAIRMAN'; request.approvals.ceo = { user: req.user._id, at: new Date() }; }
    } else if (isRole(req, 'CHAIRMAN') && request.status === 'PENDING_CHAIRMAN') {
      if (action === 'reject') { request.status = 'REJECTED'; request.rejectionReason = rejectionReason; }
      else { request.status = 'PENDING_DISBURSEMENT'; request.approvals.chairman = { user: req.user._id, at: new Date() }; }
    } else return sendError(res, 403, 'Bạn không thể duyệt đơn ở trạng thái hiện tại.');
    await request.save();
    res.json({ success: true, data: request });
  } catch (error) { sendError(res, 400, error.message); }
};

const disburse = async (req, res) => {
  try {
    const request = await AdvanceRequest.findById(req.params.id);
    if (!request) return sendError(res, 404, 'Không tìm thấy đơn tạm ứng.');
    if (!isRole(req, 'ACCOUNTANT')) return sendError(res, 403, 'Chỉ kế toán được xác nhận giải ngân.');
    const { transactionCode = '', amount } = req.body;
    if (!transactionCode.trim()) return sendError(res, 400, 'Vui lòng nhập mã giao dịch.');
    if (request.status === 'PENDING_DISBURSEMENT') {
      request.initialDisbursement = { transactionCode: transactionCode.trim(), amount: request.amount, paidBy: req.user._id, paidAt: new Date() };
      request.status = 'WAITING_SETTLEMENT';
    } else if (request.status === 'PENDING_SHORTFALL') {
      request.settlement.transactionCode = transactionCode.trim();
      request.settlement.amount = Number(amount);
      request.amount += Number(amount);
      request.status = 'COMPLETED';
    } else return sendError(res, 400, 'Đơn không ở trạng thái chờ giải ngân.');
    await request.save();
    res.json({ success: true, data: request });
  } catch (error) { sendError(res, 400, error.message); }
};

const submitSettlement = async (req, res) => {
  try {
    const request = await AdvanceRequest.findById(req.params.id);
    if (!request) return sendError(res, 404, 'Không tìm thấy đơn tạm ứng.');
    if (request.status !== 'WAITING_SETTLEMENT' || !['SURPLUS', 'SHORTFALL', 'EXACT'].includes(req.body.type)) return sendError(res, 400, 'Trạng thái hoặc loại hoàn ứng không hợp lệ.');
    const isExact = req.body.type === 'EXACT';
    if (!req.files?.length) return sendError(res, 400, 'Vui lòng đính kèm chứng từ hoàn ứng.');
    const amount = isExact ? 0 : Number(req.body.amount);
    if (!isExact && (!Number.isFinite(amount) || amount <= 0)) return sendError(res, 400, 'Số tiền hoàn ứng phải lớn hơn 0.');
    request.settlement = {
      type: req.body.type,
      amount,
      submittedAt: new Date(),
      attachments: req.files.map(file => ({ filename: file.filename, originalName: file.originalname, path: `/uploads/${file.filename}` })),
    };
    request.status = req.body.type === 'SHORTFALL' ? 'PENDING_SHORTFALL' : req.body.type === 'SURPLUS' ? 'PENDING_SURPLUS_CONFIRMATION' : 'PENDING_EXACT_CONFIRMATION';
    await request.save();
    res.json({ success: true, data: request });
  } catch (error) { sendError(res, 400, error.message); }
};

const confirmSurplus = async (req, res) => {
  try {
    const request = await AdvanceRequest.findById(req.params.id);
    if (!request) return sendError(res, 404, 'Không tìm thấy đơn tạm ứng.');
    if (!isRole(req, 'ACCOUNTANT') || !['PENDING_SURPLUS_CONFIRMATION', 'PENDING_EXACT_CONFIRMATION'].includes(request.status)) return sendError(res, 403, 'Không thể xác nhận hoàn tạm ứng.');
    request.settlement.confirmedBy = req.user._id;
    request.settlement.confirmedAt = new Date();
    request.status = 'COMPLETED';
    await request.save();
    res.json({ success: true, data: request });
  } catch (error) { sendError(res, 400, error.message); }
};

module.exports = { list, create, approve, disburse, submitSettlement, confirmSurplus };
