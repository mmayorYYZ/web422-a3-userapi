const express = require('express');
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const userService = require("./user-service.js");

//JWT + Passport setup
const passport = require("passport");
const passportJWT = require("passport-jwt");
const jwt = require("jsonwebtoken");

const JwtStrategy = passportJWT.Strategy;
const ExtractJwt = passportJWT.ExtractJwt;

const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme("jwt"),
    secretOrKey: process.env.JWT_SECRET
};

passport.use(
    new JwtStrategy(jwtOptions, (jwt_payload, done) => {
        if (jwt_payload) {
            // attach payload to req.user
            return done(null, jwt_payload);
        } else {
            return done(null, false);
        }
    })
);

// Initialize passport middleware
app.use(passport.initialize());

const HTTP_PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());

app.post("/api/user/register", (req, res) => {
  userService
    .registerUser(req.body)
    .then((msg) => {
      res.json({ message: msg });
    })
    .catch((err) => {
      console.error("Register error:", err);
      res.status(422).json({ message: err.message || err });
    });
});

app.post("/api/user/login", (req, res) => {
  userService
    .checkUser(req.body)
    .then((user) => {
      res.json({ message: "login successful" });
    })
    .catch((err) => {
      console.error("Login error:", err);
      res.status(422).json({ message: err.message || err });
    });
});


app.get("/api/user/favourites",
    passport.authenticate("jwt", { session: false }),
    (req, res) => {
        userService.getFavourites(req.user._id)
        .then(data => {
            res.json(data);
        }).catch(msg => {
            res.status(422).json({ error: msg });
        });
    }
);

app.put("/api/user/favourites/:id",
    passport.authenticate("jwt", { session: false }),
    (req, res) => {
        userService.addFavourite(req.user._id, req.params.id)
        .then(data => {
            res.json(data);
        }).catch(msg => {
            res.status(422).json({ error: msg });
        });
    }
);

app.delete("/api/user/favourites/:id",
    passport.authenticate("jwt", { session: false }),
    (req, res) => {
        userService.removeFavourite(req.user._id, req.params.id)
        .then(data => {
            res.json(data);
        }).catch(msg => {
            res.status(422).json({ error: msg });
        });
    }
);

// Connect to MongoDB
userService.connect()
  .then(() => {
    console.log("userService connected");

    if (!process.env.VERCEL) {
      app.listen(HTTP_PORT, () => {
        console.log("API listening on: " + HTTP_PORT);
      });
    }
  })
  .catch((err) => {
    console.log("unable to start the server: " + err);

    if (!process.env.VERCEL) {
      process.exit();
    }
  });

module.exports = app;