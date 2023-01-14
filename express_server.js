const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));


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
}



//routes//

app.get("/", (req, res) => {
  res.send("Hello!");
});


app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]]

    //user: users[req.cookies["user_id"]]
  };

  app.post("/urls", (req, res) => {
    const longURLNew = req.body.longURL;
    const shortURLId = generateRandomString();
    urlDatabase[shortURLId] = longURLNew;

    res.redirect(`/urls/${shortURLId}`);
  });

  app.post("/urls/:id/delete", (req, res) => {
    const shortURLId = req.params.id;
    delete urlDatabase[shortURLId];

    res.redirect("/urls");
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

  // GET route 
  app.get("/login", (req, res) => {
    const templateVars = {
      user: users[req.cookies["user_id"]]
    };
    res.render("login", templateVars);
  });

  //register get request
  app.get("/register", (req, res) => {
    const templateVars = {
      user: users[req.cookies["user_id"]]
    };
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
  });


  app.post("/logout", (req, res) => {
    res.clearCookie('user_id');

    res.redirect("/login");
  });


  res.render("urls_index", templateVars);
});


//get login route

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

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
    id: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});