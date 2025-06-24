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
  },
  UserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  created_at: { type: Date, default: Date.now },
  IsBouns : { type: Boolean, default: false },
});

module.exports = mongoose.model('paypalpayments', orderSchema);
