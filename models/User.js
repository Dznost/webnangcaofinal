const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: function() { return !this.socialProvider; } },
  phone: String,
  address: String,
  avatar: String,
  role: { type: String, enum: ["user", "admin", "shipper", "staff", "reception"], default: "user" },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
  pendingBranchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
  branchChangeStatus: { type: String, enum: ["none", "pending", "approved", "rejected"], default: "none" },
  // Social login fields
  socialProvider: { type: String, enum: ["google", "facebook", null], default: null },
  socialId: { type: String, default: null },
  googleId: { type: String, default: null },
  facebookId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
})

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

// Compare password method
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password)
}

module.exports = mongoose.model("User", userSchema)
