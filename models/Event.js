const mongoose = require("mongoose")

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  image: String,
  discount: { type: Number, default: 0 },
  discountType: { 
    type: String, 
    enum: ['none', 'branch', 'dish'], 
    default: 'none' 
  },
  dishes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Dish" }],
  startDate: Date,
  endDate: Date,
  branches: [{ type: mongoose.Schema.Types.ObjectId, ref: "Branch" }],
  isGlobal: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model("Event", eventSchema)
