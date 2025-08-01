const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");

const errorController = require("./controllers/error");

const User = require("./models/user");

// Route imports
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
const { default: mongoose } = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require('csurf')
const flash = require('connect-flash')
const cookieParser = require("cookie-parser");

const MONGODB_URI =
  "mongodb+srv://felz:udosenfelicia@cluster0.bqgm6cv.mongodb.net/shop";

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collections: "sessions",
});
const csrfProtection = csrf()

// Set up Handlebars view engine
app.set("view engine", "ejs");
app.set("views", "views");

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);
app.use(csrfProtection)
app.use(flash())



app.use((req,res, next) => {
  if (!req.session.user || !req.session.user._id) {
    return next()
  }
  User.findById(req.session.user._id)
    .then(user => {
     req.user = user;
     next();
    })
  
  .catch(err => console.log(err))
})

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  res.locals.isAuthenticated = req.session.isLoggedIn;
  next();
});


// Routes
app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);


// 404 handler
app.use(errorController.get404);

mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    app.listen(3000);
  })
  .catch((err) => {
    console.log(err);
  });
