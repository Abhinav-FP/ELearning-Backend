const catchAsync = require("../utils/catchAsync");
const Payment = require("../model/Payment");
const Loggers = require("../utils/Logger");
const { errorResponse, successResponse , validationErrorResponse  } = require("../utils/ErrorHandling");
const { default: axios } = require("axios");
// Function to Generate PayPal Access Token
const { PAYPAL_CLIENT_ID, PAYPAL_SECRET, PAYPAL_API } = process.env;

// ✅ Generate PayPal Access Token
const generateAccessToken = async () => {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64");
    try {
        const response = await axios.post(
            `${PAYPAL_API}/v1/oauth2/token`,
            "grant_type=client_credentials",
            {
                headers: {
                    Authorization: `Basic ${auth}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );
        console.log("✅ PayPal Token Response:", response.data);
        return response.data.access_token;
    } catch (error) {
        console.error("❌ PayPal Token Error:", error.response?.data || error.message);
        throw new Error("Failed to generate PayPal access token");
    }
};

// ✅ Create PayPal Order & Save to Database
exports.PaymentcreateOrder = catchAsync(async (req, res) => {
    const { items } = req.body;

    // 🔹 Validate Request Data
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Invalid or empty items list" });
    }

    // 🔹 Calculate Total Amount & Item Total
    let itemTotal = 0;
    const formattedItems = items.map((item) => {
        const unitAmount = parseFloat(item.price).toFixed(2);
        itemTotal += parseFloat(unitAmount) * item.quantity;
        return {
            name: item.name,
            quantity: `${item.quantity}`,
            unit_amount: {
                currency_code: "USD",
                value: unitAmount,
            },
        };
    });

    const formattedTotalAmount = itemTotal.toFixed(2);

    console.log("🔹 Item Total:", formattedTotalAmount);

    try {
        // 🔹 Get PayPal Access Token
        const accessToken = await generateAccessToken();

        // 🔹 Prepare PayPal Order Payload (Fixed Breakdown)
        const orderPayload = {
            intent: "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        currency_code: "USD",
                        value: formattedTotalAmount, // Must match breakdown total
                        breakdown: {
                            item_total: {
                                currency_code: "USD",
                                value: formattedTotalAmount, // Required field
                            },
                        },
                    },
                    items: formattedItems,
                },
            ],
        };

        console.log("📦 PayPal Order Payload:", JSON.stringify(orderPayload, null, 2));

        // 🔹 Send Order Request to PayPal
        const response = await axios.post(
            `${PAYPAL_API}/v2/checkout/orders`,
            orderPayload,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        console.log("✅ PayPal Order Response:", JSON.stringify(response.data, null, 2));

        try {
            const newOrder = new Payment({
                orderId: response.data.id,
                amount: formattedTotalAmount,
                currency: "USD",
                status: "CREATED",
                items,
            });

            const savedOrder = await newOrder.save();
            console.log("✅ Saved Order in DB:", savedOrder);

            return res.status(200).json({ id: response.data.id });
        } catch (dbError) {
            console.error("❌ Database Save Error:", dbError);
            return res.status(500).json({ error: "Failed to save order in database" });
        }

    } catch (error) {
        console.error("❌ PayPal API Error:", error.response?.data || error.message);
        return res.status(500).json({ error: "Failed to create PayPal order" });
    }
});




// ✅ Capture Payment API & Update Order in Database

exports.PaymentcaptureOrder = catchAsync(async (req, res) => {
    const { orderID } = req.body;

    try {
        const accessToken = await generateAccessToken();
        const response = await axios.post(
            `${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`,
            {},
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const order = await Payment.findOneAndUpdate(
            { orderId: orderID },
            {
                status: "COMPLETED",
                payerEmail: response.data.payer.email_address,
            },
            { new: true }
        );
        if (!order) {
            Loggers.warn("No data found with this ID.");
            return validationErrorResponse(res, "Home Data Not Updated", 400);
        }

        Loggers.info("capture order successfully!");
        successResponse(res, "capture order successfully!", 201, {
            data: order,
        });

    } catch (error) {
        return errorResponse(res, error.message || "Internal Server Error", 500);

    }
});


// ✅ cancel Payment API & Update Order in Database


// exports.cancelOrder = catchAsync(async (req, res) => {
//     const { orderID } = req.body;

//     try {
//         const accessToken = await generateAccessToken();

//         // ✅ PayPal API se order ka status check karein
//         const response = await axios.get(
//             `${PAYPAL_API}/v2/checkout/orders/${orderID}`,
//             { headers: { Authorization: `Bearer ${accessToken}` } }
//         );

//         const orderStatus = response.data.status;
//         console.log("Order Status from PayPal:", orderStatus);

//         // ✅ Agar order status still ACTIVE hai toh usko VOID karein
//         if (orderStatus === "CREATED") {
//             await axios.post(
//                 `${PAYPAL_API}/v2/checkout/orders/${orderID}/void`,
//                 {},
//                 { headers: { Authorization: `Bearer ${accessToken}` } }
//             );
//         }

//         // ✅ Database me status update karein
//         const order = await Payment.findOneAndUpdate(
//             { orderId: orderID },
//             { status: "CANCELLED" },
//             { new: true }
//         );

//         if (!order) {
//             return validationErrorResponse(res, "Order not found!", 404);
//         }

//         successResponse(res, "Order cancelled successfully!", 200, { order });

//     } catch (error) {
//         return errorResponse(res, error.message || "Internal Server Error", 500);
//     }
// });

