const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const { getUserByEmail } = require('./helpers.js');
const PORT = 8080;

// view engine setup
app.set("view engine", "ejs");

// middleware
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["abcde"],

  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

//urlDatabase data
const urlDatabase = {
  "b2xVn2": {
    longURL:"http://www.lighthouselabs.ca",
    userID: "userOneID"
  },
  "9sm5xK": {
    longURL:"http://www.google.com",
    userID: "userTwoID"
  }
};

// Users Data
const users = {
  "userOneID": {
    id: "userOneID",
    email: "userone@email.com",
    password: "helloworld"
  },
  "userTwoID": {
    id: "userTwoID",
    email: "usertwo@email.com",
    password: "morning"
  },
}
// get longURL by ID
const getUrlsForUser = function(ownerID) {
  const result = {};
  for (const key in urlDatabase) {
    if (urlDatabase[key].userID === ownerID) {
      result[key] = urlDatabase[key]
    }
  }
  return result;
}

const generateRandomString = function() {
  let str = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
     str += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return str;
};

// routes
app.get('/', (req,res) => {
  const id = req.session['user_id'];
  const user = users[id];
  if (user) {
    return res.redirect("/urls");
  } 
  return res.redirect("/login");
  
});

//login
app.get('/login', (req,res) => {
  const id = req.session['user_id'];
  const user = users[id];
  if (user) {
    return res.redirect("/urls");
  }
  res.render('login', { user });
});


app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, users);
  if (!user || !user.password === password) {
    return res.send("Invalid credentials.Please <a href='/login'>try again</a>");
  }
  req.session.user_id = user.id;
  res.redirect('/urls');
})

//register
app.get('/register', (req,res) => {
  const id = req.session.user_id;
  const user = users[id];
  if (user) {
    return res.redirect('/urls');
  }
  res.render('register', {user});
});


app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    return res.send("Email or password isn't available.Please <a href='/register'>try again</a>");
  }
  const user = getUserByEmail(email, users);
  if (user) {
    return res.status(400).send("Email has already existed. Please <a href='/login'>try again</a>");
  }
  const newID = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = { 
    id: newID,
    email: email,
    password: hashedPassword
   };
  
  //Add newUser to the users object.
  users[newID] = newUser;
  req.session.user_id = newID;
  res.redirect('/urls');
})

// private /url endpoints
app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    user: users[userID],
    urls: getUrlsForUser(userID),
  };
  if (users[userID]) {
    return res.render("urls_index", templateVars);
  }
  return res.status(401).send("You need to <a href='/login'>login</a> first");
});

//route  
app.get("/u/:id", (req, res) => {
  const id = req.session.user_id;   
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL].longURL
  
  if (id) {
    return res.redirect(longURL);
  }
  return res.status(400).send("error");
})



//route 
app.get("/urls/new", (req, res) => {
  const id = req.session.user_id;
  const user = users[id];
  if (!user) {
    return res.redirect("/login");
  }
  res.render("urls_new", { user });
});


app.post("/urls/new", (req, res) => {
  // check that field is not empty
  const userID = req.session.user_id;
  const user = users[userID];
  if (!user) {
    return res.redirect('/login');
  }

  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  urlDatabase[shortURL] = { userID, longURL };
  res.redirect(`/urls/${shortURL}`);         
});


app.get("/urls/:shortURL", (req,res) => {
  const userID = req.session.user_id;
  const user = users[userID];

  if(!userID || !user) {
    return res.status(401).send("You must <a href='/login'>login</a>");
  }
  
  const url = urlDatabase[req.params.shortURL];
  const templateVars = {
    user: users[userID],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  };

  if (url.userID !== user.id) {
    return res.status(400).send("You can't access to this URL. Please <a href='/login'>login</a>")
  }
  // params means from URL bar up top. and body is from a form:register, login
  res.render('urls_show', templateVars);
});

app.post("/urls/:shortURL/edit", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = req.body.longURL;
  urlDatabase[shortURL].longURL = longURL;
  res.redirect('/urls');
})

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session["user_id"];
  const user = users[userID];

  const url = urlDatabase[shortURL];
  if (url && url.userID === userID) {
    delete urlDatabase[shortURL];
  }
  res.redirect("/urls");
});


app.post("/logout", (req, res) => {
  delete req.session.user_id;
  res.redirect('/urls');
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

