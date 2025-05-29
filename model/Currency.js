const mongoose = require("mongoose")

const currencySchema = mongoose.Schema({
    currency: {
        type: String,
        required: true,
    },
    rate: {
        type: String,
        required: true,
    }
})

const Contact = mongoose.model("Currency", currencySchema);
module.exports = Contact;