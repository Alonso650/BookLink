var Book = require("../models/book");
var Comment = require("../models/comment");

var middlewareObj = {};

middlewareObj.checkBookOwnership = function(req, res, next){
	if(req.isAuthenticated()){
	//does user own the book?
		Book.findOne({slug: req.params.slug}, function(err, foundBook){
			if(err || !foundBook){
				req.flash("error", "Book not found");
				res.redirect("/books")
			} else{
				if(foundBook.author.id.equals(req.user._id) || req.user.isAdmin){
					next();
				} else{
					req.flash("error", "You don't have permission to do that");
					res.redirect("back");
				}
			}
			});
		} else{
			req.flash("error", "You need to be logged in to do that");
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
