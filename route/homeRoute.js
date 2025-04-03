const { homeAdd, homefind, homeupdate, FAQAdd, faqfind, faqupdate } = require("../controller/HomeController");
const router = require("express").Router();

router.post("/add", homeAdd);
router.get("/find", homefind);
router.post("/update", homeupdate);

// FAQ SECtion  
router.post("/faq_add", FAQAdd);
router.get("/faq_find", faqfind);
router.post("/faq_update", faqupdate);

module.exports = router;