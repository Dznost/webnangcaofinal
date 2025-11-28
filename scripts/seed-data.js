const mongoose = require("mongoose")
const connectDB = require("../config/database")
const User = require("../models/User")
const Dish = require("../models/Dish")
const Branch = require("../models/Branch")
const Event = require("../models/Event")
const Blog = require("../models/Blog")

const seedData = async () => {
  try {
    await connectDB()
    console.log("✅ Kết nối MongoDB thành công")

    await User.deleteMany({})
    await Dish.deleteMany({})
    await Branch.deleteMany({})
    await Event.deleteMany({})
    await Blog.deleteMany({})
    console.log("✅ Xóa dữ liệu cũ thành công")

    // Create admin user
    const admin = new User({
      name: "Quản Trị Viên",
      email: "admin@restaurant.com",
      password: "admin123",
      role: "admin",
      phone: "0123456789",
      address: "123 Đường Chính, Thành Phố",
    })
    await admin.save()
    console.log("✅ Tạo tài khoản admin thành công")

    // Create regular users
    const user1 = new User({
      name: "Nguyễn Văn A",
      email: "user1@restaurant.com",
      password: "user123",
      phone: "0123456789",
      address: "123 Đường Chính, Thành Phố",
      role: "user",
    })
    await user1.save()

    const user2 = new User({
      name: "Trần Thị B",
      email: "user2@restaurant.com",
      password: "user123",
      phone: "0987654321",
      address: "456 Đường Phụ, Thành Phố",
      role: "user",
    })
    await user2.save()
    console.log("✅ Tạo tài khoản người dùng thành công")

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
    console.log(`✅ Tạo ${createdBranches.length} chi nhánh thành công`)

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
    console.log(`✅ Tạo ${events.length} sự kiện thành công`)

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
    console.log(`✅ Tạo ${blogs.length} bài viết blog thành công`)

    console.log("\n✅ Dữ liệu mẫu đã được tạo thành công!")
    console.log("\n📝 Tài khoản mẫu:")
    console.log("   Admin: admin@restaurant.com / admin123")
    console.log("   User 1: user1@restaurant.com / user123")
    console.log("   User 2: user2@restaurant.com / user123")
    
    console.log("\n📊 Thống kê dữ liệu:")
    console.log(`   - ${createdDishes.length} món ăn`)
    console.log(`   - ${createdBranches.length} chi nhánh`)
    console.log(`   - ${events.length} sự kiện`)
    console.log(`   - ${blogs.length} bài blog`)
    
    process.exit(0)
  } catch (error) {
    console.error("❌ Lỗi:", error.message)
    process.exit(1)
  }
}

seedData()
