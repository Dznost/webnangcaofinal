// ==========================================
// COMPLETE DATABASE FINAL UPDATE SCRIPT
// All models, constraints, triggers, and procedures
// ==========================================

const mongoose = require('mongoose');

/**
 * ===================================
 * 1. USER MODEL WITH CONSTRAINTS
 * ===================================
 */
const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Tên người dùng là bắt buộc'],
    trim: true,
    minlength: [2, 'Tên phải tối thiểu 2 ký tự'],
    maxlength: [100, 'Tên không vượt quá 100 ký tự']
  },
  email: { 
    type: String, 
    required: [true, 'Email là bắt buộc'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
  },
  password: { 
    type: String, 
    required: [true, 'Mật khẩu là bắt buộc'],
    minlength: [8, 'Mật khẩu phải tối thiểu 8 ký tự'],
    select: false
  },
  phone: {
    type: String,
    match: [/^(\+84|0)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ']
  },
  address: {
    type: String,
    maxlength: [200, 'Địa chỉ không vượt quá 200 ký tự']
  },
  role: { 
    type: String, 
    enum: {
      values: ['user', 'admin', 'shipper', 'staff', 'reception'],
      message: 'Vai trò không hợp lệ'
    },
    default: 'user'
  },
  branchId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Branch',
    validate: {
      isAsync: true,
      validator: async function(branchId) {
        if (!branchId) return true;
        const Branch = mongoose.model('Branch');
        const branch = await Branch.findById(branchId);
        return !!branch;
      },
      message: 'Chi nhánh không tồn tại'
    }
  },
  pendingBranchId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Branch'
  },
  branchChangeStatus: { 
    type: String, 
    enum: ['none', 'pending', 'approved', 'rejected'], 
    default: 'none'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save password hashing
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const bcrypt = require('bcryptjs');
  this.password = await bcrypt.hash(this.password, 10);
  this.updatedAt = Date.now();
  next();
});

// Role-specific validation
userSchema.pre('save', function(next) {
  // Staff, shipper, reception must have branchId
  if (['staff', 'shipper', 'reception'].includes(this.role) && !this.branchId) {
    return next(new Error('Nhân viên phải được gán cho một chi nhánh'));
  }
  next();
});

/**
 * ===================================
 * 2. BRANCH MODEL WITH CONSTRAINTS
 * ===================================
 */
const branchSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Tên chi nhánh là bắt buộc'],
    unique: true,
    trim: true
  },
  address: { 
    type: String, 
    required: [true, 'Địa chỉ chi nhánh là bắt buộc']
  },
  phone: {
    type: String,
    match: [/^(\+84|0)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ']
  },
  email: {
    type: String,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
  },
  image: String,
  images: [String],
  openingHours: String,
  description: String,
  // Table management with constraints
  totalTables: { 
    type: Number, 
    required: true,
    min: [1, 'Tối thiểu phải có 1 bàn'],
    max: [1000, 'Tối đa 1000 bàn']
  },
  availableTables: { 
    type: Number,
    required: true,
    validate: {
      validator: function() {
        return this.availableTables >= 0 && this.availableTables <= this.totalTables;
      },
      message: 'Bàn trống phải >= 0 và <= tổng bàn'
    }
  },
  // Revenue tracking
  totalRevenue: { type: Number, default: 0, min: 0 },
  monthlyRevenue: { type: Number, default: 0, min: 0 },
  // Dish references
  dishes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Dish' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Trigger: Validate table changes
branchSchema.pre('save', function(next) {
  if (this.availableTables > this.totalTables) {
    return next(new Error('Bàn trống không thể vượt quá tổng bàn'));
  }
  this.updatedAt = Date.now();
  next();
});

/**
 * ===================================
 * 3. DISH MODEL WITH CONSTRAINTS
 * ===================================
 */
const dishSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Tên món ăn là bắt buộc'],
    trim: true,
    maxlength: [100, 'Tên không vượt quá 100 ký tự']
  },
  description: {
    type: String,
    maxlength: [500, 'Mô tả không vượt quá 500 ký tự']
  },
  price: { 
    type: Number, 
    required: [true, 'Giá món ăn là bắt buộc'],
    min: [0, 'Giá phải >= 0'],
    max: [999999999, 'Giá quá lớn']
  },
  image: String,
  category: { 
    type: String, 
    enum: {
      values: ['appetizer', 'main', 'dessert', 'beverage'],
      message: 'Danh mục không hợp lệ'
    },
    required: true
  },
  discount: { 
    type: Number, 
    default: 0,
    min: [0, 'Giảm giá phải >= 0'],
    max: [100, 'Giảm giá không vượt quá 100%']
  },
  available: { 
    type: Boolean, 
    default: true
  },
  event: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

/**
 * ===================================
 * 4. ORDER MODEL WITH CONSTRAINTS
 * ===================================
 */
const orderSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Người dùng là bắt buộc']
  },
  items: [{
    dishId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish' },
    name: { type: String, required: true },
    quantity: { 
      type: Number, 
      required: true,
      min: [1, 'Số lượng tối thiểu 1'],
      max: [999, 'Số lượng tối đa 999']
    },
    price: { 
      type: Number, 
      required: true,
      min: [0, 'Giá phải >= 0']
    },
    discount: { 
      type: Number, 
      default: 0,
      min: [0, 'Giảm giá phải >= 0']
    }
  }],
  orderType: { 
    type: String, 
    enum: {
      values: ['dine-in', 'takeaway'],
      message: 'Loại đơn hàng không hợp lệ'
    },
    required: true
  },
  branchId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Branch',
    required: [true, 'Chi nhánh là bắt buộc']
  },
  guests: {
    type: Number,
    min: [1, 'Tối thiểu 1 khách']
  },
  paymentTiming: { 
    type: String, 
    enum: {
      values: ['prepaid', 'cod'],
      message: 'Thời gian thanh toán không hợp lệ'
    },
    default: 'prepaid'
  },
  totalPrice: { 
    type: Number,
    required: true,
    min: [0, 'Tổng giá phải >= 0']
  },
  discount: { 
    type: Number, 
    default: 0,
    min: [0, 'Giảm giá phải >= 0']
  },
  finalPrice: { 
    type: Number,
    required: true,
    min: [0, 'Giá cuối cùng phải >= 0'],
    validate: {
      validator: function() {
        return this.finalPrice === (this.totalPrice - this.discount);
      },
      message: 'Giá cuối cùng phải = tổng - giảm giá'
    }
  },
  shipperId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { 
    type: String, 
    enum: {
      values: ['pending', 'approved', 'paid', 'processing', 'shipping', 'delivered', 'completed', 'cancelled'],
      message: 'Trạng thái đơn hàng không hợp lệ'
    },
    default: 'pending'
  },
  paymentStatus: { 
    type: String, 
    enum: {
      values: ['unpaid', 'paid'],
      message: 'Trạng thái thanh toán không hợp lệ'
    },
    default: 'unpaid'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank', 'card', 'online']
  },
  deliveryAddress: String,
  fullName: String,
  email: {
    type: String,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
  },
  phone: {
    type: String,
    match: [/^(\+84|0)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ']
  },
  specialRequests: String,
  largeOrderNote: String,
  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  confirmedAt: Date,
  paidAt: Date,
  rating: { 
    type: Number, 
    min: [1, 'Đánh giá tối thiểu 1'],
    max: [5, 'Đánh giá tối đa 5']
  },
  ratingComment: String,
  ratedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save: Auto-calculate finalPrice
orderSchema.pre('save', function(next) {
  this.finalPrice = Math.max(0, this.totalPrice - this.discount);
  this.updatedAt = Date.now();
  
  // Validation: COD chỉ cho takeaway
  if (this.paymentTiming === 'cod' && this.orderType === 'dine-in') {
    return next(new Error('Thanh toán COD chỉ áp dụng cho đơn mua mang đi'));
  }
  
  // Validation: Ít nhất 1 item
  if (!this.items || this.items.length === 0) {
    return next(new Error('Đơn hàng phải có ít nhất 1 sản phẩm'));
  }
  
  next();
});

/**
 * ===================================
 * 5. RESERVATION MODEL WITH CONSTRAINTS
 * ===================================
 */
const reservationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Người dùng là bắt buộc']
  },
  branchId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Branch', 
    required: [true, 'Chi nhánh là bắt buộc']
  },
  date: { 
    type: Date, 
    required: [true, 'Ngày đặt bàn là bắt buộc'],
    validate: {
      validator: function(val) {
        return val > new Date();
      },
      message: 'Ngày đặt bàn phải trong tương lai'
    }
  },
  time: {
    type: String,
    required: true,
    match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Định dạng giờ không hợp lệ (HH:MM)']
  },
  guests: { 
    type: Number, 
    required: true,
    min: [1, 'Tối thiểu 1 khách'],
    max: [100, 'Tối đa 100 khách']
  },
  specialRequests: {
    type: String,
    maxlength: [500, 'Yêu cầu đặc biệt không vượt quá 500 ký tự']
  },
  orderItems: [{
    dishId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish' },
    name: String,
    quantity: { 
      type: Number,
      min: [1, 'Số lượng tối thiểu 1']
    },
    price: Number,
    discount: { type: Number, default: 0 }
  }],
  depositAmount: { 
    type: Number, 
    default: 0,
    min: [0, 'Tiền cọc phải >= 0']
  },
  foodTotal: { 
    type: Number, 
    default: 0,
    min: [0, 'Tổng tiền food phải >= 0']
  },
  foodDiscount: { 
    type: Number, 
    default: 0,
    min: [0, 'Giảm giá phải >= 0']
  },
  totalAmount: { 
    type: Number, 
    default: 0,
    min: [0, 'Tổng tiền phải >= 0'],
    validate: {
      validator: function() {
        return this.totalAmount === (this.depositAmount + this.foodTotal - this.foodDiscount);
      },
      message: 'Tổng tiền phải = tiền cọc + food - giảm giá'
    }
  },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { 
    type: String, 
    enum: {
      values: ['pending', 'confirmed', 'paid', 'processing', 'completed', 'cancelled'],
      message: 'Trạng thái không hợp lệ'
    },
    default: 'pending'
  },
  paymentStatus: { 
    type: String, 
    enum: {
      values: ['unpaid', 'paid'],
      message: 'Trạng thái thanh toán không hợp lệ'
    },
    default: 'unpaid'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank', 'card', 'online']
  },
  paidAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save: Auto-calculate totalAmount
reservationSchema.pre('save', function(next) {
  this.totalAmount = Math.max(0, this.depositAmount + this.foodTotal - this.foodDiscount);
  this.updatedAt = Date.now();
  next();
});

/**
 * ===================================
 * 6. PAYMENT MODEL WITH CONSTRAINTS
 * ===================================
 */
const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  reservationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Người dùng là bắt buộc']
  },
  amount: { 
    type: Number, 
    required: [true, 'Số tiền là bắt buộc'],
    min: [0, 'Số tiền phải >= 0']
  },
  discount: { 
    type: Number, 
    default: 0,
    min: [0, 'Giảm giá phải >= 0']
  },
  finalAmount: { 
    type: Number, 
    required: true,
    min: [0, 'Số tiền cuối cùng phải >= 0'],
    validate: {
      validator: function() {
        return this.finalAmount === (this.amount - this.discount);
      },
      message: 'Số tiền cuối = số tiền - giảm giá'
    }
  },
  paymentMethod: { 
    type: String, 
    enum: {
      values: ['bank', 'cash', 'card', 'online'],
      message: 'Phương thức thanh toán không hợp lệ'
    },
    required: true
  },
  status: { 
    type: String, 
    enum: {
      values: ['pending', 'completed', 'failed'],
      message: 'Trạng thái thanh toán không hợp lệ'
    },
    default: 'pending'
  },
  revenueType: { 
    type: String, 
    enum: {
      values: ['delivery', 'reception', 'dine-in'],
      message: 'Loại doanh thu không hợp lệ'
    }
  },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  qrCode: String,
  transactionId: String,
  paidAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save: Auto-calculate finalAmount
paymentSchema.pre('save', function(next) {
  this.finalAmount = Math.max(0, this.amount - this.discount);
  this.updatedAt = Date.now();
  
  // Validation: Ít nhất một trong orderId hoặc reservationId
  if (!this.orderId && !this.reservationId) {
    return next(new Error('Thanh toán phải liên kết với đơn hàng hoặc đặt bàn'));
  }
  
  next();
});

/**
 * ===================================
 * 7. NOTIFICATION MODEL
 * ===================================
 */
const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'new_order', 'large_order', 'order_assigned', 'order_confirmed',
      'order_shipping', 'order_completed', 'order_cancelled', 'order_review',
      'new_reservation', 'reservation_confirmed', 'reservation_completed',
      'reservation_cancelled', 'payment_received', 'payment_failed',
      'new_user_registration', 'shipper_application', 'staff_application',
      'reception_application', 'branch_change_request', 'role_change',
      'branch_low_tables', 'branch_full', 'branch_revenue_milestone'
    ],
    required: true
  },
  category: {
    type: String,
    enum: ['order', 'reservation', 'payment', 'user', 'branch', 'system'],
    default: 'system'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  reservationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' },
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true
  },
  amount: { 
    type: Number, 
    default: 0,
    min: [0, 'Số tiền phải >= 0']
  },
  message: { 
    type: String, 
    required: true,
    maxlength: [500, 'Tin nhắn không vượt quá 500 ký tự']
  },
  details: String,
  status: { 
    type: String, 
    enum: ['pending', 'read', 'resolved'], 
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now }
});

/**
 * ===================================
 * 8. CONTACT MODEL
 * ===================================
 */
const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên là bắt buộc'],
    trim: true,
    maxlength: [100, 'Tên không vượt quá 100 ký tự']
  },
  email: {
    type: String,
    required: [true, 'Email là bắt buộc'],
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
  },
  phone: {
    type: String,
    match: [/^(\+84|0)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ']
  },
  message: {
    type: String,
    required: [true, 'Tin nhắn là bắt buộc'],
    maxlength: [1000, 'Tin nhắn không vượt quá 1000 ký tự']
  },
  type: {
    type: String,
    enum: ['feedback', 'shipper_application', 'staff_application'],
    default: 'feedback'
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  status: {
    type: String,
    enum: ['new', 'read', 'replied', 'approved', 'rejected'],
    default: 'new'
  },
  reply: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = {
  userSchema,
  branchSchema,
  dishSchema,
  orderSchema,
  reservationSchema,
  paymentSchema,
  notificationSchema,
  contactSchema
};
