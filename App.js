const dotenv = require("dotenv");
dotenv.config();

require("./dbconfigration");
const express = require("express");
const app = express();
const cors = require("cors");
const corsOptions = {
  origin: "*", // Allowed origins
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: '*', // Allow all headers
  credentials: true,
  optionsSuccessStatus: 200, // for legacy browsers
}

app.use(cors(corsOptions));
app.use(express.json({ limit: '2000mb' }));
app.use(express.urlencoded({ extended: true, limit: "2000mb" }));

const PORT = process.env.REACT_APP_SERVER_DOMAIN || 5000;

const UserRoute = require("./route/userRoutes");
const MessageRoute = require("./route/messageRoutes");
const WishlistRoute = require("./route/wishlistRoutes");
const LessonRoute = require("./route/lessonRoutes");
const HomeRoute = require("./route/homeRoute");
const PaymentRoute = require("./route/paymentroute");


app.use("/user", UserRoute);
app.use("/home", HomeRoute);
app.use("/message", MessageRoute);
app.use("/favourite", WishlistRoute);
app.use("/lesson", LessonRoute);
app.use("/payment", PaymentRoute);



app.get("/", (req, res) => {
  res.json({
    msg: 'Hello World',
    status: 200,
  });
});

const server = app.listen(PORT, () => console.log("Server is running at port : " + PORT));
server.timeout = 360000; // 6 minutes