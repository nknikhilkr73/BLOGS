const express = require('express');
const ejs = require("ejs");
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require("express-session");
mongoose.set("strictQuery", true);
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");


const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
    session({
      secret: "keyboard cat",
      resave: false,
      saveUninitialized: true,
    })
  );

  app.use(passport.initialize());
app.use(passport.session());


mongoose.connect('mongodb+srv://nknikhilkr73:lTimO8ISQVSlN4Jq@cluster0.zoeey6c.mongodb.net/blogss', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});


const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    blogs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Blog'
      }]
  });

  UserSchema.plugin(passportLocalMongoose);
UserSchema.plugin(findOrCreate);
  
  const BlogSchema = new mongoose.Schema({
    title: String,
    content: String,
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
      }]
  });
  
  const CommentSchema = new mongoose.Schema({
    content: String,
   date: {
         type: Date,
         default: Date.now
      },
   blog: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Blog'
      }
    })
  
  const User = mongoose.model('User', UserSchema);

passport.use(User.createStrategy());
passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user.id);
  });
});

passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      console.error(err);
      done(err, null);
    }
  });

  const Blog = mongoose.model('Blog', BlogSchema);
  const Comment = mongoose.model('Comment', CommentSchema);
  

  app.get('/', (req, res) => {
    res.render("home");
  });
  app.get("/login", function (req, res) {
    res.render("login");
  });
  app.get("/register", function (req, res) {
    res.render("register");
  });
  app.get("/logout", function (req, res) {
    req.logout(() => {});
    res.redirect("/");
  });



  // Create a new Blog
app.post('/blog', async function (req, res) {
    if (req.isAuthenticated() === false) {
        return res.redirect("/login");
      }
    const blog = new Blog({
      title: req.body.title,
      content: req.body.content,
    });
    try {
        await blog.save();
        
        await User.findOneAndUpdate(
          {_id:req.user._id},
          {
            $push:{blogs:blog._id},
          },
          {new:true},
        );

    res.redirect("/blog");
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
  });
  //Get the User's personal blogs
  app.get('/blog', async (req, res) => {
    Blog.find({_id:{$in:req.user.blogs}}).then((blogs)=>{
        
        res.render("blog", {blogs});
    })
  });
//////////////////////////////////////////////////////
  // Get all Blogs
  app.get('/allblogs', async (req, res) => {
    const blogs = await Blog.find();
    res.render("allblogs",{blogs});
  })
  

// Create a new Comment
app.post('/comments', async (req, res) => {
    if (req.isAuthenticated() === false) {
      return res.redirect("/login");
    }
    const comment = new Comment({
      content: req.body.content,
      blog: req.body.blogId, // set the blog property of the comment to the blog ID passed in the form data
    });
    try {
      await comment.save();
      await Blog.findOneAndUpdate(
        { _id: req.body.blogId },
        {
          $push: { comments: comment._id }, // push the comment ID into the comments array of the associated blog
        },
        { new: true }
      );
      res.redirect(`/comments/${req.body.blogId}`);
    } catch (error) {
      console.log(error);
      res.redirect("/");
    }
  });
  


//   Get all Comments
  app.get('/comments/:blogid', async (req, res) => {
    const comments = await Comment.find({ blog: req.params.blogid });
    console.log(req.params.blogid);
    res.render("comments", {comments , blogId: req.params.blogid});
  });


//Getting all the  comments of a blog
app.get('/blogComments/:blogid', async (req, res) => {
    try {
      const blog = await Blog.findById(req.params.blogid).populate('comments');
      const comments = blog.comments;
      res.render("allComments", { comments });
    } catch (error) {
      console.log(error);
      res.redirect("/");
    }
  });


  //  Implement the route to get n-th level friends of a given user
//

//Register the user
  app.post("/register", function (req, res) {
    User.register(
      { username: req.body.username },
      req.body.password,
      function (err, user) {
        if (req.body.username === "") {
          res.send(
            "<script>alert('Please Enter a Username'); window.location.href='/register';</script>"
          );
        } else if (req.body.password === "") {
          res.send(
            "<script>alert('Please enter the password'); window.location.href='/register';</script>"
          );
        } else if (err) {
          res.send(
            "<script>alert('Username already exists'); window.location.href='/';</script>"
          );
        } else {
          passport.authenticate("local")(req, res, function () {
            res.redirect("/allblogs");
          });
        }
      }
    );
  });
  
//Login of the User
  
app.post("/login", function (req, res) {
    const user = new User({
      username: req.body.username,
      password: req.body.password,
    });
  
    User.findOne({ username: req.body.username }, function (err, foundUser) {
      if (req.body.username === "") {
        res.send(
          "<script>alert('Please Enter a Username'); window.location.href='/login';</script>"
        );
      } else if (req.body.password === "") {
        res.send(
          "<script>alert('Please enter the password'); window.location.href='/login';</script>"
        );
      } else if (err) {
        console.log(err);
        res.send(
          "<script>alert('Server Error'); window.location.href='/login';</script>"
        );
        console.log(err);
      } else {
        if (foundUser) {
          req.login(user, function (err) {
            if (err) {
              res.send(
                "<script>alert('Wrong username or password'); window.location.href='/login';</script>"
              );
            } else {
              passport.authenticate("local")(req, res, function () {
                res.redirect("/allblogs");
              });
            }
          });
        } else {
          res.send(
            "<script>alert('This username is not registered'); window.location.href='/';</script>"
          );
        }
      }
    });
  });
  
  // Step 14: Start the server
  app.listen(process.env.PORT ||3000, () => {
    console.log('Server listening on port 3000');
  });
  