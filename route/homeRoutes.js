const { homeAdd, homefind, homeupdate, FAQAdd, faqfind, faqupdate, policycondition, GetTeacherVideo, GetTeachers } = require("../controller/HomeController");
const router = require("express").Router();

router.post("/home/add", homeAdd);
router.get("/home/find", homefind);
router.post("/home/update", homeupdate);

router.post("/home/policy" , policycondition)

// FAQ SECtion  
router.post("/home/faqAdd", FAQAdd);
router.get("/home/faqFind", faqfind);
router.post("/home/faqUpdate", faqupdate);

// Teacher 
router.get("/home/teacher" ,  GetTeachers)
router.get("/home/teacher/video" ,  GetTeacherVideo)




module.exports = router;