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
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["new", "read", "replied"],
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
