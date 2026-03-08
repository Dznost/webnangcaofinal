const path = require("path")
const root = path.join(__dirname, "..")
const mongoose = require("mongoose")
const connectDB = require(path.join(root, "config/database"))
const User = require(path.join(root, "models/User"))
const Dish = require(path.join(root, "models/Dish"))
const Branch = require(path.join(root, "models/Branch"))
const Event = require(path.join(root, "models/Event"))
const Blog = require(path.join(root, "models/Blog"))
const Order = require(path.join(root, "models/Order"))
const Contact = require(path.join(root, "models/Contact"))
const Reservation = require(path.join(root, "models/Reservation"))
const Payment = require(path.join(root, "models/Payment"))

const seedData = async () => {
  try {
    await connectDB()
    console.log("✅ Ket noi MongoDB thanh cong")

    await User.deleteMany({})
    await Dish.deleteMany({})
    await Branch.deleteMany({})
    await Event.deleteMany({})
    await Blog.deleteMany({})
    await Order.deleteMany({})
    await Contact.deleteMany({})
    await Reservation.deleteMany({})
    await Payment.deleteMany({})
    console.log("✅ Xoa du lieu cu thanh cong")

    // ───── ADMIN ─────
    const admin = new User({
      name: "Quan Tri Vien",
      email: "admin@restaurant.com",
      password: "admin123",
      role: "admin",
      phone: "0123456789",
      address: "123 Duong Chinh, Thanh Pho",
    })
    await admin.save()
    console.log("✅ Tao tai khoan admin thanh cong")

    // ───── REGULAR USERS ─────
    const user1 = new User({
      name: "Nguyen Van A",
      email: "user1@restaurant.com",
      password: "user123",
      phone: "0901111111",
      address: "123 Duong Chinh, Thanh Pho",
      role: "user",
    })
    await user1.save()

    const user2 = new User({
      name: "Tran Thi B",
      email: "user2@restaurant.com",
      password: "user123",
      phone: "0902222222",
      address: "456 Duong Phu, Thanh Pho",
      role: "user",
    })
    await user2.save()

    const user3 = new User({
      name: "Le Minh C",
      email: "user3@restaurant.com",
      password: "user123",
      phone: "0903333333",
      address: "789 Duong So 3, Thanh Pho",
      role: "user",
    })
    await user3.save()
    console.log("✅ Tao tai khoan nguoi dung thanh cong")

    const dishes = [
      {
        name: "Phở Bò Hà Nội",
        description: "Phở bò truyền thống Hà Nội với nước dùng ngọt thanh từ xương bò nấu 12 tiếng, thịt bò tươi mềm",
        price: 85000,
        image: "https://images.unsplash.com/photo-1582878657360-e0173e9f440a?w=800&h=600&fit=crop",
        category: "main",
        discount: 10,
      },
      {
        name: "Gỏi Cuốn Tôm Thịt",
        description: "Gỏi cuốn tươi mát với tôm tươi, thịt heo nạc, bún tươi, rau thơm và nước chấm đặc biệt",
        price: 45000,
        image: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&h=600&fit=crop",
        category: "appetizer",
        discount: 0,
      },
      {
        name: "Cơm Tấm Sườn Nướng",
        description: "Cơm tấm dẻo thơm, sườn nướng tẩm ướp đặc biệt, trứng ốp la, chả trứng, bì",
        price: 65000,
        image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&h=600&fit=crop",
        category: "main",
        discount: 5,
      },
      {
        name: "Bánh Mì Thịt Nướng",
        description: "Bánh mì giòn tan với thịt nướng thơm lừng, pâté, rau sống, dưa chua, nước sốt đậm đà",
        price: 35000,
        image: "https://images.unsplash.com/photo-1619096252214-ef06c45683e3?w=800&h=600&fit=crop",
        category: "main",
        discount: 0,
      },
      {
        name: "Bún Chả Hà Nội",
        description: "Bún chả đặc sản Hà Nội với thịt nướng thơm, chả viên, nước mắm chua ngọt vừa vặn",
        price: 75000,
        image: "https://images.unsplash.com/photo-1569562298391-e4f8c172dddb?w=800&h=600&fit=crop",
        category: "main",
        discount: 8,
      },
      {
        name: "Chè Ba Màu",
        description: "Chè ba màu mát lạnh với đậu đỏ, đậu xanh, thạch rau câu, nước cốt dừa béo ngậy",
        price: 25000,
        image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&h=600&fit=crop",
        category: "beverage",
        discount: 0,
      },
      {
        name: "Tiramisu Ý",
        description: "Tiramisu ngon tuyệt vời với mascarpone mềm mịn, cacao đắng, bánh ladyfinger thấm cà phê",
        price: 55000,
        image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&h=600&fit=crop",
        category: "dessert",
        discount: 15,
      },
      {
        name: "Mực Nướng Muối Ớt",
        description: "Mực tươi nướng giòn tan với muối ớt xanh cay nồng, đặc trưng miền biển",
        price: 95000,
        image: "https://images.unsplash.com/photo-1580959375944-0b9e73fffeb0?w=800&h=600&fit=crop",
        category: "main",
        discount: 0,
      },
      {
        name: "Cánh Gà Chiên Nước Mắm",
        description: "Cánh gà chiên giòn rụm với nước mắm chua ngọt thơm lừng, lá chanh",
        price: 55000,
        image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=800&h=600&fit=crop",
        category: "appetizer",
        discount: 8,
      },
      {
        name: "Cà Phê Sữa Đá",
        description: "Cà phê phin truyền thống pha với sữa đặc, đá lạnh, thơm ngon đậm đà",
        price: 30000,
        image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&h=600&fit=crop",
        category: "beverage",
        discount: 0,
      },
      {
        name: "Lẩu Thái Hải Sản",
        description: "Lẩu Thái chua cay với tôm, mực, cá, nghêu, nấm, rau củ tươi ngon",
        price: 350000,
        image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&h=600&fit=crop",
        category: "main",
        discount: 12,
      },
      {
        name: "Bánh Flan Caramen",
        description: "Bánh flan mềm mịn với caramen đắng ngọt hài hòa, thơm mùi trứng sữa",
        price: 20000,
        image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&h=600&fit=crop",
        category: "dessert",
        discount: 0,
      },
    ]
    
    const createdDishes = await Dish.insertMany(dishes)
    console.log(`✅ Tạo ${createdDishes.length} món ăn thành công`)

    const branches = [
      {
        name: "Chi Nhánh Trung Tâm Quận 1",
        address: "123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
        phone: "0123456789",
        email: "q1@restaurant.com",
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=800&fit=crop",
        images: [
          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=800&h=600&fit=crop"
        ],
        openingHours: "10:00 - 23:00",
        description: "Chi nhánh chính tại trung tâm thành phố, không gian sang trọng, view đẹp, phục vụ tận tâm 24/7",
        totalTables: 30,
        availableTables: 30,
        dishes: [createdDishes[0]._id, createdDishes[1]._id, createdDishes[2]._id, createdDishes[3]._id, createdDishes[4]._id, createdDishes[6]._id, createdDishes[9]._id]
      },
      {
        name: "Chi Nhánh Phú Nhuận",
        address: "456 Phan Đăng Lưu, Phú Nhuận, TP. Hồ Chí Minh",
        phone: "0987654321",
        email: "phunhuan@restaurant.com",
        image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=800&fit=crop",
        images: [
          "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1592861956120-e524fc739696?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&h=600&fit=crop"
        ],
        openingHours: "09:00 - 22:30",
        description: "Chi nhánh rộng rãi với không gian xanh mát, thích hợp cho các buổi tiệc gia đình, sinh nhật",
        totalTables: 40,
        availableTables: 40,
        dishes: [createdDishes[0]._id, createdDishes[2]._id, createdDishes[4]._id, createdDishes[5]._id, createdDishes[7]._id, createdDishes[9]._id, createdDishes[10]._id]
      },
      {
        name: "Chi Nhánh Quận 2",
        address: "789 Đường Số 2, Thảo Điền, Quận 2, TP. Hồ Chí Minh",
        phone: "0912345678",
        email: "q2@restaurant.com",
        image: "https://images.unsplash.com/photo-1592861956120-e524fc739696?w=1200&h=800&fit=crop",
        images: [
          "https://images.unsplash.com/photo-1592861956120-e524fc739696?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800&h=600&fit=crop",
          "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&h=600&fit=crop"
        ],
        openingHours: "10:30 - 22:00",
        description: "Chi nhánh hiện đại tại khu dân cư cao cấp, view sông đẹp, menu đa dạng phong phú",
        totalTables: 25,
        availableTables: 25,
        dishes: [createdDishes[1]._id, createdDishes[3]._id, createdDishes[5]._id, createdDishes[6]._id, createdDishes[7]._id, createdDishes[9]._id, createdDishes[11]._id]
      },
    ]
    
    const createdBranches = await Branch.insertMany(branches)
    console.log(`✅ Tao ${createdBranches.length} chi nhanh thanh cong`)

    // ───── SHIPPER USERS (assigned to branches) ─────
    const shipper1 = new User({
      name: "Pham Van Shipper",
      email: "shipper1@restaurant.com",
      password: "shipper123",
      phone: "0911111111",
      address: "12 Nguyen Trai, Quan 1",
      role: "shipper",
      branchId: createdBranches[0]._id,
    })
    await shipper1.save()

    const shipper2 = new User({
      name: "Hoang Thi Ship",
      email: "shipper2@restaurant.com",
      password: "shipper123",
      phone: "0922222222",
      address: "34 Le Van Sy, Phu Nhuan",
      role: "shipper",
      branchId: createdBranches[1]._id,
    })
    await shipper2.save()
    console.log("✅ Tao tai khoan shipper thanh cong")

    // ───── STAFF USERS (assigned to branches) ─────
    const staff1 = new User({
      name: "Nguyen Thi Nhan Vien",
      email: "staff1@restaurant.com",
      password: "staff123",
      phone: "0933333333",
      address: "56 Phan Dinh Phung, Phu Nhuan",
      role: "staff",
      branchId: createdBranches[0]._id,
    })
    await staff1.save()

    const staff2 = new User({
      name: "Tran Van Phuc Vu",
      email: "staff2@restaurant.com",
      password: "staff123",
      phone: "0944444444",
      address: "78 Nguyen Dinh Chieu, Quan 3",
      role: "staff",
      branchId: createdBranches[1]._id,
    })
    await staff2.save()
    console.log("✅ Tao tai khoan nhan vien thanh cong")

    const events = [
      {
        title: "Khuyến Mãi Cuối Tuần - Giảm 20%",
        description: "Giảm giá 20% cho tất cả các món ăn vào cuối tuần (Thứ 7 - Chủ Nhật) tại chi nhánh Quận 1",
        image: "https://images.unsplash.com/photo-1555939594-58d7cb561404?w=1200&h=800&fit=crop",
        discount: 20,
        startDate: new Date("2025-01-25"),
        endDate: new Date("2025-12-31"),
        branch: createdBranches[0]._id
      },
      {
        title: "Lễ Khai Trương Chi Nhánh Quận 2",
        description: "Khai trương chi nhánh mới tại Quận 2 với nhiều ưu đãi đặc biệt, giảm giá 30% toàn bộ menu trong tuần đầu tiên",
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=800&fit=crop",
        discount: 30,
        startDate: new Date("2025-02-01"),
        endDate: new Date("2025-02-07"),
        branch: createdBranches[2]._id
      },
      {
        title: "Ưu Đãi Khách Hàng Thân Thiết",
        description: "Dành cho khách hàng đã đăng ký thành viên, giảm giá 15% mỗi lần đặt bàn tại tất cả chi nhánh",
        image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&h=800&fit=crop",
        discount: 15,
        startDate: new Date("2025-01-20"),
        endDate: new Date("2025-12-31"),
        branch: null // Áp dụng toàn hệ thống
      },
      {
        title: "Giảm Giá Mùa Hè - Chi Nhánh Phú Nhuận",
        description: "Chào mừng mùa hè với giảm giá 25% các món lẩu và hải sản tại chi nhánh Phú Nhuận",
        image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=1200&h=800&fit=crop",
        discount: 25,
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-08-31"),
        branch: createdBranches[1]._id
      },
    ]
    
    await Event.insertMany(events)
    console.log(`✅ Tao ${events.length} su kien thanh cong`)

    const blogs = [
      {
        title: "Lịch Sử Ẩm Thực Việt Nam Qua Các Thời Kỳ",
        content:
          "Ẩm thực Việt Nam có lịch sử lâu đời hơn 4000 năm, phát triển qua nhiều thế kỷ với ảnh hưởng từ văn hóa Hoa, Pháp và các nước láng giềng. Từ những món ăn dân gian đơn giản như cơm rang, canh chua đến những món ăn tinh tế của cung đình như chả phượng, bún thang, ẩm thực Việt luôn giữ được những đặc trưng riêng biệt. Mỗi vùng miền có những đặc sản riêng: miền Bắc thanh đạm, miền Trung cay nồng, miền Nam ngọt đậm, tất cả đều phản ánh văn hóa và lịch sử của từng nơi.",
        image: "https://images.unsplash.com/photo-1582878657360-e0173e9f440a?w=1200&h=800&fit=crop",
        author: "Nguyễn Văn B",
      },
      {
        title: "Bí Quyết Chọn Nguyên Liệu Tươi Ngon",
        content:
          "Để nấu ăn ngon, việc chọn nguyên liệu tươi là vô cùng quan trọng. Rau xanh nên chọn loại còn tươi, không bị héo úa, lá xanh mướt. Thịt heo nên có màu hồng tự nhiên, không có mùi lạ. Cá tươi có mắt sáng trong, vảy còn bóng, không bị đen. Tôm tươi có vỏ cứng, đầu không bị đen. Mua nguyên liệu từ những nơi uy tín, đảm bảo vệ sinh an toàn thực phẩm, tránh nguồn gốc không rõ ràng.",
        image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1200&h=800&fit=crop",
        author: "Trần Thị C",
      },
      {
        title: "Bí Quyết Nấu Phở Bò Ngon Như Hàng Quán",
        content:
          "Phở là một trong những món ăn đặc trưng nhất của Việt Nam, được UNESCO công nhận là di sản văn hóa phi vật thể. Bí quyết nấu phở ngon là nước dùng phải được nấu lâu từ xương ống, xương nạc bò ít nhất 12 tiếng, cho thêm gừng, hành, gia vị phải cân bằng (hồi, quế, thảo quả, hạt tiêu). Bánh phở phải mềm vừa phải, không bị nhão. Thịt bò phải thái mỏng, tái vừa. Hành hoa, rau thơm, giá sống phải tươi. Hãy thử nấu phở tại nhà với những bí quyết này để thưởng thức hương vị truyền thống.",
        image: "https://images.unsplash.com/photo-1582878657360-e0173e9f440a?w=1200&h=800&fit=crop",
        author: "Lê Văn D",
      },
      {
        title: "Top 10 Món Ăn Việt Nam Được Yêu Thích Nhất",
        content:
          "Ẩm thực Việt Nam đa dạng và phong phú với hàng ngàn món ăn đặc sắc. Top 10 món ăn được yêu thích nhất bao gồm: Phở bò/gà, Bún chả Hà Nội, Bánh mì Việt Nam, Gỏi cuốn, Bún bò Huế, Cơm tấm sườn, Cao lầu Hội An, Bánh xèo miền Tây, Chả cá Lã Vọng, và Bún riêu cua. Mỗi món ăn đều có hương vị riêng biệt, phản ánh văn hóa ẩm thực đa dạng của 3 miền Bắc - Trung - Nam.",
        image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&h=800&fit=crop",
        author: "Phạm Minh E",
      },
    ]
    
    await Blog.insertMany(blogs)
    console.log(`✅ Tao ${blogs.length} bai viet blog thanh cong`)

    // ───── ORDERS ─────
    const now = new Date()
    const daysAgo = (d) => new Date(now - d * 86400000)

    const order1 = new Order({
      userId: user1._id,
      items: [
        { dishId: createdDishes[0]._id, name: createdDishes[0].name, quantity: 2, price: createdDishes[0].price, discount: createdDishes[0].discount },
        { dishId: createdDishes[9]._id, name: createdDishes[9].name, quantity: 2, price: createdDishes[9].price, discount: 0 },
      ],
      orderType: "takeaway",
      branchId: createdBranches[0]._id,
      deliveryAddress: "123 Duong Chinh, Quan 1",
      fullName: "Nguyen Van A",
      email: "user1@restaurant.com",
      phone: "0901111111",
      totalPrice: 230000,
      discount: 10,
      finalPrice: 207000,
      paymentMethod: "bank",
      paymentStatus: "paid",
      status: "completed",
      shipperId: shipper1._id,
      confirmedBy: admin._id,
      confirmedAt: daysAgo(3),
      rating: 5,
      ratingComment: "Mon an rat ngon, giao hang nhanh!",
      ratedAt: daysAgo(2),
      paidAt: daysAgo(4),
      createdAt: daysAgo(5),
    })
    await order1.save()

    const order2 = new Order({
      userId: user2._id,
      items: [
        { dishId: createdDishes[2]._id, name: createdDishes[2].name, quantity: 1, price: createdDishes[2].price, discount: createdDishes[2].discount },
        { dishId: createdDishes[8]._id, name: createdDishes[8].name, quantity: 2, price: createdDishes[8].price, discount: createdDishes[8].discount },
      ],
      orderType: "takeaway",
      branchId: createdBranches[1]._id,
      deliveryAddress: "456 Duong Phu, Phu Nhuan",
      fullName: "Tran Thi B",
      email: "user2@restaurant.com",
      phone: "0902222222",
      totalPrice: 175000,
      discount: 5,
      finalPrice: 166250,
      paymentMethod: "bank",
      paymentStatus: "paid",
      status: "shipping",
      shipperId: shipper2._id,
      confirmedBy: admin._id,
      confirmedAt: daysAgo(1),
      paidAt: daysAgo(1),
      createdAt: daysAgo(2),
    })
    await order2.save()

    const order3 = new Order({
      userId: user1._id,
      items: [
        { dishId: createdDishes[4]._id, name: createdDishes[4].name, quantity: 1, price: createdDishes[4].price, discount: createdDishes[4].discount },
        { dishId: createdDishes[6]._id, name: createdDishes[6].name, quantity: 1, price: createdDishes[6].price, discount: createdDishes[6].discount },
      ],
      orderType: "dine-in",
      branchId: createdBranches[0]._id,
      guests: 2,
      fullName: "Nguyen Van A",
      email: "user1@restaurant.com",
      phone: "0901111111",
      totalPrice: 130000,
      discount: 0,
      finalPrice: 123500,
      paymentMethod: "cash",
      paymentStatus: "paid",
      status: "completed",
      staffId: staff1._id,
      confirmedBy: admin._id,
      confirmedAt: daysAgo(6),
      rating: 4,
      ratingComment: "Phuc vu tot, khong gian dep.",
      ratedAt: daysAgo(5),
      paidAt: daysAgo(6),
      createdAt: daysAgo(7),
    })
    await order3.save()

    const order4 = new Order({
      userId: user3._id,
      items: [
        { dishId: createdDishes[10]._id, name: createdDishes[10].name, quantity: 1, price: createdDishes[10].price, discount: createdDishes[10].discount },
        { dishId: createdDishes[5]._id, name: createdDishes[5].name, quantity: 3, price: createdDishes[5].price, discount: 0 },
      ],
      orderType: "takeaway",
      branchId: createdBranches[2]._id,
      deliveryAddress: "789 Duong So 3, Quan 2",
      fullName: "Le Minh C",
      email: "user3@restaurant.com",
      phone: "0903333333",
      totalPrice: 425000,
      discount: 12,
      finalPrice: 374000,
      paymentMethod: "bank",
      paymentStatus: "paid",
      status: "pending",
      paidAt: daysAgo(0),
      createdAt: daysAgo(0),
    })
    await order4.save()

    console.log("✅ Tao 4 don hang mau thanh cong")

    // ───── PAYMENTS ─────
    const payment1 = new Payment({
      orderId: order1._id,
      userId: user1._id,
      amount: 230000,
      discount: 23000,
      finalAmount: 207000,
      paymentMethod: "bank",
      status: "completed",
      transactionId: "TXN001234",
      paidAt: daysAgo(4),
    })
    await payment1.save()

    const payment2 = new Payment({
      orderId: order2._id,
      userId: user2._id,
      amount: 175000,
      discount: 8750,
      finalAmount: 166250,
      paymentMethod: "bank",
      status: "completed",
      transactionId: "TXN005678",
      paidAt: daysAgo(1),
    })
    await payment2.save()

    const payment3 = new Payment({
      orderId: order3._id,
      userId: user1._id,
      amount: 130000,
      discount: 6500,
      finalAmount: 123500,
      paymentMethod: "cash",
      status: "completed",
      paidAt: daysAgo(6),
    })
    await payment3.save()
    console.log("✅ Tao 3 thanh toan mau thanh cong")

    // ───── RESERVATIONS ─────
    const reservation1 = new Reservation({
      userId: user2._id,
      branchId: createdBranches[0]._id,
      date: new Date(now.getTime() + 2 * 86400000),
      time: "19:00",
      guests: 4,
      specialRequests: "Dat ban gan cua so",
      orderItems: [
        { dishId: createdDishes[0]._id, name: createdDishes[0].name, quantity: 4, price: createdDishes[0].price, discount: createdDishes[0].discount },
        { dishId: createdDishes[1]._id, name: createdDishes[1].name, quantity: 2, price: createdDishes[1].price, discount: 0 },
      ],
      depositAmount: 100000,
      foodTotal: 430000,
      foodDiscount: 34000,
      totalAmount: 496000,
      staffId: staff1._id,
      status: "confirmed",
      paymentStatus: "paid",
      paymentMethod: "bank",
      paidAt: daysAgo(1),
    })
    await reservation1.save()

    const reservation2 = new Reservation({
      userId: user3._id,
      branchId: createdBranches[1]._id,
      date: new Date(now.getTime() + 5 * 86400000),
      time: "18:30",
      guests: 6,
      specialRequests: "Sinh nhat, can chuoi hoa",
      orderItems: [
        { dishId: createdDishes[4]._id, name: createdDishes[4].name, quantity: 3, price: createdDishes[4].price, discount: createdDishes[4].discount },
        { dishId: createdDishes[6]._id, name: createdDishes[6].name, quantity: 3, price: createdDishes[6].price, discount: createdDishes[6].discount },
      ],
      depositAmount: 150000,
      foodTotal: 390000,
      foodDiscount: 34950,
      totalAmount: 505050,
      status: "pending",
      paymentStatus: "unpaid",
    })
    await reservation2.save()
    console.log("✅ Tao 2 dat ban mau thanh cong")

    // ───── CONTACTS ─────
    const contacts = [
      {
        name: "Nguyen Van A",
        email: "user1@restaurant.com",
        phone: "0901111111",
        message: "Mon an rat ngon, phuc vu chu dao. Se quay lai lan sau!",
        type: "feedback",
        userId: user1._id,
        status: "replied",
        reply: "Cam on ban da phan hoi. Chung toi rat vui khi ban hai long!",
      },
      {
        name: "Pham Quoc Hung",
        email: "hung.shipper@gmail.com",
        phone: "0955123456",
        message: "Toi co kinh nghiem giao hang 2 nam, co xe may, co bang A2. Xin dang ky lam shipper cho chi nhanh Quan 1.",
        type: "shipper_application",
        branchId: createdBranches[0]._id,
        status: "new",
      },
      {
        name: "Vo Thi Lan",
        email: "lan.apply@gmail.com",
        phone: "0966234567",
        message: "Toi tot nghiep nganh quan tri khach san, co kinh nghiem phuc vu 1 nam. Xin dang ky lam nhan vien phuc vu tai chi nhanh Phu Nhuan.",
        type: "staff_application",
        branchId: createdBranches[1]._id,
        status: "new",
      },
      {
        name: "Tran Thi B",
        email: "user2@restaurant.com",
        phone: "0902222222",
        message: "Thoi gian cho hoi lau, nhung mon an ngon. Mong quan cai thien toc do phuc vu.",
        type: "feedback",
        userId: user2._id,
        status: "read",
      },
      {
        name: "Bui Van Nam",
        email: "nam.shipper@gmail.com",
        phone: "0977345678",
        message: "Xin dang ky lam shipper. Toi co xe may, quen duong Quan 2, co the bat dau ngay.",
        type: "shipper_application",
        branchId: createdBranches[2]._id,
        status: "approved",
      },
      {
        name: "Doan Thi My",
        email: "my.staff@gmail.com",
        phone: "0988456789",
        message: "Toi muon dang ky lam nhan vien bep tai chi nhanh Quan 1. Toi co kinh nghiem nau an 3 nam.",
        type: "staff_application",
        branchId: createdBranches[0]._id,
        status: "rejected",
      },
    ]
    await Contact.insertMany(contacts)
    console.log(`✅ Tao ${contacts.length} lien he mau thanh cong`)

    // ───── SUMMARY ─────
    console.log("\n✅ Du lieu mau da duoc tao thanh cong!")
    console.log("\nTai khoan mau:")
    console.log("  Admin:    admin@restaurant.com    / admin123")
    console.log("  User 1:   user1@restaurant.com    / user123")
    console.log("  User 2:   user2@restaurant.com    / user123")
    console.log("  User 3:   user3@restaurant.com    / user123")
    console.log("  Shipper1: shipper1@restaurant.com / shipper123")
    console.log("  Shipper2: shipper2@restaurant.com / shipper123")
    console.log("  Staff 1:  staff1@restaurant.com   / staff123")
    console.log("  Staff 2:  staff2@restaurant.com   / staff123")

    console.log("\nThong ke du lieu:")
    console.log(`  - ${createdDishes.length} mon an`)
    console.log(`  - ${createdBranches.length} chi nhanh`)
    console.log(`  - ${events.length} su kien`)
    console.log(`  - ${blogs.length} bai blog`)
    console.log("  - 4 don hang (2 hoan thanh co danh gia, 1 dang giao, 1 cho xu ly)")
    console.log("  - 3 thanh toan")
    console.log("  - 2 dat ban")
    console.log(`  - ${contacts.length} lien he (feedback, shipper & nhan vien don dang ky)`)

    process.exit(0)
  } catch (error) {
    console.error("❌ Lỗi:", error.message)
    process.exit(1)
  }
}

seedData()
