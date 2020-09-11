var express = require("express");
var router = express.Router({mergeParams: true});
var Book = require("../models/books");
var Comment = require("../models/comments");
var middleware = require("../middleware");

// NEW COMMENT ROUTE
router.get("/new", middleware.isLoggedIn, function(req, res){
	// find the book by id
	console.log(req.params.slug);
	Book.findOne({slug: req.params.slug}, function(err, book){
		if(err){
			req.message('error', err.message);
			console.log(err);
		} else{
			res.render("comments/new", {book: book})
		}
	});
});


// CREATE COMMENT ROUTE
router.post("/", middleware.isLoggedIn, function(req, res){
	// lookup book using ID
	book.findOne({slug: req.params.slug}, function(err, book){
		if(err){
			req.message('error', err.message);
		} else{
			Comment.create(req.body.comment, function(err, comment){
				if(err){
					req.flash("error", "Something went wrong");
					console.log(err);
				} else{
					// add username and id to comment
					comment.author.id = req.user._id;
					comment.author.username = req.user._username;
					
					// save comment
					comment.save();
					
					book.comments.push(comment);
					book.save();
					console.log(comment);
					req.flash("success", "Successfully added comment");
					res.redirect('/books/' + book.slug);
				}
			});
		}
	});
});


//COMMENT EDIT ROUTE
router.get("/:comment_id/edit", middleware.checkCommentOwner, function(req, res){
	Comment.findById(req.params.comment_id, function(err, foundComment){
		if(err){
			res.redirect("back");
		} else{
			res.render("comments/edit", {book_slug: req.params.slug, comment: foundComment});
		}
	});
});


// COMMENT UPDATE ROUTE
router.put("/:comment_id", middleware.checkCommentOwner, function(req, res){
	Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
		if(err){
			res.redirect("back");
		} else{
			req.flash("success", "Comment Updated");
			res.redirect("/books/" + req.params.slug);
		}
	});
});


// COMMENT DESTROY ROUTE
router.delete("/:comment_id", middleware.checkCommentOwner, function(req, res){
	Comment.findByIdAndRemove(req.params.comment_id, function(err){
		if(err){
			res.redirect("back");
		} else{
			req.flash("success", "Comment Deleted");
			res.redirect("/books/" + req.params.slug);
		}
	});
});


module.exports = router;