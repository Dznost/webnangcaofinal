const mongoose = require("mongoose")

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  image: String,
  discount: { type: Number, default: 0 },
  // 2 loai giam gia: 'global' = toan bo chi nhanh, 'branch' = chi nhanh cu the
  discountScope: {
    type: String,
    enum: ["global", "branch"],
    default: "global",
  },
  // Danh sach chi nhanh ap dung (chi dung khi discountScope = 'branch')
  branches: [{ type: mongoose.Schema.Types.ObjectId, ref: "Branch" }],
  // Danh sach mon an ap dung giam gia (tuy chon, neu rong = ap dung tat ca mon)
  dishes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Dish" }],
  startDate: Date,
  endDate: Date,
  createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model("Event", eventSchema)
