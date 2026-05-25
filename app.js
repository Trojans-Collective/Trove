const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
// const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");

const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");


//Establishing Connection
main()
.then(() => console.log("DB Connection Successful!"))
.catch(err => console.log(err));


async function main() {
  await mongoose.connect("mongodb://localhost:27017/trove");
};


// MongoStore Options
const MongoStore = require("connect-mongo").default;

const store = new MongoStore({
    mongoUrl: "mongodb://localhost:27017/trove",
    touchAfter: 24 * 3600,
});
store.on("error", (err)=>{
    console.log("Error in MONGO SESSION STORE!",err);
});

//Session Options
const sessionOptions = {
    store,
    secret: "ThisIsASecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,  //To avoid cross-site scripting attacks
    }
};


//Middlewares
app.set("view engine","ejs");
app.set("views", path.join(__dirname,"views"));
app.use(express.urlencoded({extended : true}));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));
app.use(methodOverride("_method"));


//Session middlewares
app.use(session(sessionOptions));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

// Passport Configuration
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    // req.flash("error", "You must be signed in to access this page");
    res.redirect("/signin");
};


// Landing Page
app.get("/", (req,res) =>{
    res.render("landing.ejs");
});

app.get("/createProfile", (req,res) =>{
    res.render("createProf.ejs");
});


app.get("/signin", (req,res) =>{
    res.render("signin.ejs", { messages: req.flash() });
});

app.post("/signin", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) {
            console.log("Passport error:", err);
            return next(err);
        }
        if (!user) {
            console.log("Authentication failed:", info?.message);
            req.flash("error", info?.message || "Invalid username or password");
            return res.redirect("/signin");
        }
        req.logIn(user, (err) => {
            if (err) {
                console.log("Login error:", err);
                return next(err);
            }
            res.redirect("/home");
        });
    })(req, res, next);
});

app.post("/signup", async (req,res) =>{
    try{
        let { username,email,password} = req.body;
        const newUser = new User({email,username});
        const registeredUser = await User.register(newUser,password);
        console.log("User registered:", registeredUser);
        req.login(registeredUser,(err) =>{
            if(err){
                console.log("Login error after signup:", err);
                return res.redirect("/signin");
            }
            res.redirect("/home");
        });  
    }catch(e){
        console.log("Signup error:", e.message);
        res.redirect("/signin");
    }
});


app.get("/home", isLoggedIn, (req,res) =>{
    res.render("home.ejs",{user: req.user});
});

app.get("/logout", (req,res) =>{
    req.logout((err) =>{
        if(err){
            return next(err);
        }
        res.redirect("/");
    });
})

//Server Check
app.listen(8080, () => {
    console.log("Listening to port successfully!");
});








//#000000,#92DCE5,#EEE5E9,#7C7C7C,#D64933...this should be the color palette and make landing page for both dark and light theme with a cool animation toggle with the given color scheme only. 