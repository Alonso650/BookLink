require('dotenv').config();

var express = require("express");
var app = express();
var bodyParser = require("body-parser");
const mongoose = require("mongoose");
var flash = require("connect-flash");
var passport = require("passport");
var passportLocal = require("passport-local");
var methodOverride = require("method-override");
var Book = require("./models/books");
var User = require("./models/user");
var Comment = require("./models/comments");

// Requiring the Routes:
var commentRoutes = require("./routes/comments");
var bookRoutes = require("./routes/books");
var indexRoutes = require("./routes/index");

// creating the URL
var url = process.env.DATABASEURL || "mongodb://localhost/book_slugs";
mongoose.connect(url);

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());

// mongoose.set('useUnifiedTopology', true);
// mongoose.connect("mongodb://localhost/book_club_final", {useNewUrlParser: true});

mongoose.connect('mongodb://localhost/book_club',{
	useNewUrlParser: true,
	useUnifiedTopology: true
})
.then(()=> console.log("Connected to DB"))
.catch(error =>console.log(error.message));



app.locals.moment = require('moment');

// Passport configuration
app.use(require("express-session")({
	secret: "pimpzilla650",
	resave: false,
	saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new passportLocal(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// user/error/success configuration 
app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});

app.use("/", indexRoutes);
app.use("/books/:slug/comments", commentRoutes);
app.use("/books", bookRoutes);

app.listen(3000, () =>{
	console.log("The book server has started")
});