const express = require("express");
const app = express();
const PORT = 8080;
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
app.use(express.urlencoded({ extended: true }));

app.use(cookieSession({
  name: "session",
  keys: ["protectedKey"]
}));


app.set("view engine", "ejs");



const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "h67f5h"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "h67f5h"
  },
};

// users
const users = {
  "h67f5h": {
    id: "h67f5h",
    email: "eli@gmail.com",
    password: "1234"
  },

  "3g6j0s": {
    id: "3g6j0s",
    email: "jimmy@gmail.com",
    password: "000"
  }
};

// helpers
const generateRandomString = function () {
  return Math.random().toString(36).slice(2);
};

const getUserByEmail = function (email) {
  for (const userID in users) {
    if (users[userID].email === email) {
      return users[userID];
    }
  }
  return null;
};

const geturlsForUserID = function (userID) {
  const urlObj = {}; // empty object to take in list of short url IDs and longURLs

  for (const urlID in urlDatabase) {
    if (urlDatabase[urlID].userID === userID) {
      urlObj[urlID] = {
        longURL: urlDatabase[urlID].longURL,
      }
    }
  }
  return urlObj;
}


//routes//


app.get("/", (req, res) => {
  res.redirect("/urls");
});



// GET route 
app.get("/register", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    user: users[userID]
  };

  // check if user is logged in
  if (userID) {
    res.redirect("/urls");
  }


  res.render("register", templateVars);
});

// POST route 
app.post("/register", (req, res) => {
  const userID = generateRandomString();
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  const saltRounds = bcrypt.getRounds(10);
  const hashedPassword = bcrypt.hashSync(userPassword, saltRounds)

  if (!userEmail || !userPassword) {
    return res.status(400).send(`${res.statusCode} error. Please enter valid email and password`)
  }

  //check to see if user with email already exists
  const foundUser = getUserByEmail(userEmail);

  if (foundUser) {
    return res.status(400).send(`${res.statusCode} error. User with email ${userEmail} already exists`);
  }

  users[userID] = {
    id: userID,
    email: userEmail,
    password: hashedPassword
  };

  req.session.user_id = userID;
  res.redirect("/urls");
});




// get login route 
app.get("/login", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    user: users[userID]
  };

  // redirect to /urls 
  if (userID) {
    res.redirect("/urls");
  }
  //render login
  res.render("login", templateVars);
});

// post login route 
app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  const userFound = getUserByEmail(userEmail);

  // send 403 error code
  if (!userFound) {
    return res.status(403).send(`${res.statusCode} error. User with email ${userEmail} cannot be found.`)
  }

  // if user's password does not match send 403 status code
  if (!bcrypt.compareSync(userPassword, userFound.password)) {
    return res.status(403).send(`${res.statusCode} The password you entered doesn't match our system`)
  }

  const userID = userFound.id
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
  const userID = req.session.user_id
  const urlsUserCanAccess = geturlsForUserID(userID);
  const shortURLID = req.params.id;

  if (!userID) {
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