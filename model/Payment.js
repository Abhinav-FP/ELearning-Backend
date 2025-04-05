const mongoose = require("mongoose");

const orderSchema =  mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    payerEmail: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    status: { type: String, required: true },
  },
  { timestamps: true }
);

const Order = mongoose.model("payment", orderSchema);

module.exports = Order;
