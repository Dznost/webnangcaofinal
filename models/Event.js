const mongoose = require("mongoose")

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  image: String,
  discount: { type: Number, default: 0 },
  startDate: Date,
  endDate: Date,
  branches: [{ type: mongoose.Schema.Types.ObjectId, ref: "Branch" }], // Events can apply to multiple branches
  isGlobal: { type: Boolean, default: false }, // If true, applies to all branches
  createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model("Event", eventSchema)
