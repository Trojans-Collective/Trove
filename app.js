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
        let { username, email, password } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            req.flash("error", "Email or username already in use");
            return res.redirect("/signin");
        }

        const newUser = new User({ email, username });
        const registeredUser = await User.register(newUser, password);
        console.log("User registered:", registeredUser);
        
        req.login(registeredUser, (err) =>{
            if(err){
                console.log("Login error after signup:", err);
                return res.redirect("/signin");
            }
            res.redirect("/home");
        });  
    }catch(e){
        console.log("Signup error:", e.message);
        req.flash("error", e.message);
        res.redirect("/signin");
    }
});

// Complete onboarding - saves profile information collected from createProf.ejs
app.post("/complete-onboarding", async (req, res) => {
    try {
        // Get data from form - handling multi-select arrays
        const { 
            email, 
            password, 
            username,
            name, 
            college, 
            year, 
            domain, 
            experience, 
            rank, 
            why, 
            builds, 
            github, 
            linkedin, 
            discovered, 
            commit 
        } = req.body;

        // Convert single values to arrays if needed (FormData sends multiple values as array)
        const domainArray = Array.isArray(domain) ? domain : [domain].filter(d => d);
        const whyArray = Array.isArray(why) ? why : [why].filter(w => w);

        // Create new user with email and password if not already signed up
        const newUser = new User({
            email: email.toLowerCase().trim(),
            username: username || email.split('@')[0], // fallback username
            displayName: name,
            institution: {
                name: college,
                type: "college"
            },
            academicYear: year,
            domains: domainArray,
            experienceRange: experience,
            selfDeclaredRank: rank,
            primaryGoals: whyArray,
            firstBuildStory: builds,
            githubHandle: github,
            linkedinUrl: linkedin || '',
            discoveredVia: discovered,
            consistencyPledge: commit,
            onboardingComplete: true
        });

        // Register user with password using passport-local-mongoose
        const registeredUser = await User.register(newUser, password);
        console.log("User registered with onboarding:", registeredUser);

        // Auto-login after registration
        req.login(registeredUser, (err) => {
            if (err) {
                console.log("Login error after onboarding:", err);
                return res.redirect("/signin");
            }
            res.redirect("/home");
        });

    } catch (e) {
        console.log("Onboarding error:", e.message);
        res.status(400).json({ 
            success: false, 
            error: e.message 
        });
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








//#000000,#92DCE5,#EEE5E9,#7C7C7C,#D64933...this should be the color palette 