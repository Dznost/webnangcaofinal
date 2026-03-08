# BAO CAO DO AN

# XAY DUNG HE THONG QUAN LY NHA HANG SANG TRONG

---

## GIOI THIEU

### Y nghia de tai

Trong boi canh nganh dich vu am thuc ngay cang phat trien va canh tranh gay gat, viec ap dung cong nghe thong tin vao quan ly nha hang la mot xu huong tat yeu. Cac nha hang truyen thong phan lon van su dung cac phuong phap quan ly thu cong nhu ghi chep so sach, goi dien dat ban, tinh tien bang tay... dan den nhieu han che ve hieu suat, do chinh xac va trai nghiem khach hang.

Tren thi truong hien nay co nhieu he thong quan ly nha hang (POS) co san, tuy nhien cac he thong nay thuong duoc thiet ke theo mau chung, co the khong dap ung het cac nhu cau dac thu cua tung nha hang. Hon nua, viec su dung mot he thong tu xay dung giup nha hang nam quyen kiem soat hoan toan du lieu va tuy chinh theo nghiep vu rieng.

Tom lai, mot he thong quan ly nha hang tich hop website la huong di phu hop voi xu huong so hoa, dong thoi tao co hoi tot de nhom duoc thuc hanh cac kien thuc va ky nang lap trinh web full-stack. Do do, chung toi chon **"Xay dung he thong quan ly Nha Hang Sang Trong"** lam de tai cua minh.

### Muc tieu de tai

- Phan tich cac yeu cau cua doanh nghiep (Nha hang sang trong voi nhieu chi nhanh).
- Thiet ke du lieu phu hop voi yeu cau cua doanh nghiep.
- Thiet ke xu ly phu hop voi yeu cau cua doanh nghiep.
- Xay dung co so du lieu va trang web dua tren cac thiet ke.

---

## Chuong 1: KHAO SAT HIEN TRANG VA XAC DINH YEU CAU

### 1.1 Khao sat nghiep vu

#### 1.1.1 Quan ly thuc don (Mon an)

Nha hang co nhieu loai mon an duoc phan thanh 4 danh muc chinh: Khai Vi (appetizer), Mon Chinh (main), Trang Mieng (dessert) va Do Uong (beverage). Moi mon an co the co chuong trinh giam gia rieng va duoc lien ket voi cac su kien khuyen mai.

**Quy trinh quan ly mon an:**
1. Admin tao mon an moi voi thong tin: ten, mo ta, gia, hinh anh, danh muc, giam gia.
2. Admin co the cap nhat trang thai kha dung (available/unavailable) cua mon an.
3. Mon an duoc gan vao cac chi nhanh cu the de quan ly thuc don tung chi nhanh.
4. Khach hang co the xem thuc don, tim kiem va loc theo danh muc.

**Quy dinh quan ly mon an:**
- Moi mon an phai thuoc mot trong 4 danh muc: appetizer, main, dessert, beverage.
- Gia mon an phai lon hon 0.
- Giam gia nam trong khoang 0% - 100%.

#### 1.1.2 Quan ly chi nhanh

Nha hang hoat dong theo mo hinh chuoi voi nhieu chi nhanh. Moi chi nhanh co dia chi, so dien thoai, gio mo cua, so ban rieng va danh sach mon an phuc vu.

**Quy trinh quan ly chi nhanh:**
1. Admin tao chi nhanh moi voi thong tin: ten, dia chi, SDT, email, gio mo cua, mo ta, so ban.
2. Admin gan cac mon an co san tai chi nhanh.
3. He thong tu dong quan ly so ban trong khi khach dat ban hoac dat don dine-in.

**Quy dinh quan ly chi nhanh:**
- Moi chi nhanh co so ban tong cong (totalTables) va so ban con trong (availableTables).
- Khi khach dat ban hoac dat don dine-in, so ban trong giam di 1.
- Chi nhanh khong nhan dat ban khi het ban trong.

#### 1.1.3 Dang ky tai khoan va Dang nhap

Khach hang co the dang ky tai khoan de su dung cac chuc nang dat mon, dat ban, thanh toan. He thong ho tro 2 vai tro: User (khach hang) va Admin (quan tri vien).

**Quy trinh dang ky:**
1. Khach hang nhap thong tin: Ho ten, Email, Mat khau, Xac nhan mat khau.
2. He thong kiem tra email da ton tai chua.
3. He thong kiem tra mat khau va xac nhan mat khau co khop khong.
4. Mat khau duoc ma hoa bang bcrypt truoc khi luu vao database.
5. Tao session va chuyen huong ve trang chu.

**Quy trinh dang nhap:**
1. Khach hang nhap Email va Mat khau.
2. He thong tim user theo email trong database.
3. He thong so sanh mat khau da ma hoa.
4. Neu thanh cong: tao session voi thong tin user (id, name, email, role).
5. Chuyen huong: Admin -> /admin, User -> /.

**Quy dinh dang ky/dang nhap:**
- Email khong duoc trung lap (unique).
- Mat khau phai khop voi xac nhan mat khau.
- Mat khau duoc hash bang bcrypt voi salt rounds = 10.
- Session ton tai 7 ngay.

#### 1.1.4 Dat mon (Order)

Khach hang dang nhap co the dat mon an tu thuc don. He thong ho tro 2 hinh thuc: An tai nha hang (dine-in) va Mang di (takeaway).

**Quy trinh dat mon:**
1. Khach hang duyet thuc don va them mon vao gio hang (session-based cart).
2. Khach hang vao trang checkout, chon hinh thuc (dine-in/takeaway).
3. Neu dine-in: chon chi nhanh (chi hien chi nhanh co du mon trong gio hang), nhap so khach.
4. Neu takeaway: nhap dia chi giao hang.
5. Nhap thong tin lien he: ho ten, email, SDT, yeu cau dac biet.
6. Chon hinh thuc thanh toan: Tra truoc (prepaid) hoac COD.
7. He thong tinh tong tien, ap dung giam gia tu tung mon.
8. Tao don hang voi trang thai "pending".
9. Neu prepaid: chuyen den trang thanh toan.
10. Neu COD: chuyen ve trang profile voi thong bao thanh cong.

**Quy dinh dat mon:**
- Don hang tren 10,000,000 VND khong duoc chon COD, bat buoc chuyen khoan.
- Don hang tren 100,000,000 VND se tu dong thong bao cho Admin (tao Notification).
- Khi dat dine-in, so ban trong cua chi nhanh giam di 1.
- Chi hien chi nhanh co tat ca mon trong gio hang.
- Gio hang luu trong session, mat khi dang xuat.

#### 1.1.5 Dat ban (Reservation)

Khach hang co the dat ban truoc tai chi nhanh, kem theo dat mon truoc neu muon.

**Quy trinh dat ban:**
1. Khach hang chon chi nhanh, ngay, gio, so khach.
2. (Tuy chon) Chon cac mon an va so luong.
3. He thong kiem tra: chi nhanh con ban trong khong, ngay gio co hop le khong.
4. Tinh toan: tien coc co dinh 100,000 VND + tong tien mon an (da tru giam gia).
5. Tao reservation voi trang thai "pending".
6. Chuyen den trang thanh toan ngay (bat buoc thanh toan truoc khi xac nhan).

**Quy dinh dat ban:**
- Ngay gio dat ban phai lon hon thoi gian hien tai.
- Chi nhanh phai con ban trong (availableTables > 0).
- Tien coc co dinh la 100,000 VND.
- Bat buoc thanh toan truoc khi xac nhan dat ban.

#### 1.1.6 Thanh toan (Payment)

He thong ho tro 3 phuong thuc thanh toan: Chuyen khoan ngan hang (bank), MoMo, va Tien mat (cash/COD).

**Quy trinh thanh toan:**
1. He thong hien thi thong tin don hang/dat ban va tong tien.
2. Khach hang chon phuong thuc thanh toan.
3. Neu bank: he thong tao ma QR VietQR tu dong voi thong tin chuyen khoan.
4. Khach hang xac nhan da thanh toan.
5. He thong tao ban ghi Payment voi transactionId duy nhat.
6. Cap nhat trang thai don hang/dat ban thanh "paid".

**Quy dinh thanh toan:**
- Don hang > 10,000,000 VND: chi chap nhan chuyen khoan ngan hang.
- Moi thanh toan co transactionId duy nhat (format: TXN + timestamp + order ID cuoi).
- Thanh toan dat ban la bat buoc (khong co COD).

#### 1.1.7 Quan ly su kien khuyen mai (Event)

Admin co the tao cac su kien khuyen mai ap dung giam gia cho mon an hoac chi nhanh.

**Quy trinh quan ly su kien:**
1. Admin tao su kien: tieu de, mo ta, hinh anh, ty le giam gia, loai giam gia.
2. Chon loai giam gia: Khong (none), Theo chi nhanh (branch), Theo mon an (dish).
3. Gan cac mon an hoac chi nhanh duoc ap dung.
4. Dat thoi gian bat dau va ket thuc.
5. (Tuy chon) Danh dau la su kien toan he thong (isGlobal).

**Quy dinh su kien:**
- Loai giam gia (discountType): none, branch, dish.
- Su kien co the ap dung toan he thong (isGlobal = true).
- Su kien co thoi gian bat dau va ket thuc.

#### 1.1.8 Quan ly lien he (Contact)

Khach hang (ca khong dang nhap) co the gui phan hoi/lien he voi nha hang.

**Quy trinh lien he:**
1. Khach hang nhap ho ten, email, noi dung lien he.
2. He thong kiem tra rate limit: toi da 3 lan/gio moi nguoi.
3. Luu lien he voi trang thai "new".
4. Admin xem va tra loi lien he, cap nhat trang thai: new -> read -> replied.

**Quy dinh lien he:**
- Gioi han gui 3 phan hoi trong 1 gio (rate limiting).
- Trang thai lien he: new (moi), read (da doc), replied (da tra loi).

#### 1.1.9 Quan ly bai viet (Blog)

Admin co the dang cac bai viet/tin tuc ve nha hang.

**Quy trinh quan ly blog:**
1. Admin tao bai viet: tieu de, noi dung, hinh anh, tac gia.
2. Bai viet duoc hien thi cong khai tren trang Tin Tuc.
3. Khach hang co the xem danh sach va chi tiet bai viet.

#### 1.1.10 Thong bao don hang gia tri cao (Notification)

He thong tu dong thong bao cho Admin khi co don hang gia tri cao.

**Quy trinh thong bao:**
1. Khi don hang co gia tri > 100,000,000 VND, he thong tu dong tao Notification.
2. Notification chua: loai (large_order/large_reservation), so tien, thong tin khach hang, ghi chu dac biet.
3. Admin xem va xu ly thong bao, cap nhat trang thai: pending -> read -> resolved.

### 1.2 Yeu cau

#### 1.2.1 Yeu cau chuc nang

| STT | Chuc nang | Mo ta | Vai tro |
|-----|-----------|-------|---------|
| 1 | Dang ky | Tao tai khoan khach hang moi | Khach |
| 2 | Dang nhap | Xac thuc tai khoan de truy cap he thong | Khach, User, Admin |
| 3 | Dang xuat | Huy session dang nhap | User, Admin |
| 4 | Xem trang chu | Hien thi mon noi bat, su kien, chi nhanh | Tat ca |
| 5 | Xem thuc don | Duyet, tim kiem, loc mon an theo danh muc | Tat ca |
| 6 | Xem chi tiet mon an | Xem thong tin, gia, giam gia cua mon an | Tat ca |
| 7 | Xem chi nhanh | Xem danh sach va chi tiet chi nhanh | Tat ca |
| 8 | Xem su kien | Xem cac su kien khuyen mai | Tat ca |
| 9 | Xem tin tuc | Xem cac bai viet/blog | Tat ca |
| 10 | Xem trang gioi thieu | Xem thong tin ve nha hang | Tat ca |
| 11 | Gui lien he | Gui phan hoi/lien he voi nha hang | Tat ca |
| 12 | Them vao gio hang | Them mon an vao gio hang (session) | User |
| 13 | Quan ly gio hang | Xem, xoa mon trong gio hang | User |
| 14 | Dat mon (Checkout) | Tao don hang tu gio hang | User |
| 15 | Dat ban | Dat ban truoc tai chi nhanh | User |
| 16 | Thanh toan | Thanh toan don hang/dat ban | User |
| 17 | Xem don hang | Xem lich su don hang ca nhan | User |
| 18 | Xem profile | Xem thong tin ca nhan, don hang, dat ban | User |
| 19 | Quan ly mon an (CRUD) | Them, sua, xoa, xem mon an | Admin |
| 20 | Quan ly chi nhanh (CRUD) | Them, sua, xoa, xem chi nhanh | Admin |
| 21 | Quan ly su kien (CRUD) | Them, sua, xoa, xem su kien khuyen mai | Admin |
| 22 | Quan ly blog (CRUD) | Them, sua, xoa, xem bai viet | Admin |
| 23 | Quan ly don hang | Xem, cap nhat trang thai don hang | Admin |
| 24 | Quan ly dat ban | Xem, cap nhat trang thai dat ban | Admin |
| 25 | Quan ly nguoi dung | Xem, sua, xoa tai khoan nguoi dung | Admin |
| 26 | Quan ly lien he | Xem, tra loi phan hoi lien he | Admin |
| 27 | Thong ke doanh thu | Xem bao cao doanh thu theo thoi gian | Admin |
| 28 | Dashboard | Tong quan he thong: so don, doanh thu, nguoi dung | Admin |

#### 1.2.2 Yeu cau phi chuc nang

##### 1.2.2.1 Bao mat
- Dam bao tinh bao mat cua he thong voi nguoi ngoai he thong.
- Mat khau duoc ma hoa bang bcrypt (salt rounds = 10) truoc khi luu.
- Gioi han cac thong tin nguoi dung duoc truy cap theo vai tro (User/Admin).
- Gioi han cac giao tac nguoi dung co the thuc hien theo vai tro.
- Session-based authentication voi cookie ton tai 7 ngay.
- Rate limiting cho chuc nang gui lien he (3 lan/gio).

##### 1.2.2.2 Hieu suat
- Thoi gian phan hoi, thoi gian xu ly va thoi gian tra ket quai nhanh.
- Su dung MongoDB indexes cho cac truong tim kiem thuong xuyen (email, category).

##### 1.2.2.3 Tien dung
- Cung cap day du cac chuc nang ma nguoi dung yeu cau.
- Giao dien responsive, tuong thich mobile va desktop.
- De hoc cach su dung voi UI truc quan.
- Han che loi nhap lieu voi form validation.

##### 1.2.2.4 An toan
- Hoat dong on dinh, chinh xac.
- Co the khoi phuc he thong, khoi phuc du lieu sau cac su co (MongoDB replica set).

---

## Chuong 2: PHAN TICH - THIET KE DU LIEU

### 2.1 Phan tich yeu cau

#### 2.1.1 Luoc do Use Case - Chuc nang cong khai (Khach khong dang nhap)

**Actors:** Khach (Guest)

| Use Case | Mo ta |
|----------|-------|
| UC01: Xem trang chu | Xem mon noi bat, su kien, chi nhanh |
| UC02: Xem thuc don | Duyet, tim kiem, loc mon an theo danh muc |
| UC03: Xem chi tiet mon an | Xem thong tin chi tiet mon an |
| UC04: Xem chi nhanh | Xem danh sach va chi tiet chi nhanh |
| UC05: Xem su kien | Xem cac su kien khuyen mai |
| UC06: Xem tin tuc | Xem cac bai viet blog |
| UC07: Xem gioi thieu | Xem thong tin ve nha hang |
| UC08: Gui lien he | Gui phan hoi den nha hang |
| UC09: Dang ky | Tao tai khoan moi |
| UC10: Dang nhap | Xac thuc vao he thong |

#### 2.1.2 Luoc do Use Case - Chuc nang khach hang (User da dang nhap)

**Actors:** User (Khach hang da dang nhap)

| Use Case | Mo ta |
|----------|-------|
| UC11: Them vao gio hang | Them mon an vao gio hang |
| UC12: Quan ly gio hang | Xem, xoa mon trong gio hang |
| UC13: Dat mon (Checkout) | Tao don hang, chon dine-in/takeaway |
| UC14: Dat ban | Dat ban truoc tai chi nhanh, kem mon an |
| UC15: Thanh toan don hang | Thanh toan bang bank/momo/cash |
| UC16: Thanh toan dat ban | Thanh toan tien coc va mon an |
| UC17: Xem don hang | Xem lich su don hang ca nhan |
| UC18: Xem profile | Xem thong tin ca nhan |
| UC19: Dang xuat | Huy session dang nhap |

#### 2.1.3 Luoc do Use Case - Chuc nang quan tri (Admin)

**Actors:** Admin (Quan tri vien)

| Use Case | Mo ta |
|----------|-------|
| UC20: Dashboard | Tong quan he thong |
| UC21: CRUD Mon an | Them, sua, xoa, xem mon an |
| UC22: CRUD Chi nhanh | Them, sua, xoa, xem chi nhanh |
| UC23: CRUD Su kien | Them, sua, xoa, xem su kien khuyen mai |
| UC24: CRUD Blog | Them, sua, xoa, xem bai viet |
| UC25: Quan ly don hang | Xem, cap nhat trang thai don hang |
| UC26: Quan ly dat ban | Xem, cap nhat trang thai dat ban |
| UC27: Quan ly nguoi dung | Xem, sua, xoa tai khoan |
| UC28: Quan ly lien he | Xem, tra loi phan hoi |
| UC29: Thong ke doanh thu | Xem bao cao doanh thu |

### 2.2 Phan tich du lieu

#### 2.2.1 Mo hinh du lieu (MongoDB Collections)

He thong su dung MongoDB (NoSQL) voi 10 collections chinh:

```
USER (_id, name, email, password, phone, address, role, createdAt)
DISH (_id, name, description, price, image, category, discount, available, event, createdAt)
BRANCH (_id, name, address, phone, email, images, image, openingHours, description, totalTables, availableTables, dishes, createdAt)
ORDER (_id, userId, items[], orderType, branchId, guests, paymentTiming, totalPrice, discount, finalPrice, status, paymentStatus, paymentMethod, deliveryAddress, fullName, email, phone, specialRequests, paidAt, adminNotified, largeOrderNote, createdAt)
RESERVATION (_id, userId, branchId, date, time, guests, specialRequests, orderItems[], depositAmount, foodTotal, foodDiscount, totalAmount, status, paymentStatus, paymentMethod, paidAt, createdAt)
EVENT (_id, title, description, image, discount, discountType, dishes[], startDate, endDate, branches[], isGlobal, createdAt)
BLOG (_id, title, content, image, author, createdAt)
CONTACT (_id, name, email, message, status, reply, createdAt, updatedAt)
PAYMENT (_id, orderId, reservationId, userId, amount, discount, finalAmount, paymentMethod, status, qrCode, transactionId, paidAt, createdAt)
NOTIFICATION (_id, type, orderId, reservationId, userId, amount, message, userNote, status, createdAt)
```

#### 2.2.2 Chi tiet tung Collection

##### 2.2.2.1 USER

| Thuoc tinh | Kieu du lieu | Rang buoc / Mien gia tri |
|------------|-------------|--------------------------|
| _id | ObjectId | PRIMARY KEY (tu dong) |
| name | String | NOT NULL (required: true) |
| email | String | NOT NULL, UNIQUE |
| password | String | NOT NULL (hash bcrypt) |
| phone | String | |
| address | String | |
| role | String | enum: ["user", "admin"], default: "user" |
| createdAt | Date | default: Date.now |

##### 2.2.2.2 DISH

| Thuoc tinh | Kieu du lieu | Rang buoc / Mien gia tri |
|------------|-------------|--------------------------|
| _id | ObjectId | PRIMARY KEY |
| name | String | NOT NULL |
| description | String | |
| price | Number | NOT NULL |
| image | String | |
| category | String | NOT NULL, enum: ["appetizer", "main", "dessert", "beverage"] |
| discount | Number | default: 0, range: 0-100 |
| available | Boolean | default: true |
| event | ObjectId | FOREIGN KEY -> Event |
| createdAt | Date | default: Date.now |

##### 2.2.2.3 BRANCH

| Thuoc tinh | Kieu du lieu | Rang buoc / Mien gia tri |
|------------|-------------|--------------------------|
| _id | ObjectId | PRIMARY KEY |
| name | String | NOT NULL |
| address | String | NOT NULL |
| phone | String | |
| email | String | |
| images | [String] | Mang URL hinh anh |
| image | String | Hinh anh chinh |
| openingHours | String | |
| description | String | |
| totalTables | Number | default: 20 |
| availableTables | Number | default: 20 |
| dishes | [ObjectId] | FOREIGN KEY -> Dish[] |
| createdAt | Date | default: Date.now |

##### 2.2.2.4 ORDER

| Thuoc tinh | Kieu du lieu | Rang buoc / Mien gia tri |
|------------|-------------|--------------------------|
| _id | ObjectId | PRIMARY KEY |
| userId | ObjectId | NOT NULL, FOREIGN KEY -> User |
| items | Array | Mang {dishId, name, quantity, price, discount} |
| orderType | String | NOT NULL, enum: ["dine-in", "takeaway"] |
| branchId | ObjectId | FOREIGN KEY -> Branch (khi dine-in) |
| guests | Number | So khach (khi dine-in) |
| paymentTiming | String | enum: ["prepaid", "cod"], default: "prepaid" |
| totalPrice | Number | Tong gia truoc giam |
| discount | Number | default: 0, Tong giam gia |
| finalPrice | Number | Gia cuoi cung sau giam |
| status | String | enum: ["pending", "approved", "paid", "processing", "completed", "cancelled"], default: "pending" |
| paymentStatus | String | enum: ["unpaid", "paid"], default: "unpaid" |
| paymentMethod | String | |
| deliveryAddress | String | Dia chi giao (khi takeaway) |
| fullName | String | |
| email | String | |
| phone | String | |
| specialRequests | String | |
| paidAt | Date | |
| adminNotified | Boolean | default: false |
| largeOrderNote | String | Ghi chu cho don > 100M |
| createdAt | Date | default: Date.now |

##### 2.2.2.5 RESERVATION

| Thuoc tinh | Kieu du lieu | Rang buoc / Mien gia tri |
|------------|-------------|--------------------------|
| _id | ObjectId | PRIMARY KEY |
| userId | ObjectId | NOT NULL, FOREIGN KEY -> User |
| branchId | ObjectId | NOT NULL, FOREIGN KEY -> Branch |
| date | Date | NOT NULL |
| time | String | |
| guests | Number | NOT NULL |
| specialRequests | String | |
| orderItems | Array | Mang {dishId, name, quantity, price, discount} |
| depositAmount | Number | default: 0 (co dinh 100,000 VND) |
| foodTotal | Number | default: 0 |
| foodDiscount | Number | default: 0 |
| totalAmount | Number | default: 0 (deposit + food - discount) |
| status | String | enum: ["pending", "confirmed", "paid", "completed", "cancelled"], default: "pending" |
| paymentStatus | String | enum: ["unpaid", "paid"], default: "unpaid" |
| paymentMethod | String | |
| paidAt | Date | |
| createdAt | Date | default: Date.now |

##### 2.2.2.6 EVENT

| Thuoc tinh | Kieu du lieu | Rang buoc / Mien gia tri |
|------------|-------------|--------------------------|
| _id | ObjectId | PRIMARY KEY |
| title | String | NOT NULL |
| description | String | |
| image | String | |
| discount | Number | default: 0 |
| discountType | String | enum: ["none", "branch", "dish"], default: "none" |
| dishes | [ObjectId] | FOREIGN KEY -> Dish[] |
| startDate | Date | |
| endDate | Date | |
| branches | [ObjectId] | FOREIGN KEY -> Branch[] |
| isGlobal | Boolean | default: false |
| createdAt | Date | default: Date.now |

##### 2.2.2.7 BLOG

| Thuoc tinh | Kieu du lieu | Rang buoc / Mien gia tri |
|------------|-------------|--------------------------|
| _id | ObjectId | PRIMARY KEY |
| title | String | NOT NULL |
| content | String | |
| image | String | |
| author | String | |
| createdAt | Date | default: Date.now |

##### 2.2.2.8 CONTACT

| Thuoc tinh | Kieu du lieu | Rang buoc / Mien gia tri |
|------------|-------------|--------------------------|
| _id | ObjectId | PRIMARY KEY |
| name | String | NOT NULL |
| email | String | NOT NULL |
| message | String | NOT NULL |
| status | String | enum: ["new", "read", "replied"], default: "new" |
| reply | String | default: null |
| createdAt | Date | timestamps: true (tu dong) |
| updatedAt | Date | timestamps: true (tu dong) |

##### 2.2.2.9 PAYMENT

| Thuoc tinh | Kieu du lieu | Rang buoc / Mien gia tri |
|------------|-------------|--------------------------|
| _id | ObjectId | PRIMARY KEY |
| orderId | ObjectId | FOREIGN KEY -> Order |
| reservationId | ObjectId | FOREIGN KEY -> Reservation |
| userId | ObjectId | NOT NULL, FOREIGN KEY -> User |
| amount | Number | NOT NULL |
| discount | Number | default: 0 |
| finalAmount | Number | NOT NULL |
| paymentMethod | String | NOT NULL, enum: ["bank", "momo", "cash"] |
| status | String | enum: ["pending", "completed", "failed"], default: "pending" |
| qrCode | String | |
| transactionId | String | Duy nhat (TXN + timestamp + ID) |
| paidAt | Date | |
| createdAt | Date | default: Date.now |

##### 2.2.2.10 NOTIFICATION

| Thuoc tinh | Kieu du lieu | Rang buoc / Mien gia tri |
|------------|-------------|--------------------------|
| _id | ObjectId | PRIMARY KEY |
| type | String | NOT NULL, enum: ["large_order", "large_reservation", "general"] |
| orderId | ObjectId | FOREIGN KEY -> Order |
| reservationId | ObjectId | FOREIGN KEY -> Reservation |
| userId | ObjectId | NOT NULL, FOREIGN KEY -> User |
| amount | Number | NOT NULL |
| message | String | NOT NULL |
| userNote | String | |
| status | String | enum: ["pending", "read", "resolved"], default: "pending" |
| createdAt | Date | default: Date.now |

#### 2.2.3 Cac moi quan he (Relationships)

| Quan he | Mo ta | Kieu |
|---------|-------|------|
| User -> Order | Mot User co nhieu Order | 1:N |
| User -> Reservation | Mot User co nhieu Reservation | 1:N |
| User -> Payment | Mot User co nhieu Payment | 1:N |
| Branch -> Dish | Mot Branch co nhieu Dish (thong qua mang dishes) | M:N |
| Branch -> Reservation | Mot Branch co nhieu Reservation | 1:N |
| Order -> Payment | Mot Order co mot Payment | 1:1 |
| Reservation -> Payment | Mot Reservation co mot Payment | 1:1 |
| Event -> Dish | Mot Event ap dung nhieu Dish | M:N |
| Event -> Branch | Mot Event ap dung nhieu Branch | M:N |
| Dish -> Event | Mot Dish thuoc mot Event | N:1 |

### 2.3 Rang buoc toan ven

#### 2.3.1 R1: Email nguoi dung khong duoc trung
- **Boi canh:** USER
- **Bang tam anh huong:**

| | Them | Xoa | Sua |
|------|------|-----|-----|
| USER | + | - | + (email) |

#### 2.3.2 R2: Mat khau khong duoc de trong
- **Boi canh:** USER
- **Bang tam anh huong:**

| | Them | Xoa | Sua |
|------|------|-----|-----|
| USER | + | - | + (password) |

#### 2.3.3 R3: Vai tro tai khoan chi co gia tri "user" hoac "admin"
- **Boi canh:** USER
- **Bang tam anh huong:**

| | Them | Xoa | Sua |
|------|------|-----|-----|
| USER | + | - | + (role) |

#### 2.3.4 R4: Danh muc mon an chi co 4 gia tri
- **Boi canh:** DISH
- **Dieu kien:** category IN ("appetizer", "main", "dessert", "beverage")
- **Bang tam anh huong:**

| | Them | Xoa | Sua |
|------|------|-----|-----|
| DISH | + | - | + (category) |

#### 2.3.5 R5: Gia mon an phai lon hon 0
- **Boi canh:** DISH
- **Bang tam anh huong:**

| | Them | Xoa | Sua |
|------|------|-----|-----|
| DISH | + | - | + (price) |

#### 2.3.6 R6: So ban trong khong duoc vuot qua tong so ban
- **Boi canh:** BRANCH
- **Dieu kien:** availableTables <= totalTables AND availableTables >= 0
- **Bang tam anh huong:**

| | Them | Xoa | Sua |
|------|------|-----|-----|
| BRANCH | + | - | + (availableTables) |
| ORDER (dine-in) | + | - | - |
| RESERVATION | + | - | - |

#### 2.3.7 R7: Don hang tren 10 trieu khong duoc chon COD
- **Boi canh:** ORDER
- **Dieu kien:** Neu finalPrice > 10,000,000 thi paymentTiming != "cod"
- **Bang tam anh huong:**

| | Them | Xoa | Sua |
|------|------|-----|-----|
| ORDER | + | - | + (finalPrice, paymentTiming) |

#### 2.3.8 R8: Don hang tren 100 trieu phai thong bao Admin
- **Boi canh:** ORDER, NOTIFICATION
- **Dieu kien:** Neu finalPrice > 100,000,000 thi tao Notification va set adminNotified = true
- **Bang tam anh huong:**

| | Them | Xoa | Sua |
|------|------|-----|-----|
| ORDER | + | - | - |
| NOTIFICATION | + | - | - |

#### 2.3.9 R9: Ngay gio dat ban phai lon hon thoi gian hien tai
- **Boi canh:** RESERVATION
- **Bang tam anh huong:**

| | Them | Xoa | Sua |
|------|------|-----|-----|
| RESERVATION | + | - | + (date, time) |

#### 2.3.10 R10: Dat ban phai thanh toan truoc khi xac nhan
- **Boi canh:** RESERVATION
- **Dieu kien:** status chi chuyen tu "pending" sang "confirmed" khi paymentStatus = "paid"
- **Bang tam anh huong:**

| | Them | Xoa | Sua |
|------|------|-----|-----|
| RESERVATION | - | - | + (status, paymentStatus) |

#### 2.3.11 R11: Gioi han gui lien he 3 lan/gio
- **Boi canh:** CONTACT
- **Dieu kien:** Moi IP/session chi duoc gui toi da 3 lien he trong 1 gio
- **Bang tam anh huong:**

| | Them | Xoa | Sua |
|------|------|-----|-----|
| CONTACT | + | - | - |

#### 2.3.12 R12: Trang thai don hang phai tuan theo luong
- **Boi canh:** ORDER
- **Dieu kien:** pending -> approved -> paid -> processing -> completed (hoac cancelled bat ky luc nao)
- **Bang tam anh huong:**

| | Them | Xoa | Sua |
|------|------|-----|-----|
| ORDER | - | - | + (status) |

#### 2.3.13 R13: TransactionId cua Payment phai duy nhat
- **Boi canh:** PAYMENT
- **Dieu kien:** Moi Payment co transactionId duy nhat (format TXN + timestamp + ID)
- **Bang tam anh huong:**

| | Them | Xoa | Sua |
|------|------|-----|-----|
| PAYMENT | + | - | - |

---

## Chuong 3: THIET KE XU LY

### 3.1 Kien truc he thong

He thong su dung kien truc **MVC (Model - View - Controller)**:

```
Client (Browser)
    |
    v
[Express.js Server] --- [Session Store (Memory)]
    |
    +-- Routes (Dinh tuyen URL)
    |     +-- public.js (Trang cong khai)
    |     +-- auth.js (Xac thuc)
    |     +-- user.js (Chuc nang User)
    |     +-- admin/*.js (Chuc nang Admin)
    |
    +-- Controllers (Xu ly nghiep vu)
    |     +-- dishController.js
    |     +-- orderController.js
    |     +-- branchController.js
    |     +-- eventController.js
    |     +-- blogController.js
    |     +-- contactController.js
    |     +-- reservationController.js
    |     +-- revenueController.js
    |     +-- userController.js
    |
    +-- Models (Mongoose Schema)
    |     +-- User.js, Dish.js, Branch.js, Order.js
    |     +-- Reservation.js, Event.js, Blog.js
    |     +-- Contact.js, Payment.js, Notification.js
    |
    +-- Views (EJS Templates)
    |     +-- layout.ejs (Layout chinh)
    |     +-- public/ (Trang cong khai)
    |     +-- user/ (Trang khach hang)
    |     +-- admin/ (Trang quan tri)
    |
    +-- Public (Static files)
          +-- css/style.css
          +-- images/
    |
    v
[MongoDB Atlas] (Co so du lieu Cloud)
```

### 3.2 Cau truc thu muc du an

```
restaurant-website/
|-- server.js                    # Entry point, cau hinh Express
|-- config/
|   |-- database.js              # Ket noi MongoDB
|-- models/                      # Mongoose schemas (10 models)
|   |-- User.js, Dish.js, Branch.js, Order.js
|   |-- Reservation.js, Event.js, Blog.js
|   |-- Contact.js, Payment.js, Notification.js
|-- controllers/                 # Business logic
|   |-- dishController.js, orderController.js
|   |-- branchController.js, eventController.js
|   |-- blogController.js, contactController.js
|   |-- reservationController.js, revenueController.js
|   |-- userController.js
|-- routes/                      # URL routing
|   |-- public.js                # GET /, /menu, /branches, /events, /blog, /contact
|   |-- auth.js                  # POST /auth/login, /auth/register, GET /auth/logout
|   |-- user.js                  # /user/cart, /user/order, /user/reservation, /user/payment
|   |-- admin/                   # /admin/*
|       |-- index.js, dishes.js, branches.js, events.js
|       |-- blog.js, orders.js, reservations.js
|       |-- users.js, contacts.js, revenue.js
|-- views/                       # EJS templates
|   |-- layout.ejs               # Layout chinh (navbar, footer)
|   |-- 404.ejs, error.ejs
|   |-- public/                  # Trang cong khai
|   |   |-- home/, menu/, branches/, events/
|   |   |-- blog/, about/, contact/, auth/
|   |-- user/                    # Trang khach hang
|   |   |-- profile/, cart/, checkout/
|   |   |-- payment/, reservation/, orders/
|   |-- admin/                   # Trang quan tri
|       |-- dashboard.ejs
|       |-- dishes/, branches/, events/
|       |-- blog/, orders/, reservations/
|       |-- users/, contacts/, revenue/
|-- public/                      # Static assets
|   |-- css/style.css
|   |-- images/
|-- scripts/
|   |-- seed-data.js             # Du lieu mau
|-- package.json
|-- vercel.json                  # Cau hinh deploy Vercel
```

### 3.3 Dac ta chi tiet cac Use Case

#### UC13: Dat mon (Checkout) - Luong chinh

**Actors:** User (Khach hang da dang nhap)
**Tien dieu kien:** User da dang nhap, gio hang co it nhat 1 mon.

**Luong chinh:**
1. User truy cap /user/checkout.
2. He thong lay gio hang tu session, tinh tong tien va giam gia.
3. He thong tim cac chi nhanh co du tat ca mon trong gio hang.
4. He thong kiem tra neu tong tien > 10,000,000 VND -> disable COD.
5. User chon orderType (dine-in/takeaway).
6. User nhap thong tin lien he (fullName, email, phone).
7. User chon paymentTiming (prepaid/cod).
8. User nhan "Dat Hang".
9. He thong validate du lieu dau vao.
10. He thong tao Order voi status = "pending".
11. Neu dine-in: giam availableTables cua branch.
12. Neu finalPrice > 100,000,000: tao Notification cho Admin.
13. Xoa gio hang trong session.
14. Neu prepaid: chuyen den /user/payment/order/:orderId.
15. Neu COD: chuyen den /user/profile voi thong bao thanh cong.

**Luong thay the:**
- 2a. Gio hang trong: chuyen ve /user/cart voi thong bao "Gio hang trong".
- 6a. Neu dine-in nhung khong chon chi nhanh: hien loi "Vui long chon chi nhanh".
- 6b. Neu chi nhanh het ban: hien loi "Khong con ban trong".
- 7a. Neu tong tien > 10,000,000 va chon COD: hien loi "Chi chap nhan chuyen khoan".

#### UC14: Dat ban (Reservation) - Luong chinh

**Actors:** User
**Tien dieu kien:** User da dang nhap.

**Luong chinh:**
1. User truy cap /user/reservation.
2. He thong hien thi form voi danh sach chi nhanh va mon an.
3. User chon chi nhanh, ngay, gio, so khach.
4. (Tuy chon) User chon mon an va so luong.
5. User nhan "Dat Ban".
6. He thong validate: ngay gio > hien tai, chi nhanh con ban.
7. He thong tinh: depositAmount (100,000) + foodTotal - foodDiscount = totalAmount.
8. Tao Reservation voi status = "pending".
9. Giam availableTables cua branch.
10. Chuyen den /user/payment/reservation/:reservationId.

**Luong thay the:**
- 6a. Ngay gio khong hop le: hien loi "Ngay gio phai lon hon hien tai".
- 6b. Chi nhanh khong ton tai: hien loi "Chi nhanh khong ton tai".
- 6c. Het ban: hien loi "Khong con ban trong tai chi nhanh nay".

#### UC15: Thanh toan (Payment) - Luong chinh

**Actors:** User
**Tien dieu kien:** Co don hang hoac dat ban chua thanh toan.

**Luong chinh:**
1. He thong hien thi thong tin don hang/dat ban va tong tien.
2. User chon phuong thuc: bank, momo, hoac cash.
3. Neu bank: he thong tao QR code VietQR tu dong.
4. User nhan "Xac Nhan Thanh Toan".
5. He thong tao Payment voi transactionId duy nhat.
6. Cap nhat Order/Reservation: paymentStatus = "paid", status cap nhat tuong ung.
7. Chuyen ve /user/profile voi thong bao "Thanh toan thanh cong".

**Luong thay the:**
- 1a. Don da thanh toan: chuyen ve profile voi loi "Da duoc thanh toan".
- 1b. Khong co quyen truy cap: hien loi 403.

### 3.4 Luong trang thai (State Flow)

#### Trang thai Don hang (Order):
```
pending -> approved -> paid -> processing -> completed
   |          |         |          |
   +----------+---------+----------+---> cancelled
```

#### Trang thai Dat ban (Reservation):
```
pending -> confirmed -> paid -> completed
   |          |          |
   +----------+----------+---> cancelled
```

#### Trang thai Thanh toan (Payment):
```
pending -> completed
   |
   +---> failed
```

#### Trang thai Lien he (Contact):
```
new -> read -> replied
```

#### Trang thai Thong bao (Notification):
```
pending -> read -> resolved
```

---

## Chuong 4: CONG NGHE SU DUNG

### 4.1 Backend

| Cong nghe | Phien ban | Muc dich |
|-----------|-----------|----------|
| Node.js | 18+ | Runtime JavaScript phia server |
| Express.js | ^4.18.2 | Web framework |
| MongoDB | 6.0+ | Co so du lieu NoSQL |
| Mongoose | ^7.0.0 | ODM (Object Document Mapping) |
| bcryptjs | ^2.4.3 | Ma hoa mat khau |
| express-session | ^1.17.3 | Quan ly session dang nhap |
| express-ejs-layouts | ^2.5.1 | Template layout system |
| dotenv | ^16.0.3 | Quan ly bien moi truong |

### 4.2 Frontend

| Cong nghe | Muc dich |
|-----------|----------|
| EJS (Embedded JavaScript) | Template engine render HTML phia server |
| CSS3 | Dinh dang giao dien, responsive design |
| Vanilla JavaScript | Xu ly tuong tac client-side |
| VietQR API | Tao ma QR thanh toan ngan hang |

### 4.3 Co so du lieu

| Cong nghe | Muc dich |
|-----------|----------|
| MongoDB Atlas | Database cloud hosting |
| Mongoose ODM | Schema validation, relationships, middleware |

### 4.4 Cong cu phat trien

| Cong cu | Muc dich |
|---------|----------|
| Nodemon | Tu dong restart server khi thay doi code |
| Git / GitHub | Quan ly phien ban ma nguon |
| VS Code | IDE phat trien |
| Vercel | Deploy va hosting production |

### 4.5 Bao mat

| Ky thuat | Mo ta |
|----------|-------|
| bcrypt (salt rounds = 10) | Hash mat khau truoc khi luu |
| Session-based Auth | Xac thuc bang session cookie (7 ngay) |
| Role-based Access Control | Phan quyen User/Admin |
| Rate Limiting | Gioi han gui lien he 3 lan/gio |
| Input Validation | Kiem tra du lieu dau vao (server-side) |
| Mongoose Schema Validation | Rang buoc du lieu o tang database |

---

## Chuong 5: TONG KET

### 5.1 Ket qua dat duoc
- Xay dung thanh cong he thong quan ly nha hang day du chuc nang voi 3 vai tro nguoi dung.
- Thiet ke 10 collections MongoDB voi cac moi quan he va rang buoc toan ven hop ly.
- Implement day du cac luong nghiep vu: dat mon, dat ban, thanh toan, khuyen mai.
- Giao dien responsive tuong thich ca desktop va mobile.
- He thong phan quyen ro rang giua Guest, User, va Admin.

### 5.2 Han che
- Session luu trong memory (mat khi restart server), chua dung persistent store nhu Redis/MongoDB Store.
- Upload hinh anh su dung URL thay vi file upload truc tiep.
- Chua co tinh nang real-time notification (WebSocket).
- Chua tich hop cong thanh toan thuc te (VNPay, Stripe...).

### 5.3 Huong phat trien
- Tich hop connect-mongo de luu session vao MongoDB.
- Tich hop cong thanh toan truc tuyen thuc te.
- Them tinh nang real-time thong bao bang Socket.IO.
- Them tinh nang danh gia/review mon an tu khach hang.
- Phat trien ung dung mobile React Native.
