const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require("ejs-mate");

//Middlewares
app.set("view engine","ejs");
app.set("views", path.join(__dirname,"views"));
app.use(express.urlencoded({extended : true}));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));


// Landing Page
app.get("/", (req,res) =>{
    res.render("landing.ejs");
});

//Server Check
app.listen(8080, () => {
    console.log("Listening to port successfully!");
});

//#000000,#92DCE5,#EEE5E9,#7C7C7C,#D64933...this should be the color palette and make landing page for both dark and light theme with a cool animation toggle with the given color scheme only. 