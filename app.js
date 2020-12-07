require('dotenv').config();

var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var flash = require("connect-flash");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var methodOverride = require("method-override");
var Book = require("./models/book");
var User = require("./models/user");
var Comment = require("./models/comment");

var commentRoutes = require("./routes/comments");
var bookRoutes = require("./routes/books");
var indexRoutes = require("./routes/index");

mongoose.connect('mongodb+srv://Alonso650:pimpzilla650@cluster0.fmuux.mongodb.net/<dbname>?retryWrites=true&w=majority',{
	useNewUrlParser: true,
	useCreateIndex: true
}).then(() => {
	console.log('Connected to DB');
}).catch(err =>{
	console.log('ERROR: ', err.message);
});

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());

app.locals.moment = require('moment');
app.use(require("express-session")({
	secret: "pimpzilla",
	resave: false,
	saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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