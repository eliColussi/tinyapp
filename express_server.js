const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require("cookie-parser");
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser)


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// users object
const users = {
  "8989": {
    id: "8989",
    email: "eli@gmail.com",
    password: "111"
  },

  "9090": {
    id: "9090",
    email: "joey@gmail.com",
    password: "555"
  }
};


//helpers!
const getUserByEmail = function (email) {
  for (const userID in users) {
    if (users[userID].email === email) {
      return users[userID];
    }
  }
  return null;
};


function generateRandomString() {
  return Math.random().toString(36).slice(2);
};



//routes//
app.get("/", (req, res) => {
  res.redirect("/urls");
});


//register get request
app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]]
  };

  if (req.cookies["user_id"]) {
    res.redirect("/urls");
  }

  res.render("register", templateVars);
});

// POST route 
app.post("/register", (req, res) => {
  const userID = generateRandomString();
  const userEmail = req.body.email;
  const userPassword = req.body.password;

  if (!userEmail || !userPassword) {
    return res.status(400).send(`${res.statusCode} error. Please enter valid email and password`)
  }
  const foundUser = getUserByEmail(userEmail);

  if (foundUser) {
    return res.status(400).send(`${res.statusCode} error. User with email ${userEmail} already exists`);
  }

  users[userID] = {
    id: userID,
    email: userEmail,
    password: userPassword
  };

  res.cookie('user_id', userID);
  res.redirect("/urls");
});


app.get("/urls", (req, res) => {
  // user cannot access /urls if not logged in
  if (!req.cookies["user_id"]) {
    res.status(401).send(`${res.statusCode} error. Please login or register to access this resource`);
  }

  // user can only see urls they created
  const userID = req.cookies["user_id"]
  const urlsUserCanAccess = geturlsForUserID(userID);

  const templateVars = {
    urls: urlsUserCanAccess,
    user: users[req.cookies["user_id"]]
  };

  res.render("urls_index", templateVars);
});


app.post("/urls", (req, res) => {

  // if user is not logged in, they cannot create shortURL
  if (!req.cookies["user_id"]) {
    res.status(401).send(`${res.statusCode} error. Please login to submit URL`);
  } else {
    const longURLNew = req.body.longURL;
    const shortURLId = generateRandomString();
    const userID = req.cookies["user_id"]

    urlDatabase[shortURLId] = {
      longURL: longURLNew,
      userID
    }
    console.log(urlDatabase);

    res.redirect(`/urls/${shortURLId}`);
  }
  console.log(urlDatabase);
});

app.post("/urls/:id/delete", (req, res) => {
  const shortURLId = req.params.id;
  delete urlDatabase[shortURLId];

  res.redirect("/urls");
});


app.get("/urls/:id", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
    id: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  const shortURLID = req.params.id;
  const longURLUpdate = req.body.longURL;

  urlDatabase[shortURLID] = longURLUpdate;

  res.redirect("/urls");
});

app.get("/u/:id", (req, res) => {
  const shortURLID = req.params.id;
  const longURL = urlDatabase[shortURLID];

  //edge case: client requests short URL with a non-existant id
  if (!longURL) {
    return res.status(404).send("Error: URL not found. Please enter valid id");
  }

  // redirect client to site
  res.redirect(longURL);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});



// GET route 
app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]]
  };
  res.render("login", templateVars);
});

// post login 
app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  const userFound = getUserByEmail(userEmail);

  // if user's email does not exist in users object, send 403 status code
  if (!userFound) {
    return res.status(403).send(`${res.statusCode} error. User with email ${userEmail} cannot be found.`)
  }

  // if user's password does not match password in users object, send 403 status code
  if (userPassword !== userFound.password) {
    return res.status(403).send(`${res.statusCode} error. The password entered is incorrect.`)
  }

  const userID = userFound.id
  res.cookie('user_id', userID);
  res.redirect("/urls");
});


app.post("/logout", (req, res) => {
  res.clearCookie('user_id');

  res.redirect("/login");
});



app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});