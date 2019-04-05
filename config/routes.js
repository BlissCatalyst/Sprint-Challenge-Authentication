const axios = require("axios");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../database/dbConfig.js");

const { authenticate } = require("../auth/authenticate");

module.exports = server => {
  server.post("/api/register", register);
  server.post("/api/login", login);
  server.get("/api/jokes", authenticate, getJokes);
};

async function register(req, res) {
  try {
    let newCreds = req.body;

    if (newCreds && newCreds.username && newCreds.password) {
      newCreds.password = bcrypt.hashSync(newCreds.password, 10);
      const [id] = await db("users").insert(newCreds);

      const newUser = await db("users")
        .select("id", "username")
        .where({ id })
        .first();

      res
        .status(201)
        .json({ newUser, message: "welcome! Thank you for registering!" });
    } else {
      res
        .status(400)
        .json({ message: "You must include your creds, no free rides" });
    }
  } catch (err) {
    res.status(500).json({
      message: "Server wont do that right now...It hates you.",
      error: err
    });
  }
}

async function login(req, res) {
  try {
    const loginCreds = req.body;

    if (loginCreds && loginCreds.username && loginCreds.password) {
      const existingUser = await db("users")
        .where({ username: loginCreds.username })
        .first();
      console.log(loginCreds, existingUser);

      if (
        existingUser &&
        bcrypt.compareSync(loginCreds.password, existingUser.password)
      ) {
        const payload = {
          subject: existingUser.id,
          username: existingUser.username
        };
        const secret = "can't touch this";
        const options = {
          expiresIn: "1d"
        };
        const token = jwt.sign(payload, secret, options);

        res.status(200).json({
          message: `Succes! ${existingUser.username}, you are the best hacker!`,
          token
        });
      } else {
        res.status(401).json({
          message: "Invalid Password, get out of here crappy hacker."
        });
      }
    } else {
      res
        .status(400)
        .json({ message: "You must include your creds, no free rides." });
    }
  } catch (err) {
    res.status(500).json({
      message:
        "Server won't login right now...It hates that you're trying to come back."
    });
  }
}

function getJokes(req, res) {
  const requestOptions = {
    headers: { accept: "application/json" }
  };

  axios
    .get("https://icanhazdadjoke.com/search", requestOptions)
    .then(response => {
      res.status(200).json(response.data.results);
    })
    .catch(err => {
      res.status(500).json({ message: "Error Fetching Jokes", error: err });
    });
}
