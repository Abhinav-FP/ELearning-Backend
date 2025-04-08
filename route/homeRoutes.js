const { homeAdd, homefind, homeupdate, FAQAdd, faqfind, faqupdate } = require("../controller/HomeController");
const router = require("express").Router();

router.post("/home/add", homeAdd);
router.get("/home/find", homefind);
router.post("/home/update", homeupdate);

// FAQ SECtion  
router.post("/home/faqAdd", FAQAdd);
router.get("/home/faqFind", faqfind);
router.post("/home/faqUpdate", faqupdate);

module.exports = router;