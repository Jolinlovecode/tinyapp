const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieparser = require("cookie-parser");
const bcrypt = require('bcryptjs');


app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieparser());
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

const getUserByEmail = function(email) {
  const validUsers = Object.values(users);
  for (const user of validUsers) {
    if (user.email === email) {
      return user;
    }
  } 
  return null;
}

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



app.get('/login', (req,res) => {
  const id = req.cookies['user_id'];
  const user = users[id];
  if (user) {
    return res.redirect("/urls");
  }
  res.render('login', { user });
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email);
  if (!user || !user.password === password) {
    return res.send("Invalid credentials.Please <a href='/login'>try again</a>");
  }
  res.cookie("user_id", user.id);
  res.redirect('/urls');
})

app.get('/register', (req,res) => {
  const id = req.cookies['user_id'];
  const user = users[id];
  const templateVars = {
    user,
  }
  res.render('register', templateVars);
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    return res.send("Email or password isn't available.Please <a href='/register'>try again</a>");
  }
  const user = getUserByEmail(email);
  if (user) {
    return res.status(400).send("Email has already existed. Please <a href='/register'>try again</a>");
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
  res.cookie("user_id", newID);
  res.redirect('/urls');
})
// private /url endpoints
app.get("/urls", (req, res) => {
  const userID = req.cookies.user_id;
  console.log(userID)
  const templateVars = {
    user: users[userID],
    urls: getUrlsForUser(userID),
  };

  if (!users[userID]) {
    return res.redirect('/login');
  }
  res.render("urls_index", templateVars);
});

app.get("urls/new", (req, res) => {
  const id = req.cookies['user_id'];
  const user = users[id];
  if (!user) {
    return res.redirect("/login");
  }

  res.render("urls_new", { user });
});

app.post("/urls", (req, res) => {
  
  const userID = req.cookies['user_id'];
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
  const userID = req.cookies['user_id'];
  const user = users[userID];
  if(!userID || !user) {
    return res.status(401).send("You must <a href='/login'>login</a>");
  }

  const shortURL =req.params.shortURL;
  const url = urlDatabase[shortURL];
  if (url.userID !== user.id) {
    return res.status(400).send("You can't access to this URL. Please <a href='/login'>login</a>")
  }
})

app.post("/urls/:shortURL/edit", (req, res) => {
  let shortURL = req.params.shortURL;       
  let longURL = req.body.longURL;       
  urlDatabase[shortURL] = longURL;
  console.log("hello", shortURL, longURL);
  res.redirect('/urls');
})

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.cookies["user_id"];
  const user = users[userID];

  const url = urlDatabase[shortURL];
  if (url && url.userID === userID) {
    delete urlDatabase[shortURL];
  }
  res.redirect("/urls");
});


app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});