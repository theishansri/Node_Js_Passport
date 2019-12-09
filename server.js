if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const express = require('express');
const app = express();
const bcrypt = require('bcryptjs');
const flash = require('express-flash');
const session = require('express-session');
const passport = require('passport');
const methodOverride = require('method-override');
const initializePassport = require('./passport-config');

const PORT = process.env.PORT || 3000;

const users = [];
//Set View Engine
app.set('view-engine', 'ejs');
//Body Parser
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));
//Initliaze Passport
initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
);
app.get('/', checkAuth, (req, res) => {
  res.render('index.ejs', { name: req.user.name });
});
app.get('/login', notCheckAuth, (req, res) => {
  res.render('login.ejs');
});
app.post(
  '/login',
  notCheckAuth,
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
  })
);
app.post('/register', notCheckAuth, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashpassword = await bcrypt.hash(password, 10);
    users.push({
      id: Date.now().toString(),
      name,
      email,
      password: hashpassword
    });
    res.redirect('/login');
  } catch (err) {
    console.log(err.message);
    res.redirect('/register');
  }
});

app.get('/register', notCheckAuth, (req, res) => {
  res.render('register.ejs');
});
app.delete('/logout', (req, res) => {
  req.logOut();
  return res.redirect('/login');
});
function checkAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/login');
  }
}
function notCheckAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  next();
}
app.listen(PORT, () => console.log('server running on port ', PORT));
