const mongoose = require("mongoose");

const becomefaqSchema = new mongoose.Schema({
  type: { type: String },
  question: { type: String, required: true },
  answer: { type: String, required: true },
});

module.exports = mongoose.model("becomefaqs", becomefaqSchema);
