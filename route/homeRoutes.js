const { homeAdd, homefind, homeupdate, FAQAdd, faqfind, faqupdate, policycondition, GetTeacherVideo, GetTeachers, faqDelete, teacherFAQAdd, teacherfaqfind, teacherfaqupdate, teacherfaqDelete, getCommission, Privacy } = require("../controller/HomeController");
const { upload } = require("../utils/FileUploader");
const router = require("express").Router();

router.post("/home/add", homeAdd);
router.get("/home/find", homefind);
router.post("/home/update", upload.fields([
    { name: 'hero_img_first', maxCount: 1 },
    { name: 'hero_img_second', maxCount: 1 },
    { name: 'course_img', maxCount: 1 }]), homeupdate);

router.post("/home/policy", policycondition)

// FAQ SECtion  
router.post("/home/faqAdd", FAQAdd);
router.get("/home/faqFind", faqfind);
router.post("/home/faqUpdate", faqupdate);
router.post("/home/delete", faqDelete);

// Teacher 
router.get("/home/teacher", GetTeachers)
router.get("/home/teacher/video", GetTeacherVideo)

//Teacher FAQ SECtion  
router.post("/teacher/faqAdd", teacherFAQAdd);
router.get("/home/teacher/faqFind", teacherfaqfind);
router.post("/teacher/faqUpdate", teacherfaqupdate);
router.post("/teacher/delete", teacherfaqDelete);

// Admi commission get route
router.get("/home/getCommission", getCommission);

router.get("/home/privacy" ,  Privacy)

module.exports = router;