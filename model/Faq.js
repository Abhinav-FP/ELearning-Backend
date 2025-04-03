const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema({
    type :{type :String},
  question: { type: String, required: true },
  answer: { type: String, required: true },
});

module.exports = mongoose.model("FAQ", faqSchema);
