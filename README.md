Live link : https://blogpost-x2fi.onrender.com


# BLOG_POST
Created this using Node Js, Ejs, Express, MongoDB, Passport.js
NodeJs is used for all the work , with the help of express and Ejs
Passport.Js handles user's authentication , login and signup , it also saves User's session till the user Logs out or closes the browser.
Made 3 Schema, UserSchema, CommentSchema and BlogSchema
UserSchema is for Users to be added to the database and save the individual users data privately 
CommentSchema is for all the comments 
BlogSchema is for all the blog posts
UserSchema is populated with Blogschema so that whatever blog a user creates , that can be displayed in his/her page privately , not publicly
similarly Blog Schema is populated with the CommentSchema to save the Comments of the User's individual blogs
