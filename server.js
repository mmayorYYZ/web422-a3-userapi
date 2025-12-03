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
    userService.registerUser(req.body)
    .then((msg) => {
        res.json({ "message": msg });
    }).catch((msg) => {
        res.status(422).json({ "message": msg });
    });
});

app.post("/api/user/login", (req, res) => {
    userService.checkUser(req.body)
    .then((user) => {
        // Build payload with _id and userName
        const payload = {
            _id: user._id,
            userName: user.userName
        };

        // Sign JWT with secret from .env
        const token = jwt.sign(payload, process.env.JWT_SECRET);

        // Return token to client
        res.json({ 
            message: "login successful",
            token: token
        });
    }).catch(msg => {
        res.status(422).json({ "message": msg });
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

userService.connect()
.then(() => {
    app.listen(HTTP_PORT, () => { console.log("API listening on: " + HTTP_PORT) });
})
.catch((err) => {
    console.log("unable to start the server: " + err);
    process.exit();
});
