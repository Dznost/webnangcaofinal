# HỆ THỐNG QUẢN LÝ NHÀ HÀNG - BẢN ĐỒ KHÁI NIỆM TOÀN DIỆN

> **Hướng dẫn Điều hướng**: Sử dụng mục lục dưới đây để nhanh chóng tìm kiếm thông tin cần thiết.

---

## MỤC LỤC CHÍNH

1. [Tổng Quan Hệ Thống](#tổng-quan)
2. [Bản Đồ Tệp Tài Liệu](#bản-đồ-tệp)
3. [Các Mô Hình Dữ Liệu](#mô-hình-dữ-liệu)
4. [Quy Tắc Kinh Doanh](#quy-tắc-kinh-doanh)
5. [Vai Trò Người Dùng](#vai-trò-người-dùng)
6. [Quy Trình Hoạt Động](#quy-trình-hoạt-động)
7. [Hướng Dẫn Nhanh](#hướng-dẫn-nhanh)

---

## TỔNG QUAN HỆ THỐNG {#tổng-quan}

### Kiến Trúc Nền Tảng
Nền tảng quản lý nhà hàng được xây dựng trên kiến trúc 3-lớp:
- **Lớp Trình Bày**: EJS Templates + Tailwind CSS
- **Lớp Ứng Dụng**: Express.js Controllers + Routes
- **Lớp Dữ Liệu**: MongoDB + Mongoose ODM

### Công Nghệ Sử Dụng
- Node.js + Express.js (backend)
- MongoDB (cơ sở dữ liệu)
- EJS + Tailwind CSS (frontend)
- Bcrypt (mã hóa mật khẩu)
- Express Session (quản lý phiên đăng nhập)

---

## BẢN ĐỒ TỆP TÀI LIỆU {#bản-đồ-tệp}

### 📁 THƯ MỤC DATABASE - Tài liệu Cơ Sở Dữ Liệu

#### 1. **COMPREHENSIVE_SYSTEM_MAP.md** ⭐ 
**Tác dụng**: Bản đồ khái niệm chính của toàn bộ hệ thống. Tài liệu này giải thích tất cả các khía cạnh của nền tảng bao gồm kiến trúc, mô hình dữ liệu, quy tắc kinh doanh, và quy trình làm việc.

#### 2. **DATABASE_FINAL_GUIDE.md**
**Tác dụng**: Hướng dẫn hoàn chỉnh về cơ sở dữ liệu. Cung cấp thông tin chi tiết về lược đồ cơ sở dữ liệu, các trường dữ liệu, loại dữ liệu, ràng buộc validation, và các chỉ mục (indexes). Sử dụng khi cần tìm hiểu cấu trúc cơ sở dữ liệu chi tiết.

#### 3. **DATABASE_INTEGRITY_GUIDE.md**
**Tác dụng**: Hướng dẫn về tính toàn vẹn dữ liệu. Giải thích tất cả các ràng buộc (constraints), quy tắc xác thực (validation rules), hooks (pre/post save), và cách dữ liệu được bảo vệ khỏi lỗi. Đảm bảo không có dữ liệu mất hoặc không nhất quán.

#### 4. **DATABASE_OPERATIONS_GUIDE.md**
**Tác dụng**: Hướng dẫn thao tác cơ sở dữ liệu. Liệt kê tất cả các lệnh CRUD (Create, Read, Update, Delete), truy vấn tìm kiếm, lọc dữ liệu, và cách các thao tác được thực hiện trong ứng dụng. Sử dụng khi cần tìm hiểu cách thao tác với dữ liệu.

#### 5. **DATABASE_QUICK_REFERENCE.md**
**Tác dụng**: Bảng tra cứu nhanh dạng bảng. Chứa các bảng tham khảo nhanh về trạng thái, giá trị enum, độ dài trường, và các truy vấn phổ biến. Sử dụng khi cần tìm thông tin nhanh.

#### 6. **DATABASE_UI_SYNC.md**
**Tác dụng**: Hướng dẫn đồng bộ hóa giao diện người dùng với cơ sở dữ liệu. Giải thích cách các thay đổi dữ liệu được phản ánh trong giao diện, khi nào cần cập nhật UI, và cách đảm bảo dữ liệu hiển thị chính xác.

#### 7. **DATABASE_UPDATE_SUMMARY.md**
**Tác dụng**: Tóm tắt các cập nhật cơ sở dữ liệu gần đây. Liệt kê những gì đã được thêm, sửa, hoặc xóa. Sử dụng khi cần biết những thay đổi nào đã được thực hiện gần đây.

---

### 📁 THƯ MỤC SCRIPTS - Các Tệp Kịch Bản Thực Thi

#### 8. **scripts/database-final-update.js** (655 dòng)
**Tác dụng**: Tệp kịch bản để cập nhật cơ sở dữ liệu cuối cùng. Chứa tất cả các định nghĩa schema, quy tắc xác thực (validation), và hooks. Có thể chạy trực tiếp để áp dụng tất cả các cập nhật cùng một lúc.

#### 9. **scripts/triggers-and-procedures.js** (448 dòng)
**Tác dụng**: Các trigger và stored procedure (thủ tục lưu trữ). Định nghĩa các quy trình tự động như:
- Tạo bản ghi thanh toán (Payment) khi xác nhận đơn hàng
- Cập nhật bàn có sẵn
- Gửi thông báo tự động
- Cập nhật doanh thu
- Kiểm tra tính toàn vẹn dữ liệu

---

### 📁 THƯ MỤC ADMIN - Tài liệu Quản Trị

#### 10. **ADMIN_INTERFACE_OPTIMIZATION.md**
**Tác dụng**: Hướng dẫn tối ưu hóa giao diện quản trị. Mô tả cách sắp xếp các phần quản lý (Quản lý kinh doanh, Sản phẩm, Nhân sự, Nội dung) để dễ sử dụng hơn.

#### 11. **ADMIN_UI_OPTIMIZATION_GUIDE.md**
**Tác dụng**: Hướng dẫn tối ưu hóa giao diện quản trị chi tiết. Cung cấp código CSS, layout, và cách tổ chức menu điều hướng theo nhóm logic.

#### 12. **ADMIN_SIDEBAR_FIX_SUMMARY.md**
**Tác dụng**: Tóm tắt các sửa lỗi thanh công cụ bên trái (sidebar). Giải thích cách khắc phục lỗi liên kết Blog và cải thiện thẩm mỹ giao diện.

---

### 📁 THƯ MỤC RECEPTIONIST - Tài liệu Tiếp Tân

#### 13. **RECEPTIONIST_IMPLEMENTATION.md**
**Tác dụng**: Hướng dẫn triển khai chức năng tiếp tân. Giải thích cách tiếp tân quản lý đơn đặt bàn theo chi nhánh, xác nhận đơn hàng, và tạo bản ghi thanh toán tự động.

#### 14. **RECEPTIONIST_OPERATIONAL_GUIDE.md**
**Tác dụng**: Hướng dẫn vận hành tiếp tân bước từng bước. Cung cấp quy trình cụ thể và ảnh chụp màn hình cho các tác vụ hàng ngày của tiếp tân.

#### 15. **RECEPTION_RESERVATION_IMPLEMENTATION.md**
**Tác dụng**: Hướng dẫn chi tiết về quản lý đặt bàn. Giải thích cách tiếp tân nhận, xác nhận, và quản lý đơn đặt bàn của khách hàng.

---

### 📁 THƯ MỤC HỆ THỐNG - Tài liệu Toàn Hệ Thống

#### 16. **CONCEPTUAL_MAP_SUMMARY.md**
**Tác dụng**: Tóm tắt bản đồ khái niệm. Là phiên bản rút gọn của COMPREHENSIVE_SYSTEM_MAP, dễ đọc và nhanh chóng để hiểu tổng quan hệ thống.

#### 17. **IMPLEMENTATION_SUMMARY.md**
**Tác dụng**: Tóm tắt triển khai toàn hệ thống. Liệt kê tất cả các tính năng đã triển khai, các cải thiện, và trạng thái hiện tại của dự án.

#### 18. **LATEST_UPDATES_CHECKLIST.md**
**Tác dụng**: Danh sách kiểm tra cập nhật mới nhất. Cung cấp danh sách các mục cần kiểm tra và xác minh rằng tất cả các cập nhật đã được áp dụng đúng cách.

#### 19. **SYSTEM_UPDATE_SUMMARY.md**
**Tác dụng**: Tóm tắt cập nhật hệ thống. Mô tả những thay đổi cuối cùng được thực hiện trong hệ thống, bao gồm các sửa lỗi và các tính năng mới.

#### 20. **SYSTEM_DATA_INDEX.md**
**Tác dụng**: Chỉ mục dữ liệu hệ th���ng. Danh sách A-Z toàn bộ các khái niệm, mô hình dữ liệu, và quy trình trong hệ thống, với các liên kết tham chiếu.

#### 21. **SYSTEM_VERIFICATION_CHECKLIST.md**
**Tác dụng**: Danh sách kiểm tra xác minh hệ thống. Cung cấp 10+ kịch bản kiểm tra toàn diện để xác nhận rằng tất cả các chức năng hoạt động đúng.

---

## MÔ HÌNH DỮ LIỆU {#mô-hình-dữ-liệu}

### 10 Bộ Sưu Tập (Collections) Chính

| Mô Hình | Mục Đích | Liên Kết |
|---------|---------|---------|
| **User** | Xác thực & Quản lý vai trò | Order, Reservation, Payment, Branch |
| **Branch** | Chi nhánh nhà hàng | User, Order, Reservation, Payment |
| **Dish** | Thực đơn & Sản phẩm | Order, Reservation |
| **Order** | Đơn hàng (takeaway/dine-in) | User, Dish, Payment, Branch |
| **Reservation** | Đặt bàn | User, Branch, Payment |
| **Payment** | Thanh toán & Doanh thu | Order, Reservation, User, Branch |
| **Branch** | Vị trí nhà hàng | User, Order, Reservation, Payment |
| **Notification** | Thông báo tự động | User |
| **Contact** | Liên hệ khách hàng | User |
| **Blog/Event** | Nội dung | Không liên kết khóa ngoại |

---

## QUY TẮC KINH DOANH {#quy-tắc-kinh-doanh}

### Quy Tắc Chính (35+ quy tắc)

**1. Quản Lý Đơn Hàng**
- Dine-in: Thanh toán bằng tiền mặt, tạo bản ghi thanh toán ngay lập tức
- Takeaway (Prepaid): Yêu cầu thanh toán trước khi vận chuyển
- Takeaway (COD): Shipper thu tiền, bản ghi thanh toán ở trạng thái "chờ"

**2. Quản Lý Đặt Bàn**
- Yêu cầu tiền cọc ban đầu (depositAmount)
- Tính tổng tiền = tiền cọc + (tổng món ăn - giảm giá)
- Tiếp tân phải xác nhận đơn bàn, tự động tạo bản ghi thanh toán

**3. Quản Lý Doanh Thu**
- Mỗi Order/Reservation tự động tạo bản ghi Payment
- Doanh thu theo dõi theo chi nhánh và nhân viên
- Báo cáo doanh thu phải khớp với tổng các bản ghi thanh toán

**4. Quản Lý Bàn**
- Mỗi chi nhánh có số bàn giới hạn
- Khi đặt bàn (dine-in), giảm số bàn có sẵn
- Khi hoàn thành, tăng số bàn có sẵn lại

**5. Kiểm Soát Truy Cập**
- Tiếp tân chỉ xem được đơn đặt bàn của chi nhánh mình
- Admin xem toàn bộ dữ liệu
- Nhân viên vận chuyển chỉ xem đơn giao của mình

---

## VAI TRÒ NGƯỜI DÙNG {#vai-trò-người-dùng}

### 6 Vai Trò & Quyền Hạn

| Vai Trò | Truy Cập | Quyền Hạn |
|---------|---------|----------|
| **Admin** | Toàn bộ | Tạo/Sửa/Xóa tất cả |
| **Người Dùng** | Cá nhân | Xem/Sửa đơn của mình |
| **Tiếp Tân** | Chi nhánh | Quản lý đơn/bàn của chi nhánh |
| **Nhân Viên** | Chi nhánh | Xử lý đơn tại chi nhánh |
| **Shipper** | Riêng | Quản lý giao hàng của mình |
| **Staff** | Chi nhánh | Hỗ trợ tại chi nhánh |

---

## QUY TRÌNH HOẠT ĐỘNG {#quy-trình-hoạt-động}

### Quy Trình 1: Đặt Hàng Online → Giao Hàng

```
1. Khách hàng → Tạo đơn hàng (Order)
2. Hệ thống → Lưu Order + Yêu cầu thanh toán (nếu prepaid)
3. Khách hàng → Thanh toán
4. Hệ thống → Tạo Payment + Gửi thông báo
5. Admin → Phân công Shipper
6. Shipper → Vận chuyển + Cập nhật trạng thái
7. Hệ thống → Cập nhật Revenue
```

### Quy Trình 2: Đặt Bàn → Ăn Tại Nhà Hàng

```
1. Khách hàng → Đặt bàn (Reservation)
2. Hệ thống → Lưu Reservation + Yêu cầu tiền cọc
3. Khách hàng → Thanh toán cọc
4. Tiếp tân → Xác nhận đơn
5. Hệ thống → Giảm số bàn + Tạo Payment
6. Khách hàng → Ăn tại nhà hàng
7. Tiếp tân → Hoàn thành + Tăng số bàn
8. Hệ thống → Cập nhật Revenue
```

---

## HƯỚNG DẪN NHANH {#hướng-dẫn-nhanh}

### 🔍 Tìm Thông Tin Cần Thiết

**Tôi cần biết...**
- ✓ Cấu trúc cơ sở dữ liệu → `DATABASE_FINAL_GUIDE.md`
- ✓ Cách thao tác dữ liệu → `DATABASE_OPERATIONS_GUIDE.md`
- ✓ Quy tắc xác thực → `DATABASE_INTEGRITY_GUIDE.md`
- ✓ Cách tiếp tân quản lý đơn → `RECEPTIONIST_OPERATIONAL_GUIDE.md`
- ✓ Giao diện quản trị → `ADMIN_UI_OPTIMIZATION_GUIDE.md`
- ✓ Thông tin nhanh → `DATABASE_QUICK_REFERENCE.md`
- ✓ Toàn bộ hệ thống → `COMPREHENSIVE_SYSTEM_MAP.md` (tài liệu này)

### 📋 Danh Sách Kiểm Tra

- [ ] Đọc `CONCEPTUAL_MAP_SUMMARY.md` để hiểu tổng quan
- [ ] Kiểm tra `DATABASE_FINAL_GUIDE.md` để biết cấu trúc dữ liệu
- [ ] Xem `SYSTEM_VERIFICATION_CHECKLIST.md` để xác minh hệ thống
- [ ] Áp dụng `scripts/database-final-update.js` để cập nhật cơ sở dữ liệu
- [ ] Chạy `scripts/triggers-and-procedures.js` để kích hoạt triggers

---

## LIÊN KẾT THAM CHIẾU

- **Kiến trúc hệ thống**: Xem mục "Tổng Quan Hệ Thống"
- **Dữ liệu**: Xem thư mục "Database"
- **Quản trị**: Xem thư mục "SYSTEM/Admin"
- **Tiếp tân**: Xem thư mục "SYSTEM/RECEPTIONIST"
- **Scripts**: Xem thư mục "scripts"

---

**Cập nhật lần cuối**: Tháng 3, 2026  
**Phiên bản**: 2.0 - Final Complete Update  
**Trạng thái**: Hoàn chỉnh & Sẵn sàng triển khai
