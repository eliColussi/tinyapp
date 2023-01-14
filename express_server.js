const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
  return Math.random().toString(36).slice(2);
}

app.get("/", (req, res) => {
  res.send("Hello!");
});


app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
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


  res.render("urls_index", templateVars);
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
    id: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});