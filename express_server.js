const express = require("express");
const app = express();
const PORT = 8080;
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const { getUserByEmail, generateRandomString, getUrlsForUserID } = require('./helpers');
const { urlDatabase, users } = require('./database');

app.use(express.urlencoded({ extended: true }));

app.use(cookieSession({
  name: "session",
  keys: ["protectedKey"]
}));


app.set("view engine", "ejs");





//routes//


app.get("/", (req, res) => {
  const userID = req.session.user_id;
  // check if user is not logged in - if not, redirect to /login
  if (!userID) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});


// GET route 
app.get("/register", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    user: users[userID]
  };
  // check if user is logged in. If they are, redirect to /urls 
  if (userID) {
    res.redirect("/urls");
  }
  // if user is not logged in, they can access registration page
  res.render("register", templateVars);
});

// post route 
app.post("/register", (req, res) => {
  const userID = generateRandomString();
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  const hashedPassword = bcrypt.hashSync(userPassword, 10);
  const foundUser = getUserByEmail(userEmail, users);
  // if email or password fields are empty, send error message
  if (!userEmail || !userPassword) {
    return res.status(400).send(`${res.statusCode} error. Please enter valid email and password`)
  }
  if (foundUser) {
    return res.status(400).send(`${res.statusCode} error. User with email ${userEmail} already exists`);
  }
  users[userID] = {
    id: userID,
    email: userEmail,
    password: hashedPassword
  };
  // set session cookie and redirect to /urls
  req.session.user_id = userID;
  res.redirect("/urls");
});




// get route 
app.get("/login", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    user: users[userID]
  };
  // if user is logged in, redirect to /urls 
  if (userID) {
    res.redirect("/urls");
  }
  // if user is not logged in, they can access login page
  res.render("login", templateVars);
});

// POST route 
app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  const userFound = getUserByEmail(userEmail, users);
  // if user's email does not exist in users object, send error message
  if (!userFound) {
    return res.status(403).send(`${res.statusCode} error. User with email ${userEmail} cannot be found.`)
  }
  // if user's password does not match password in users object, send error message
  if (!bcrypt.compareSync(userPassword, userFound.password)) {
    return res.status(403).send(`${res.statusCode} error. The password entered is incorrect.`)
  }
  // if email and password are correct, set session cookie and redirect to /urls page
  const userID = userFound.id;
  req.session.user_id = userID;
  res.redirect("/urls");
});




// post logout route
app.post("/logout", (req, res) => {
  //clear the cookies
  req.session = null;

  res.redirect("/login");
});




// get urls 
app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  const urlsUserCanAccess = getUrlsForUserID(userID, urlDatabase);

  // user cannot access /urls if not logged in

  if (!userID) {
    res.status(401).send(`${res.statusCode} error. Please login or register to access this resource`);
  }

  const templateVars = {
    urls: urlsUserCanAccess,
    user: users[userID]
  };

  res.render("urls_index", templateVars);
});


// post urls route
app.post("/urls", (req, res) => {

  const longURLNew = req.body.longURL;
  const shortURLId = generateRandomString();
  const userID = req.session.user_id

  if (!userID) {
    res.status(401).send(`${res.statusCode} error. Please login to submit URL`);
  } else {


    urlDatabase[shortURLId] = {
      longURL: longURLNew,
      userID
    }

    res.redirect(`/urls/${shortURLId}`);
  }
});

// GET route
app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id

  const templateVars = {
    user: users[userID]
  };

  if (!userID) {
    res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});



app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/:id", (req, res) => {
  const userID = req.session.user_id;
  const urlsUserCanAccess = getUrlsForUserID(userID, urlDatabase);
  const shortURLID = req.params.id;

  if (!shortURLID in urlDatabase) {
    res.status(401).send(`${res.statusCode} error. Please login or register to access this resource`);
  }

  if (!(shortURLID in urlsUserCanAccess)) {
    res.status(403).send(`${res.statusCode} error. You are not authorized to access this resource`);
  } else {
    const templateVars = {
      id: shortURLID,
      longURL: urlsUserCanAccess[shortURLID].longURL,
      user: users[userID]
    };

    res.render("urls_show", templateVars);
  }
});

app.post("/urls/:id", (req, res) => {
  const shortURLID = req.params.id;
  const longURLUpdate = req.body.longURL;
  const userID = req.session.user_id;
  const urlsUserCanAccess = getUrlsForUserID(userID, urlDatabase);
  // error if no shortUrlId
  if (!(shortURLID in urlsUserCanAccess)) {
    res.status(404).send(`${res.statusCode} error.The url you are trying to update does not exist`);
  }

  // send error if user is not logged in
  if (!userID) {
    res.status(401).send(`${res.statusCode} error. Please login or register to update this resource`);
  } else {
    urlDatabase[shortURLID] = {
      longURL: longURLUpdate,
      userID
    }

    res.redirect("/urls");
  }

  console.log(urlDatabase);
});

// post route to remove deleted URL
app.post("/urls/:id/delete", (req, res) => {
  const shortURLID = req.params.id;
  const userID = req.session.user_id;
  const urlsUserCanAccess = getUrlsForUserID(userID, urlDatabase);

  // error if short id doesnt exist
  if (!(shortURLID in urlsUserCanAccess)) {
    res.status(404).send(`${res.statusCode} error.The url you are trying to delete does not exist`);
  }

  // error if user is not logged in
  if (!userID) {
    res.status(401).send(`${res.statusCode} error. Please login or register to delete this resource`);
  } else {
    delete urlDatabase[shortURLId];
    res.redirect("/urls");
  }
});



app.get("/u/:id", (req, res) => {
  const shortURLID = req.params.id;
  const longURL = urlDatabase[shortURLID].longURL;

  if (!longURL) {
    return res.status(404).send(`${res.statusCode} error URL not found. Please enter valid URL id`);
  }

  // redirect client to site
  res.redirect(longURL);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});