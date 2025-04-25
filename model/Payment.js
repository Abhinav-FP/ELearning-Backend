// models/orderModel.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderID: { type: String, required: true, unique: true },
  intent: { type: String },
  status: { type: String },
  amount: {
    type: Number,
    default: 0
  },
  currency: { type: String },
  payer: {
    name: {
      given_name: String,
      surname: String,
    },
    email_address: String,
    payer_id: String,
    address: {
      address_line_1: String,
      admin_area_2: String,
      admin_area_1: String,
      postal_code: String,
      country_code: String,
    },
  },
  payment_source: mongoose.Schema.Types.Mixed,
  capturedAt: { type: Date },
  LessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    default: "67ff410ea8e3ad25440e5161"
  },
  UserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: "67f8eb8224daa0005ae23291"
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('paypalpayments', orderSchema);
