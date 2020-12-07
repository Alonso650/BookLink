var express = require("express");
var router = express.Router();
var passport = require("passport");
var nodemailer = require("nodemailer");
var User = require("../models/user");
var { isLoggedIn } = require("../middleware");
var async = require("async");
var Book = require("../models/book");
var crypto = require("crypto");

// the root route
router.get("/", function(req, res){
	res.render("landing");
});

// display the register form
router.get("/register", function(req, res){
	res.render("register", {page: 'register'});
});

// handling the sign up logic
router.post("/register", function(req, res){
	var newUser = new User(
		{
			username: req.body.username,
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			email: req.body.email,
			avatar: req.body.avatar
		}
	);
	if(req.body.adminCode == "Pimpzilla650!"){
		newUser.isAdmin = true;
	}
	User.register(newUser, req.body.password, function(err, user){
		if(err){
			req.flash("error", err.message);
			return res.render("register", {"error": err.message});
		}
		passport.authenticate("local")(req, res, function(){
			req.flash("success", "Successfully signed up! Welcome " + req.body.username + "!");
			res.redirect("/books");
		});
	});
});

// display login form
router.get("/login", function(req, res){
	res.render("login", {page: 'login'});
});


//handling the login logic
router.post("/login", passport.authenticate("local",
			{
				successRedirect: "/books",
				failureRedirect: "/login",
				failureFlash: true,
				successFlash: "Bienvendo a la Clubz"
            }), function(req, res){
	
});


// the logout router
router.get("/logout", function(req, res){
	req.logout();
	req.flash("success", "Logged out!");
	res.redirect("/books");
});

//forgot password router
router.get("/forgot", function(req, res){
	res.render("forgot");
});


// handling the forgot password logic
router.post("/forgot", function(req, res, next){
	async.waterfall([
		function(done){
			crypto.randomBytes(20, function(err, buf){
				var token = buf.toString('hex');
				done(err, token);
			});
		},
		function(token, done){
			User.findOne({ email: req.body.email }, function(err, user){
				if(!user){
					req.flash("error", "No account with that email address exists");
					return res.redirect("/forgot");
				}
				user.resetPasswordToken = token;
				user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
				
				user.save(function(err){
					done(err, token, user);
				});
			});
		},
		function(token, user, done){
			var smtpTransport = nodemailer.createTransport({
				service: 'Gmail',
				auth:{
					user: 'hectoralonzotorres@gmail.com',
					pass: 'pimpzilla650'
				}
			});
			var mailOptions = {
				to: user.email,
				from: 'hectoralonzotorres@gmail.com',
				subject: 'Password Reset Requested',
				text: 'You are receiving this because you (or someon else) has requested to reset the password for your account.\n\n' + 
					'Please click on the following link, or paste this in your browser to complete the process.\n\n' +
					'http:/' + req.headers.host + '/reset/' + token + '\n\n' +
					'If you did not request this message, please ignore this email and your password will be unchanged.\n'
			};
			smtpTransport.sendMail(mailOptions, function(err){
				console.log('mail sent');
				req.flash('success', 'An e-mail has been sent out to ' + user.email + ' with further instructions.' );
				done(err, 'done');
			});
		}
	], function(err){
		if(err) return next(err);
		res.redirect('/forgot');
	});
});



router.get('/reset/:token', function(req, res){
	User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user){
		if(!user){
			req.flash("error", "Password reset token is invalid or has expired.");
			return res.redirect("/forgot");
		}
		res.render('reset', {token: req.params.token});
	});
});


router.post('/reset/:token', function(req, res){
	async.waterfall([
		function(done){
			User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user){
				if(!user){
					req.flash('error', 'Password reset token is invalid or has expired.');
					return res.redirect("back");
				}
				if(req.body.password === req.body.confirm){
					user.setPassword(req.body.password, function(err){
						user.resetPasswordToken = undefined;
						user.resetPasswordExpires = undefined;
						
						user.save(function(err){
							req.logIn(user, function(err){
								done(err, user);
							});
						});
					})
				} else{
					req.flash('error', "Passwords do not match");
					return res.redirect('back');
				}
			});
		},
		function(user, done){
			var smtpTransport = nodemailer.createTransport({
				service: 'Gmail',
				auth:{
					user: 'hectoralonzotorres@gmail.com',
					pass: 'pimpzilla650'
				}
			});
			var mailOptions = {
				to: user.email,
				from: 'hectoralonzotorres@gmail.com',
				subject: "Password Successfully Changed!",
				text: 'Hello,\n\n' +
					'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
			};
			smtpTransport.sendMail(mailOptions, function(err){
				req.flash('success', 'Yay, Your password changed and now you will prolly forget again eventually.');
				done(err);
			});
		}
	], function(err){
		res.redirect('/books');
	});
});


// Users profile
router.get("/users/:id", function(req, res){
	User.findById(req.params.id, function(err, foundUser){
		if(err){
			req.flash("error", "Something went wrong lol");
			return res.redirect("/");
		}
		Book.find().where("author.id").equals(foundUser._id.exec(function(err, books){
			if(err){
				req.flash("error", "Something went wrong.");
				return res.redirect("/");
			}
		res.render("users/show", {user: foundUser, books: books});
		}));
	});
});




module.exports = router;