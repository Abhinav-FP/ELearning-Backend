// Filename: models/orderModel.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderID: { type: String, required: true, unique: true },
  intent: String,
  status: String,
  purchase_units: [
    {
      amount: {
        currency_code: String,
        value: String,
      },
    },
  ],
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
  payment_source: Object, 
  capturedAt: Date,
 LessonId: {
     type: mongoose.Schema.Types.ObjectId,
     ref: 'Lesson',
   },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Payment', orderSchema);