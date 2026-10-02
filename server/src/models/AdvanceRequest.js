const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  path: { type: String, required: true },
}, { _id: false });

const advanceRequestSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  amount: { type: Number, required: true, min: 1 },
  recipientAccount: { type: String, required: true, trim: true },
  department: { type: String, required: true, trim: true },
  reason: { type: String, required: true, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['PENDING_CEO', 'PENDING_CHAIRMAN', 'PENDING_DISBURSEMENT', 'WAITING_SETTLEMENT', 'PENDING_SHORTFALL', 'PENDING_SURPLUS_CONFIRMATION', 'PENDING_EXACT_CONFIRMATION', 'COMPLETED', 'REJECTED'],
    default: 'PENDING_CEO',
  },
  approvals: {
    ceo: { user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, at: Date },
    chairman: { user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, at: Date },
  },
  initialDisbursement: {
    transactionCode: String,
    amount: Number,
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    paidAt: Date,
  },
  settlement: {
    type: { type: String, enum: ['SURPLUS', 'SHORTFALL', 'EXACT'] },
    amount: Number,
    attachments: { type: [attachmentSchema], default: [] },
    submittedAt: Date,
    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    confirmedAt: Date,
    transactionCode: String,
  },
  rejectionReason: { type: String, trim: true, default: '' },
}, { timestamps: true });

// Generate a readable identifier for each advance request.
advanceRequestSchema.pre('save', async function () {
  if (this.isNew && !this.code) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await mongoose.model('AdvanceRequest').countDocuments({ code: new RegExp(`^ADV-${date}`) });
    this.code = `ADV-${date}-${String(count + 1).padStart(4, '0')}`;
  }
});

module.exports = mongoose.model('AdvanceRequest', advanceRequestSchema);
