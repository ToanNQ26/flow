/**
 * ============================================================
 * SEED SCRIPT - FlowBuild ERP
 * Tạo sẵn 6 tài khoản mẫu tương ứng 6 vai trò RBAC để đăng nhập.
 *
 * Chạy: npm run seed   hoặc   node src/seed.js
 * ============================================================
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const User = require('./models/User');
const { ROLES, ROLE_LABELS } = require('./utils/constants');

const seedUsers = [
  {
    fullName: 'Nguyễn Văn Thi Công',
    email: 'thicong@flow.vn',
    password: '123456',
    role: ROLES.SITE_MANAGER,
    phone: '0901000001',
    permissions: 'Tạo yêu cầu cấp vật tư (Purchase Request)',
  },
  {
    fullName: 'Trần Thị Thu Mua',
    email: 'thumua@flow.vn',
    password: '123456',
    role: ROLES.PROCUREMENT,
    phone: '0901000002',
    permissions: 'Khảo sát báo giá NCC, Ký & Upload Hợp đồng',
  },
  {
    fullName: 'Lê Minh CEO',
    email: 'ceo@flow.vn',
    password: '123456',
    role: ROLES.CEO,
    phone: '0901000003',
    permissions: 'Duyệt PR, Duyệt NCC, Duyệt thanh toán (<50tr trực tiếp, >=50tr sơ bộ)',
  },
  {
    fullName: 'Phạm Hùng Chủ Tịch',
    email: 'chutich@flow.vn',
    password: '123456',
    role: ROLES.CHAIRMAN,
    phone: '0901000004',
    permissions: 'Duyệt NCC, Duyệt thanh toán bước cuối (hạn mức >=50tr)',
  },
  {
    fullName: 'Hoàng Lan Kế Toán',
    email: 'ketoan@flow.vn',
    password: '123456',
    role: ROLES.ACCOUNTANT,
    phone: '0901000005',
    permissions: 'Tiếp nhận HĐ, Lập đề xuất thanh toán & kiểm tra số dư',
  },
  {
    fullName: 'Đỗ Thanh Thủ Quỹ',
    email: 'thuquy@flow.vn',
    password: '123456',
    role: ROLES.TREASURER,
    phone: '0901000006',
    permissions: 'Chi tiền quỹ, Xuất Ủy nhiệm chi (UNC) và xác nhận PAID',
  },
];

const seed = async () => {
  try {
    await connectDB();

    // Xóa toàn bộ users cũ
    await User.deleteMany({});
    console.log('🗑️  Đã làm sạch dữ liệu người dùng cũ.');

    // Tạo users mới (qua save/create để kích hoạt bcrypt hash password)
    for (const u of seedUsers) {
      await User.create({
        fullName: u.fullName,
        email: u.email,
        password: u.password,
        role: u.role,
        phone: u.phone,
      });
    }

    console.log('\n=============================================================================================');
    console.log('🔐 DANH SÁCH 6 TÀI KHOẢN MẪU DÙNG ĐỂ ĐĂNG NHẬP (RBAC AUTHENTICATION)');
    console.log('=============================================================================================');
    console.log('┌──────────────────────┬─────────────────┬──────────┬─────────────────┬───────────────────────────────────────┐');
    console.log('│ Họ tên               │ Email           │ Mật khẩu │ Vai trò         │ Quyền hạn chính                       │');
    console.log('├──────────────────────┼─────────────────┼──────────┼─────────────────┼───────────────────────────────────────┤');

    for (const u of seedUsers) {
      const name = u.fullName.padEnd(20);
      const email = u.email.padEnd(15);
      const pass = '123456'.padEnd(8);
      const role = `${ROLE_LABELS[u.role]} (${u.role})`.padEnd(15);
      const perm = u.permissions.padEnd(37);
      console.log(`│ ${name} │ ${email} │ ${pass} │ ${role} │ ${perm} │`);
    }

    console.log('└──────────────────────┴─────────────────┴──────────┴─────────────────┴───────────────────────────────────────┘');
    console.log('\n📌 BẢO MẬT: Bắt buộc đăng nhập tại /login để nhận JWT Token. Không thể chuyển vai trò trực tiếp từ UI.');
    console.log('=============================================================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed lỗi:', error.message);
    process.exit(1);
  }
};

seed();
