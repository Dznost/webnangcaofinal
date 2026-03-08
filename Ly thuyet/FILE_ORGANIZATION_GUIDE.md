# HƯỚNG DẪN TỔ CHỨC TỆP - Cấu Trúc & Vị Trí Tất Cả Tài Liệu

> Tài liệu này giải thích vị trí của mỗi tệp markdown và cách tìm kiếm chúng một cách hiệu quả.

---

## CẤUTRÚC THỰC THƯ MỤC HIỆN TẠI

```
nhà-hàng/
├── models/                          # Các mô hình dữ liệu
│   ├── User.js
│   ├── Order.js
│   ├── Reservation.js
│   ├── Payment.js
│   ├── Branch.js
│   ├── Dish.js
│   └── ... (10 mô hình tổng cộng)
│
├── controllers/                     # Logic xử lý ứng dụng
│   ├── userController.js
│   ├── orderController.js
│   ├── receptionController.js
│   └── ... (12 controllers)
│
├── routes/                          # Định nghĩa đường dẫn
│   ├── admin.js
│   ├── public.js
│   ├── auth.js
│   └── admin/ (admin/*, reception.js, ...)
│
├── views/                           # Giao diện người dùng (EJS templates)
│   ├── admin/
│   ├── public/
│   └── user/
│
├── scripts/                         # Tệp kịch bản thực thi
│   ├── database-final-update.js     ⭐ Cập nhật cơ sở dữ liệu (655 dòng)
│   ├── triggers-and-procedures.js   ⭐ Triggers & Stored Procedures (448 dòng)
│   └── ... (các tệp seed data khác)
│
├── public/                          # Tệp CSS, images, JavaScript
│   ├── css/style.css
│   └── ...
│
└── ⭐ CÁC TỆP MARKDOWN THAM CHIẾU (gốc của dự án)
    ├── COMPREHENSIVE_SYSTEM_MAP.md  ⭐⭐⭐ BẢN ĐỒ CHÍNH
    │
    ├── 📦 DATABASE DOCUMENTATION (Tài liệu Cơ Sở Dữ Liệu)
    │   ├── DATABASE_FINAL_GUIDE.md
    │   ├── DATABASE_INTEGRITY_GUIDE.md
    │   ├── DATABASE_OPERATIONS_GUIDE.md
    │   ├── DATABASE_QUICK_REFERENCE.md
    │   ├── DATABASE_UI_SYNC.md
    │   └── DATABASE_UPDATE_SUMMARY.md
    │
    ├── 📦 SCRIPTS & IMPLEMENTATION
    │   ├── database-final-update.js (trong /scripts)
    │   └── triggers-and-procedures.js (trong /scripts)
    │
    ├── 📦 SYSTEM DOCUMENTATION (Tài liệu Hệ Thống)
    │   ├── CONCEPTUAL_MAP_SUMMARY.md
    │   ├── IMPLEMENTATION_SUMMARY.md
    │   ├── LATEST_UPDATES_CHECKLIST.md
    │   ├── SYSTEM_UPDATE_SUMMARY.md
    │   ├── SYSTEM_DATA_INDEX.md
    │   ├── SYSTEM_VERIFICATION_CHECKLIST.md
    │   └── PROJECT_OPTIMIZATION_SUMMARY.md
    │
    ├── 📦 ADMIN DOCUMENTATION (Tài liệu Quản Trị)
    │   ├── ADMIN_INTERFACE_OPTIMIZATION.md
    │   ├── ADMIN_UI_OPTIMIZATION_GUIDE.md
    │   └── ADMIN_SIDEBAR_FIX_SUMMARY.md
    │
    └── 📦 RECEPTIONIST DOCUMENTATION (Tài liệu Tiếp Tân)
        ├── RECEPTIONIST_IMPLEMENTATION.md
        ├── RECEPTIONIST_OPERATIONAL_GUIDE.md
        └── RECEPTION_RESERVATION_IMPLEMENTATION.md
```

---

## 📚 PHÂN LOẠI TỆP THEO MỤC ĐÍCH

### 🏢 TÀI LIỆU CƠ SỞ DỮ LIỆU (Database Documentation)

Các tệp này giải thích về dữ liệu, cấu trúc, và cách thao tác với cơ sở dữ liệu.

| Tệp | Dòng | Mục Đích | Khi Dùng |
|-----|------|---------|---------|
| `DATABASE_FINAL_GUIDE.md` | 497 | Hướng dẫn hoàn chỉnh về schema, trường, loại dữ liệu | Khi cần hiểu cấu trúc chi tiết |
| `DATABASE_INTEGRITY_GUIDE.md` | 616 | Ràng buộc, validation rules, hooks, tính toàn vẹn | Khi cần đảm bảo dữ liệu chính xác |
| `DATABASE_OPERATIONS_GUIDE.md` | 856 | Thao tác CRUD, truy vấn, lọc, aggregation | Khi cần biết cách thao tác dữ liệu |
| `DATABASE_QUICK_REFERENCE.md` | 260 | Bảng tra cứu nhanh, enum, status, queries | Khi cần tìm thông tin nhanh |
| `DATABASE_UI_SYNC.md` | 327 | Đồng bộ hóa giữa dữ liệu và giao diện | Khi UI không cập nhật đúng |
| `DATABASE_UPDATE_SUMMARY.md` | 221 | Tóm tắt cập nhật gần đây | Khi cần biết thay đổi mới |

### 🖥️ TÀI LIỆU HỆ THỐNG (System Documentation)

Các tệp này mô tả toàn bộ hệ thống, quy trình, và các kiểm tra.

| Tệp | Dòng | Mục Đích | Khi Dùng |
|-----|------|---------|---------|
| `CONCEPTUAL_MAP_SUMMARY.md` | 344 | Tóm tắt ngắn gọn bản đồ khái niệm | Khi cần hiểu nhanh tổng quan |
| `SYSTEM_UPDATE_SUMMARY.md` | 360 | Tóm tắt cập nhật hệ thống | Khi cần tổng quan cập nhật |
| `SYSTEM_VERIFICATION_CHECKLIST.md` | 627 | 10+ kịch bản kiểm tra toàn diện | Khi cần xác minh hệ thống hoạt động |
| `SYSTEM_DATA_INDEX.md` | 346 | Chỉ mục A-Z tất cả khái niệm | Khi cần tìm kiếm từ khóa |
| `IMPLEMENTATION_SUMMARY.md` | 414 | Tóm tắt những gì đã triển khai | Khi cần biết tính năng đã làm |
| `LATEST_UPDATES_CHECKLIST.md` | 273 | Danh sách kiểm tra cập nhật | Khi kiểm tra có gì cần làm |

### 🎯 TÀI LIỆU QUẢN TRỊ (Admin Documentation)

Các tệp này hướng dẫn về giao diện và tính năng quản trị.

| Tệp | Mục Đích | Khi Dùng |
|-----|---------|---------|
| `ADMIN_INTERFACE_OPTIMIZATION.md` | Tối ưu hóa giao diện quản trị | Khi muốn cải thiện giao diện admin |
| `ADMIN_UI_OPTIMIZATION_GUIDE.md` | Hướng dẫn chi tiết về sắp xếp menu | Khi thay đổi bố cục admin |
| `ADMIN_SIDEBAR_FIX_SUMMARY.md` | Sửa lỗi liên kết thanh công cụ | Khi sidebar có lỗi |

### 👥 TÀI LIỆU TIẾP TÂN (Receptionist Documentation)

Các tệp này giải thích chức năng và quy trình tiếp tân.

| Tệp | Mục Đích | Khi Dùng |
|-----|---------|---------|
| `RECEPTIONIST_IMPLEMENTATION.md` | Triển khai chức năng tiếp tân | Khi cài đặt chức năng tiếp tân |
| `RECEPTIONIST_OPERATIONAL_GUIDE.md` | Quy trình vận hành tiếp tân | Khi huấn luyện tiếp tân |
| `RECEPTION_RESERVATION_IMPLEMENTATION.md` | Chi tiết quản lý đặt bàn | Khi xử lý đặt bàn |

### ⚙️ TỆP KỊCH BẢN (Scripts)

Các tệp JavaScript để thực thi thay đổi cơ sở dữ liệu.

| Tệp | Dòng | Mục Đích | Cách Dùng |
|-----|------|---------|----------|
| `scripts/database-final-update.js` | 655 | Cập nhật schema & validation | `node scripts/database-final-update.js` |
| `scripts/triggers-and-procedures.js` | 448 | Thực thi triggers & procedures | `node scripts/triggers-and-procedures.js` |

---

## 🔍 CÁCH TÌM KIẾM THÔNG TIN

### Phương Pháp 1: Tìm Theo Mục Đích

**Tôi muốn...** → **Xem tệp...**

- Hiểu tổng quan hệ thống → `COMPREHENSIVE_SYSTEM_MAP.md`
- Hiểu cấu trúc dữ liệu → `DATABASE_FINAL_GUIDE.md`
- Tìm truy vấn hoặc thao tác dữ liệu → `DATABASE_OPERATIONS_GUIDE.md`
- Đảm bảo dữ liệu không bị lỗi → `DATABASE_INTEGRITY_GUIDE.md`
- Tra cứu nhanh giá trị enum → `DATABASE_QUICK_REFERENCE.md`
- Quản lý tiếp tân → `RECEPTIONIST_OPERATIONAL_GUIDE.md`
- Tối ưu giao diện → `ADMIN_UI_OPTIMIZATION_GUIDE.md`
- Kiểm tra hệ thống → `SYSTEM_VERIFICATION_CHECKLIST.md`

### Phương Pháp 2: Tìm Theo Vai Trò

**Tôi là...** → **Đọc tệp...**

- **Nhà phát triển** → `COMPREHENSIVE_SYSTEM_MAP.md` + `DATABASE_FINAL_GUIDE.md` + `DATABASE_OPERATIONS_GUIDE.md`
- **Quản trị viên cơ sở dữ liệu** → `DATABASE_FINAL_GUIDE.md` + `DATABASE_INTEGRITY_GUIDE.md` + `scripts/database-final-update.js`
- **Nhà quản lý** → `SYSTEM_UPDATE_SUMMARY.md` + `IMPLEMENTATION_SUMMARY.md`
- **Tiếp tân** → `RECEPTIONIST_OPERATIONAL_GUIDE.md`
- **Admin hệ thống** → `ADMIN_UI_OPTIMIZATION_GUIDE.md` + `SYSTEM_VERIFICATION_CHECKLIST.md`

### Phương Pháp 3: Tìm Theo Loại Thông Tin

**Tôi cần biết...** → **Xem...**

- Các mô hình dữ liệu → Mục "Dữ Liệu" trong `COMPREHENSIVE_SYSTEM_MAP.md`
- Quy tắc kinh doanh → Mục "Quy Tắc" trong bất kỳ tệp nào
- Quy trình làm việc → `RECEPTIONIST_OPERATIONAL_GUIDE.md` hoặc `DATABASE_OPERATIONS_GUIDE.md`
- Lỗi hoặc vấn đề → `SYSTEM_VERIFICATION_CHECKLIST.md`
- Cập nhật gần đây → `DATABASE_UPDATE_SUMMARY.md` hoặc `LATEST_UPDATES_CHECKLIST.md`

---

## 📝 HƯỚNG DẪN CẢP NHẬT TỆP

### Khi Nào Cập Nhật Tệp?

1. **Thêm một mô hình dữ liệu mới** → Cập nhật `DATABASE_FINAL_GUIDE.md` + `COMPREHENSIVE_SYSTEM_MAP.md`
2. **Thêm một quy tắc kinh doanh** → Cập nhật `DATABASE_INTEGRITY_GUIDE.md` + `CONCEPTUAL_MAP_SUMMARY.md`
3. **Thêm một tính năng mới** → Cập nhật `IMPLEMENTATION_SUMMARY.md` + `LATEST_UPDATES_CHECKLIST.md`
4. **Sửa một lỗi** → Cập nhật `SYSTEM_VERIFICATION_CHECKLIST.md` + `DATABASE_UPDATE_SUMMARY.md`

### Trật Tự Ưu Tiên Cập Nhật

1. **COMPREHENSIVE_SYSTEM_MAP.md** ⭐⭐⭐ (Chính)
2. **DATABASE_FINAL_GUIDE.md** (Nếu thay đổi schema)
3. **DATABASE_OPERATIONS_GUIDE.md** (Nếu thay đổi truy vấn)
4. **RECEPTIONIST_OPERATIONAL_GUIDE.md** (Nếu thay đổi quy trình)
5. **Các tệp khác** (Cập nhật theo cần)

---

## ✅ DANH SÁCH KIỂM TRA NHANH

- [ ] Tôi đã đọc `COMPREHENSIVE_SYSTEM_MAP.md` để hiểu tổng quan?
- [ ] Tôi đã kiểm tra `DATABASE_FINAL_GUIDE.md` để biết cấu trúc dữ liệu?
- [ ] Tôi đã xem `DATABASE_OPERATIONS_GUIDE.md` để biết cách thao tác?
- [ ] Tôi đã chạy `scripts/database-final-update.js` để cập nhật?
- [ ] Tôi đã chạy `scripts/triggers-and-procedures.js` để kích hoạt triggers?
- [ ] Tôi đã xem `SYSTEM_VERIFICATION_CHECKLIST.md` để xác minh?

---

**Ghi chú**: Mỗi tệp được thiết kế để độc lập nhưng có liên kết chéo với nhau. Bắt đầu bằng `COMPREHENSIVE_SYSTEM_MAP.md` nếu bạn là người mới.

**Cập nhật lần cuối**: Tháng 3, 2026  
**Phiên bản**: 2.0 Final
