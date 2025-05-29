const Currency = require("../model/Currency");
const catchAsync = require("../utils/catchAsync");
const { default: axios } = require("axios");
const logger = require("../utils/Logger");
const cron = require('node-cron');
const sendEmail = require("../utils/EmailMailler");
const currency = require("../EmailTemplate/currency");


exports.GetRate = catchAsync(async (req, res) => {
    try {
        const { currency } = req.params;
        const data = await Currency.findOne({ currency: currency });
        if (!data) {
            if (!data) {
                return res.status(404).json({
                    status: false,
                    message: "Invalid currency name!",
                    data: null,
                });
            }
        }
        return res.status(200).json({
            status: true,
            message: "Currency rate retrieved successfully!",
            data: data?.rate,
        });
    } catch (error) {
        console.error("Error during booking creation:", error);
        logger.error("Error during booking creation:", error);
        return res.status(500).json({
            status: false,
            message: "An error occurred while creating the booking.",
            error: error.message,
        });
    }
});


const fetchExchangeRates = async () => {
    try {
        const response = await axios.get(
            `https://v6.exchangerate-api.com/v6/${process.env.CURRENCY_API_KEY}/latest/USD`
        );
        return response?.data?.conversion_rates;
    } catch (error) {
        console.error("Error fetching exchange rate data:", error.message);
        logger.error("Error fetching exchange rate data:", error.message);
        return null;
    }
};

exports.UpdateCurrencyRates = catchAsync(async (req, res) => {
    try {
        const data = await fetchExchangeRates();
        if (!data) {
            return res.status(500).json({
                status: false,
                message: "Failed to fetch exchange rates.",
            });
        }
        const currencyPromises = Object.entries(data).map(
            async ([currency, rate]) => {
                await Currency.findOneAndUpdate(
                    { currency },
                    { rate },
                    { upsert: true, new: true } // Upsert: update if exists, insert if not
                );
            }
        );

        await Promise.all(currencyPromises);
        res.status(200).json({
            status: true,
            message: "Currency data updated successfully.",
        });
    } catch (error) {
        console.error("Error during booking creation:", error);
        logger.error("Error during booking creation:", error);
        return res.status(500).json({
            status: false,
            message: "An error occurred while creating the booking.",
            error: error.message,
        });
    }
});

async function updateCurrencyRatesJob() {
    try {
        const data = await fetchExchangeRates();
        if (!data) {
            logger.error("❌ Failed to fetch exchange rates.");
            return null;
        }

        const currencyPromises = Object.entries(data).map(
            async ([currency, rate]) => {
                await Currency.findOneAndUpdate(
                    { currency },
                    { rate },
                    { upsert: true, new: true }
                );
            }
        );

        await Promise.all(currencyPromises);
        console.log("✅ Currency rates updated successfully.");
        return "Update Currency";
    } catch (error) {
        console.error("❌ Error updating currency rates:", error);
        logger.error("❌ Error updating currency rates:", error);
        return null;

    }
}

module.exports = { updateCurrencyRatesJob };
