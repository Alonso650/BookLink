require('dotenv').config();
var MongoClient = require('mongodb').MongoClient;
var ocdkey = process.env.OCD_API_KEY;

var express = require("express");
var router = express.Router();
var async = require("async");
var Book = require("../models/books");
var User = require("../models/user");
var middleware = require("../middleware");
var Comment = require("../models/comments");

var multer = require("multer");
var storage = multer.diskStorage({
	filename: function(req, file, callback){
		callback(null, Date.now() + file.orginalname);
	}
});
var imageFilter = function(req, file, cb){
	// accept image files only
	if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)){
		return cb(new Error('Only image files are allowed'), false);
	}
	cb(null, true);
};

var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({
	cloud_name: 'alonso650',
	// api_key: process.env.CLOUDINARY_API_KEY,
	api_key: 293184147984556,
	// api_secret: process.env.CLOUDINARY_API_SECRET
	api_secret: 'IPg2w_heyt4HbC2vIod8uRM6Jbg'
});

// MongoClient.connect(proceess.env.DB_CONN, function(err, db){
// 	if(!err){
// 		console.log("We are connected");
// 	}
// });


// INDEX ROUTER
router.get("/", function(req, res){
	var perPage = 8;
	var pageQuery = parseInt(req.query.page);
	var pageNumber = pageQuery ? pageQuery : 1;
	var noMatch = null;
	
	if(req.query.search && req.xhr){
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		Book.find({name: regex}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function(err, allBooks){
			Book.count({name: regex}).exec(function(err, count){
				if(err){
					console.log(err);
					res.redirect("back");
				} else{
					if(allBooks.length < 1){
						noMatch = "No books match that query, please try again.";
					}
					res.render("books/index",{
						books: allBooks,
						current: pageNumber,
						pages: Math.ceil(count/perPage),
						noMatch: noMatch,
						search: req.query.search
					});
				}
			});
		});
	} else {
		// get all books from DB
		Book.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function(err, allBooks){
			Book.count().exec(function(err, count){
				if(err){
					console.log(err);
				} else{
					res.render("books/index",{
						books: allBooks,
						current: pageNumber,
						pages: Math.ceil(count/perPage),
						noMatch: noMatch,
						search: false
					});
				}
			});
		});
	}
});


// CREATE ROUTE - add new campground to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res){
	cloudinary.uploader.upload(req.file.path, function(err, result){
		if(err){
			req.flash('error', err.message);
			return res.redirect('back');
		}
		//add cloudinary url for the image to the book object under image property
		req.body.book.image = result.secure_url;
		// add image's public_id to book object
		req.body.book.imageId = result.public_id;
		// add author to book
		req.body.book.author = {
			id: req.user._id,
			username: req.user.username
		}
		
		Book.create(req.body.book, function(err, book){
			if(err){
				req.flash('error', err.message);
				return res.redirect('back');
			}
			res.redirect('/books/' + book.slug);
		});
	});
});


// NEW - show form to create a new book entry
// This usually gets declared first
router.get("/new", middleware.isLoggedIn, function(req, res){
	res.render("books/new");
});


// SHOW - shows more infor about one book entry
router.get("/:slug", function(req, res){
	// find the book with the provided ID
	Book.findOne({slug: req.params.slug}).populate("comments").exec(function(err, foundBook){
		if(err || !foundBook){
			req.flash("error", "Book was not found");
			res.redirect("back");
		} else{
			console.log(foundBook);
			// render shows template with that book 
			res.render("books/show", {book: foundBook});
		}
	});
});

// EDIT BOOK ROUTE
router.get("/:slug/edit", middleware.checkBookOwner, function(req, res){
	Book.findOne({slug: req.params.slug}, function(err, foundBook){
		if(err){
			req.flash("error", "Book was not found");
			res.redirect("back");
		} else{
			// render show template with that book
			res.render("books/edit", {book: foundBook});
			}
	});
});


router.put("/:slug", upload.single('image'), middleware.checkBookOwner, function(req, res){
	//find and update the correct book entry
	Campground.findOne({slug: req.params.slug}, async function(err, book){
		if(err){
			req.flash("error", err.message);
			res.redirect("back");
		} else{
			if(req.file){
				try{
					await cloudinary.v2.uploader.destroy(book.imageId);
					var result = await cloudinary.v2.uploader.upload(req.file.path);
					book.imageId = result.public_id;
					book.image = result.secure_url;
				} catch(err){
					req.flash("error", err.message);
					return res.redirect("back");
				}
			}
			book.name = req.body.book.name;
			book.description = req.body.book.description;
			book.save();
			req.flash("success", "Successfully Updated!");
			res.redirect("/books/" + book.slug);
		}
	});
});

// DESTROY BOOK ROUTE
router.delete("/:slug", middleware.checkBookOwner, function(req, res){
	Book.findOneAndRemove({slug: req.params.slug}, async function(err, book){
		if(err){
			req.flash("error", err.message);
			return res.redirect("back");
		}
		try{
			await cloudinary.v2.uploader.destroy(book.imageId);
			book.remove();
			req.flash("success", "Book deleted successfully");
			res.redirect("/books");
		} catch(err){
			if(err){
				req.flash("error", err.message);
				return res.redirect("back");
			}
			
		}
	});
});


function escapeRegex(text){
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;




