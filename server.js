// server.js
const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const passportJWT = require("passport-jwt");

dotenv.config();

const userService = require("./user-service.js");
const HTTP_PORT = process.env.PORT || 8080;

const ExtractJwt = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;

const jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("bearer");
jwtOptions.secretOrKey = process.env.JWT_SECRET;

// Strategy: payload has _id, userName
const strategy = new JwtStrategy(jwtOptions, (jwt_payload, next) => {
  // Just attach payload as user
  next(null, jwt_payload);
});

passport.use(strategy);

app.use(express.json());
app.use(cors());
app.use(passport.initialize());

// REGISTER
app.post("/api/user/register", (req, res) => {
  userService
    .registerUser(req.body)
    .then((msg) => {
      res.json({ message: msg });
    })
    .catch((msg) => {
      res.status(422).json({ message: msg });
    });
});

// LOGIN (returns JWT token)

app.post("/api/user/login", (req, res) => {
  userService.checkUser(req.body)
    .then((user) => {
      const payload = { _id: user._id, userName: user.userName };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "2h"
      });

      res.json({ message: "login successful", token });
    })
    .catch((msg) => {
      res.status(422).json({ message: msg });
    });
});

// PROTECTED ROUTES
app.get(
  "/api/user/favourites",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    userService
      .getFavourites(req.user._id)
      .then((data) => {
        res.json(data);
      })
      .catch((msg) => {
        res.status(422).json({ error: msg });
      });
  }
);

app.put(
  "/api/user/favourites/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    userService
      .addFavourite(req.user._id, req.params.id)
      .then((data) => {
        res.json(data);
      })
      .catch((msg) => {
        res.status(422).json({ error: msg });
      });
  }
);

app.delete(
  "/api/user/favourites/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    userService
      .removeFavourite(req.user._id, req.params.id)
      .then((data) => {
        res.json(data);
      })
      .catch((msg) => {
        res.status(422).json({ error: msg });
      });
  }
);

// START SERVER
userService
  .connect()
  .then(() => {
    console.log("Connected to MongoDB");

    // Only start listening when NOT on Vercel
    if (!process.env.VERCEL) {
      app.listen(HTTP_PORT, () => {
        console.log("API listening on: " + HTTP_PORT);
      });
    }
  })
  .catch((err) => {
    console.log("unable to start the server: " + err);
    process.exit();
  });

// Export the app for Vercel
module.exports = app;