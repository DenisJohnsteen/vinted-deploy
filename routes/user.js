const express = require("express");
const router = express.Router();
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
//import model
const User = require("../models/User");

//Créer un user
router.post("/user/signup", async (req, res) => {
  console.log(req.fields);
  try {
    if (req.fields.username === undefined) {
      res.status(400).json({ message: "missing parameter" });
    } else {
      const isUserExisting = await User.findOne({ email: req.fields.mail });
      if (isUserExisting !== null) {
        res.status(400).json({ message: "Unauthorized" });
      } else {
        // hasher le mot de passe
        const password = req.fields.password;
        const salt = uid2(16);
        const hash = SHA256(password + salt).toString(encBase64);
        const token = uid2(16);
        console.log("salt==>", salt);
        console.log("hash==>", hash);

        // Créer le nouvelle utilisateur
        const newUser = new User({
          email: req.fields.email,
          account: {
            username: req.fields.username,
          },
          newsletter: req.fields.newsletter,
          token: token,
          hash: hash,
          salt: salt,
        });
        // sauvegarder le nouvel utilisateur dans la bbd
        await newUser.save();
        // on repond a l'utilisateur en créant nous même les cléfs a retourner.
        res.json({
          _id: newUser.id,
          token: newUser.token,
          account: newUser.account,
        });
      }
    }
  } catch (error) {
    res.json({ message: error.message });
  }
});

// Route pour la connection

router.post("/user/login", async (req, res) => {
  console.log("route : /user/login");
  console.log(req.fields);

  try {
    const userToCheck = await User.findOne({ email: req.fields.email });

    if (userToCheck === null) {
      res.status(400).json({ message: "user not found" });
    } else {
      const newHash = SHA256(req.fields.password + userToCheck.salt).toString(
        encBase64
      );
      console.log("newHash==>", newHash);
      console.log("hashToCheck==>", userToCheck.hash);

      if (userToCheck.hash === newHash) {
        res.status(200).json({
          _id: userToCheck.id,
          token: userToCheck.token,
          account: userToCheck.account,
        });
      } else {
        res.status(400).json({ message: "Unauthorized" });
      }
    }
  } catch (error) {
    res.json({ message: errror.message });
  }
});

module.exports = router;
