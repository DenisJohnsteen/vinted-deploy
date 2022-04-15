const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");

const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

//Création du serveur
const app = express();
app.use(formidable());

//Connexion à la bdd
mongoose.connect("mongodb://localhost/vinted");

//import des routes
const userRoutes = require("./routes/user");
app.use(userRoutes);

const offerRoutes = require("./routes/offer");
app.use(offerRoutes);

app.listen(3000, () => {
  console.log("Server has started !");
});
