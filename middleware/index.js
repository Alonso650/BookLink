var Book = require("../models/books");
var Comment = require("../models/comments");

var middlewareObj = {};

middlewareObj.checkBookOwner = function(req, res, next){
	if(req.isAuthenticated()){
		//does the user own the book posting?
		Book.findOne({slug: req.params.slug}, function(err, foundBook){
			if(err || !foundBook){
				req.flash("error", "Book was not found");
				res.redirect("/books");
			} else{
				// does the user own the book posting?
				if(foundBook.author.id.equals(req.user._id) || req.user.isAdmin){
					next();
				} else{
					req.flash("error", "You do not have permission to do that");
					res.redirect("back");
				}
			}
		});
	} else{
		req.flash("error", "You must be logged in to perform that activity");
		res.redirect("back");
	}
}

middlewareObj.checkCommentOwner = function(req, res, next){
	if(req.isAuthenticated()){
		//does the user own the posted comment?
		Comment.findById(req.params.comment_id, function(err, foundComment){
			if(err || !foundComment){
				req.flash("error", "Comment was not found");
				res.redirect("back");
			} else{
				// does the user own the posted comment?
				if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
					next();
				} else{
					req.flash("error", "You do not have permission to do that");
					res.redirect("back");
				}
			}
		});
	} else{
		req.flash("error", "You must be logged in to perform that activity");
		res.redirect("back");
	}
}


middlewareObj.isLoggedIn = function(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	req.flash("error", "You must be logged in to perfrom that action");
	res.redirect("/login");
}

module.exports = middlewareObj;