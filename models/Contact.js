const mongoose = require("mongoose")

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["feedback", "shipper_application", "staff_application"],
      default: "feedback",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
    },
    status: {
      type: String,
      enum: ["new", "read", "replied", "approved", "rejected"],
      default: "new",
    },
    reply: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model("Contact", contactSchema)
