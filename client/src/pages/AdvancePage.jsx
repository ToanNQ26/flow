import { useCallback, useEffect, useState } from 'react';
import { Check, CircleDollarSign, FileUp, Plus, RefreshCw, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { advanceApi } from '../services/advanceApi';

const statusNames = {
  PENDING_CEO: 'Chờ giám đốc duyệt', PENDING_CHAIRMAN: 'Chờ chủ tịch duyệt',
  PENDING_DISBURSEMENT: 'Chờ kế toán giải ngân', WAITING_SETTLEMENT: 'Chờ hoàn tạm ứng',
  PENDING_SHORTFALL: 'Chờ giải ngân phần thiếu', PENDING_SURPLUS_CONFIRMATION: 'Chờ kế toán xác nhận tiền thừa', PENDING_EXACT_CONFIRMATION: 'Chờ kế toán xác nhận đã dùng hết',
  COMPLETED: 'Đã hoàn tất', REJECTED: 'Đã từ chối',
};
const money = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

export default function AdvancePage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ amount: '', recipientAccount: '', department: '', reason: '' });
  const [settlement, setSettlement] = useState({ id: '', type: 'SURPLUS', amount: '', files: [] });
  const [transaction, setTransaction] = useState({ id: '', code: '', amount: '' });

  const refresh = useCallback(async () => {
    try { const response = await advanceApi.getAll(); setRecords(response.data.data || []); }
    catch (err) { setError(err.response?.data?.message || 'Không tải được danh sách đơn.'); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const run = async (action) => {
    setBusy(true); setError('');
    try { await action(); await refresh(); }
    catch (err) { setError(err.response?.data?.message || 'Thao tác chưa thành công.'); }
    finally { setBusy(false); }
  };

  const submitRequest = (event) => {
    event.preventDefault();
    run(async () => { await advanceApi.create(form); setForm({ amount: '', recipientAccount: '', department: '', reason: '' }); });
  };
  const submitSettlement = (event) => {
    event.preventDefault();
    const data = new FormData();
    data.append('type', settlement.type); data.append('amount', settlement.amount);
    settlement.files.forEach(file => data.append('attachments', file));
    run(async () => { await advanceApi.submitSettlement(settlement.id, data); setSettlement({ id: '', type: 'SURPLUS', amount: '', files: [] }); });
  };

  const canCreate =  true;//['SITE_MANAGER', 'PROCUREMENT', 'ACCOUNTANT'].includes(user?.role);
  const canSettle = ['SITE_MANAGER', 'PROCUREMENT', 'ACCOUNTANT'].includes(user?.role);
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-sm font-semibold text-blue-700">TÀI CHÍNH / TẠM ỨNG</p><h1 className="mt-1 text-3xl font-extrabold text-slate-900">Đề xuất tạm ứng</h1><p className="mt-2 text-slate-500">Theo dõi phê duyệt, giải ngân và hoàn ứng trên một trang.</p></div>
        <button onClick={refresh} className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"><RefreshCw size={16}/> Làm mới</button>
      </div>
      <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/70 p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Quy trình tạm ứng</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <li className="rounded-xl border border-slate-200 bg-white p-4"><span className="text-xs font-bold text-blue-700">BƯỚC 1 · NGƯỜI ĐỀ XUẤT</span><p className="mt-1 text-sm text-slate-600">Tạo đơn với số tiền, tài khoản nhận, bộ phận và lý do. Đơn được gửi giám đốc duyệt.</p></li>
          <li className="rounded-xl border border-slate-200 bg-white p-4"><span className="text-xs font-bold text-blue-700">BƯỚC 2 · GIÁM ĐỐC</span><p className="mt-1 text-sm text-slate-600">Duyệt hoặc từ chối đơn. Nếu được duyệt, đơn chuyển tiếp cho chủ tịch.</p></li>
          <li className="rounded-xl border border-slate-200 bg-white p-4"><span className="text-xs font-bold text-blue-700">BƯỚC 3 · CHỦ TỊCH</span><p className="mt-1 text-sm text-slate-600">Duyệt hoặc từ chối đơn đã được giám đốc thông qua.</p></li>
          <li className="rounded-xl border border-slate-200 bg-white p-4"><span className="text-xs font-bold text-blue-700">BƯỚC 4 · KẾ TOÁN</span><p className="mt-1 text-sm text-slate-600">Giải ngân khoản tạm ứng và cập nhật mã giao dịch. Đơn chuyển sang chờ hoàn tạm ứng.</p></li>
          <li className="rounded-xl border border-slate-200 bg-white p-4"><span className="text-xs font-bold text-blue-700">BƯỚC 5 · NGƯỜI ĐỀ XUẤT</span><p className="mt-1 text-sm text-slate-600">Chọn đủ, thừa hoặc thiếu và gửi kèm chứng từ hoàn ứng.</p></li>
          <li className="rounded-xl border border-slate-200 bg-white p-4"><span className="text-xs font-bold text-blue-700">BƯỚC 6 · KẾ TOÁN</span><p className="mt-1 text-sm text-slate-600">Xác nhận đã nhận tiền thừa hoặc đơn đã dùng hết; nếu thiếu, giải ngân phần còn thiếu. Hoàn tất xử lý đơn.</p></li>
        </ol>
      </section>
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      {canCreate && <form onSubmit={submitRequest} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
        <div className="md:col-span-2"><h2 className="text-lg font-bold text-slate-900">Tạo đơn tạm ứng</h2><p className="text-sm text-slate-500">Đơn sẽ lần lượt chuyển giám đốc, chủ tịch rồi kế toán.</p></div>
        <label className="text-sm font-semibold text-slate-700">Số tiền tạm ứng<input required min="1" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" placeholder="Ví dụ: 5000000" /></label>
        <label className="text-sm font-semibold text-slate-700">Tài khoản nhận<input required value={form.recipientAccount} onChange={e => setForm({ ...form, recipientAccount: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" placeholder="Số tài khoản / tên ngân hàng" /></label>
        <label className="text-sm font-semibold text-slate-700">Bộ phận<input required value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" placeholder="Ví dụ: Thi công, Kế toán" /></label>
        <label className="text-sm font-semibold text-slate-700 md:col-span-2">Lý do tạm ứng<textarea required rows="3" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5" placeholder="Nêu mục đích sử dụng khoản tạm ứng" /></label>
        <button disabled={busy} className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 font-semibold text-white disabled:opacity-50"><Send size={17}/> Gửi giám đốc duyệt</button>
      </form>}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">Danh sách đơn <span className="text-sm font-medium text-slate-400">({records.length})</span></h2>
        {!records.length ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">Chưa có đơn tạm ứng.</div> : records.map(item => <article key={item._id} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-xs font-semibold text-slate-400">{item.code || item._id}</p><h3 className="mt-1 text-lg font-bold text-slate-900">{money(item.amount)}</h3><p className="mt-1 text-sm text-slate-600">{item.reason}</p><p className="mt-1 text-sm text-slate-500">Tài khoản nhận: {item.recipientAccount}</p><p className="mt-1 text-sm text-slate-500">Người đề xuất: {item.createdBy?.fullName || '—'} · Bộ phận: {item.department || '—'}</p></div><span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800">{statusNames[item.status] || item.status}</span></div>
          {item.status === 'PENDING_CEO' && user?.role === 'CEO' && <div className="flex gap-2"><button disabled={busy} onClick={() => run(() => advanceApi.approve(item._id, 'approve'))} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Duyệt</button><button disabled={busy} onClick={() => run(() => advanceApi.approve(item._id, 'reject', 'Không được phê duyệt'))} className="rounded-lg bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">Từ chối</button></div>}
          {item.status === 'PENDING_CHAIRMAN' && user?.role === 'CHAIRMAN' && <div className="flex gap-2"><button disabled={busy} onClick={() => run(() => advanceApi.approve(item._id, 'approve'))} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Duyệt</button><button disabled={busy} onClick={() => run(() => advanceApi.approve(item._id, 'reject', 'Không được phê duyệt'))} className="rounded-lg bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">Từ chối</button></div>}
          {item.status === 'PENDING_DISBURSEMENT' && user?.role === 'ACCOUNTANT' && <div className="flex flex-wrap gap-2"><input aria-label="Mã giao dịch" placeholder="Mã giao dịch" value={transaction.id === item._id ? transaction.code : ''} onChange={e => setTransaction({ ...transaction, id: item._id, code: e.target.value })} className="rounded-lg border px-3 py-2 text-sm"/><button disabled={busy} onClick={() => run(() => advanceApi.disburse(item._id, transaction.code))} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white"><CircleDollarSign size={16}/> Xác nhận giải ngân</button></div>}
          {item.status === 'WAITING_SETTLEMENT' && canSettle && <form onSubmit={submitSettlement} className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-4"><select required value={settlement.id === item._id ? settlement.type : 'SURPLUS'} onChange={e => setSettlement({ ...settlement, id: item._id, type: e.target.value })} className="rounded-lg border px-3 py-2 text-sm"><option value="EXACT">Đủ, đã sử dụng hết</option><option value="SURPLUS">Còn thừa</option><option value="SHORTFALL">Còn thiếu</option></select>{(settlement.id !== item._id || settlement.type !== 'EXACT') && <input required min="1" type="number" placeholder="Số tiền thừa / thiếu" value={settlement.id === item._id ? settlement.amount : ''} onChange={e => setSettlement({ ...settlement, id: item._id, amount: e.target.value })} className="rounded-lg border px-3 py-2 text-sm"/>}<input required type="file" multiple accept=".pdf,image/*" onChange={e => setSettlement({ ...settlement, id: item._id, files: Array.from(e.target.files || []) })} className="min-w-0 rounded-lg border bg-white px-2 py-2 text-xs"/><button disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"><FileUp size={16}/> Gửi hoàn ứng</button></form>}
          {item.status === 'PENDING_SHORTFALL' && user?.role === 'ACCOUNTANT' && <div className="flex flex-wrap items-center gap-2"><span className="text-sm text-slate-600">Cần giải ngân thêm {money(item.settlement?.amount)}</span><input aria-label="Mã giao dịch" placeholder="Mã giao dịch" value={transaction.id === item._id ? transaction.code : ''} onChange={e => setTransaction({ ...transaction, id: item._id, code: e.target.value })} className="rounded-lg border px-3 py-2 text-sm"/><button disabled={busy} onClick={() => run(() => advanceApi.disburse(item._id, transaction.code, item.settlement?.amount))} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Giải ngân phần thiếu</button></div>}
          {item.status === 'PENDING_SURPLUS_CONFIRMATION' && user?.role === 'ACCOUNTANT' && <button disabled={busy} onClick={() => run(() => advanceApi.confirmSurplus(item._id))} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"><Check size={16}/> Xác nhận đã nhận tiền thừa</button>}
          {item.status === 'PENDING_EXACT_CONFIRMATION' && user?.role === 'ACCOUNTANT' && <button disabled={busy} onClick={() => run(() => advanceApi.confirmSurplus(item._id))} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"><Check size={16}/> Xác nhận đã sử dụng hết</button>}
          {item.settlement?.attachments?.length > 0 && <div className="flex flex-wrap gap-2">{item.settlement.attachments.map(file => <a key={file.filename} href={file.path} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-700 underline">{file.originalName}</a>)}</div>}
        </article>)}
      </section>
    </div>
  );
}
