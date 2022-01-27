const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieparser = require("cookie-parser");

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieparser());
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/urls", (req, res) => {
console.log(req.cookies);
  const templateVars = { 
    urls: urlDatabase,
    username: req.cookies["username"],
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {     
    longURL: req.body.longURL  
    };
  res.redirect(`/urls/${shortURL}`);         
});

app.post("/urls/:shortURL/edit", (req, res) => {
  let shortURL = req.params.shortURL;       
  let longURL = req.body.longURL;       
  urlDatabase[shortURL] = longURL;
  console.log("hello", shortURL, longURL);
  res.redirect('/urls');
})

app.post("/urls/:shortURL/delete", (req, res) => {
   delete urlDatabase[req.params.shortURL];
   res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
  };
  res.render("urls_new", templateVars);
});


app.post("/login", (req, res) => {
    res.cookie('username', req.body.username);
    res.redirect('/urls');
})

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
})

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase,
    username: req.cookies["username"]
  };
  res.render("urls_show", templateVars);
});


app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.send(JSON.stringify(urlDatabase));
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


const generateRandomString = function() {
  const str = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
     str += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return str;
};


app.get("/urls/:shortURL", (req, res) => {
  const shortURL = generateRandomString();
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});