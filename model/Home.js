const mongoose = require("mongoose");

const homeSchema = mongoose.Schema({

    hero_img_first: {
        type: String,
        default: ""
    },
    hero_img_second: {
        type: String,
        default: ""
    },
    hero_heading: {
        type: String,
        default: ""
    },

    best_teacher: {
        type: String,
        default: ""
    },
    learn: {
        type: String,
        default: ""
    },
    course_heading: {
        type: String,
        default: ""
    },
    course_paragraph: {
        type: String,
        default: ""
    },
    course_img: {
        type: String,
        default: ""
    },
    term_contdition :{
        type :String ,
        default :null
    },
    privcay_policy :{
        type :String ,
        default :null
    }
});

module.exports = mongoose.model("home", homeSchema);