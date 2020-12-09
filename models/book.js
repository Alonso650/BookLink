var mongoose = require("mongoose");

//Schema Setup
var bookSchema = new mongoose.Schema({
	title:{
		type: String,
		required: "Book title cannot be blank."
	},
	image: String,
	imageId: String,
	genre: String,
	description: String,
	bookAuthor:{
		type: String,
		requried: "Book author cannot be blank."
	},
	createdAt: {type: Date, default: Date.now},
	author:{
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
	},
	comments:[
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Comment"
		}
	],
	slug:{
		type: String,
		unique: true
	}
});

// add a slug before the book gets saved to the database
bookSchema.pre('save', async function(next){
	try{
		// check if a new campground is being saved, or if the campground name is
		// being modified
		if(this.isNew || this.isModified("title")){
			this.slug = await generateUniqueSlug(this._id, this.title);
		}
		next();
	} catch(err){
		next(err);
	}
});

var Book = mongoose.model("Book", bookSchema);

module.exports = Book;

async function generateUniqueSlug(id, bookName, slug){
	try{
		// generate the initial slug
		if(!slug){
			slug = slugify(bookName);
		}
		// check if a campground with the slug already exists
		var book = await Book.findOne({slug: slug});
		// check if a book was found or if the found book is the current book
		if(!book || book._id.equals(id)){
			return slug;
		}
		// if not unique, generate a new slug
		var newSlug = slugify(bookName);
		//check again by calling the function recursively
		return await generateUniqueSlug(id, bookName, newSlug);
	} catch(err){
		throw new Error(err);
	}
}

function slugify(text) {
    var slug = text.toString().toLowerCase()
      .replace(/\s+/g, '-')        // Replace spaces with -
      .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
      .replace(/\-\-+/g, '-')      // Replace multiple - with single -
      .replace(/^-+/, '')          // Trim - from start of text
      .replace(/-+$/, '')          // Trim - from end of text
      .substring(0, 75);           // Trim at 75 characters
    return slug + "-" + Math.floor(1000 + Math.random() * 9000);  // Add 4 random digits to improve uniqueness
}