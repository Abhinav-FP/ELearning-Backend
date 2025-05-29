const CurrencyRoute = require("express").Router();

const { UpdateCurrencyRates, GetRate } = require("../controller/currencycontroller");

CurrencyRoute.get("/update", UpdateCurrencyRates);

CurrencyRoute.get("/get-rate/:currency", GetRate);

module.exports = CurrencyRoute;