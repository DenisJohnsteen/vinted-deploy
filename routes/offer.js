const express = require("express");
const router = express.Router();
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
// import model
const Offer = require("../models/Offer");
const User = require("../models/User");

// Cloudinary
const cloudinary = require("cloudinary").v2;

// Données à remplacer avec vos credentials :
cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret,
});

// uploadé une image
router.post("/upload", async (req, res) => {
  // on log les fichiers reçus
  console.log(req.files); // { file1: ..., file2: ... }
  // ...

  try {
    let pictureToUpload = req.files.picture.path;
    const result = await cloudinary.uploader.upload(pictureToUpload);
    return res.json(result);
  } catch (error) {
    return res.json({ error: error.message });
  }
});

// Verification Token

const isAuthenticated = async (req, res, next) => {
  console.log(req.headers.authorization);
  console.log("Middleware isAuthenticated");
  const isTokenValid = await User.findOne({
    token: req.headers.authorization.replace("Bearer ", ""),
  });
  if (req.headers.authorization) {
    if (isTokenValid) {
      next();
    } else {
      return res.status(400).json("Unauthorized");
    }
  } else {
    res.status(400).json({ message: "token not valid" });
  }
};

// creer une annonce
router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    // image a uploadé
    let pictureToUpload = req.files.picture.path;
    const result = await cloudinary.uploader.upload(pictureToUpload);
    // creation de l'annonce
    const newOffer = new Offer({
      product_name: req.fields.title,
      product_description: req.fields.description,
      product_price: req.fields.price,
      product_details: [
        { MARQUE: req.fields.brand },
        { TAILLE: req.fields.size },
        { ETAT: req.fields.condition },
        { COULEUR: req.fields.color },
        { EMPLACEMENT: req.fields.city },
      ],
      product_image: result.secure_url,
      owner: req.fields.owner,
    });
    await newOffer.save();

    const publication = await Offer.findOne({
      product_name: req.fields.title,
    }).populate({ path: "owner", select: "account" });

    res.json(publication);
  } catch (error) {
    res.json({ message: error.message });
  }
});

// creation de filtre

router.get("/offers", async (req, res) => {
  console.log("route: /offers");
  console.log(req.query);

  try {
    const filtersObject = {};
    if (req.query.title) {
      filtersObject.product_name = new RegExp(req.query.title, "i");
    }

    if (req.query.priceMin) {
      filtersObject.product_price = { $gte: req.query.priceMin };
    }

    if (req.query.priceMax) {
      if (filtersObject.product_price) {
        filtersObject.product_price.$lte = req.query.priceMax;
      } else {
        filtersObject.product_price = { $lte: req.query.priceMax };
      }
    }

    // Gestion du tri avec l'objet sortObject

    const sortObject = {};
    if (req.query.sort === "price-desc") {
      sortObject.product_price = "desc";
    } else if (req.query.sort === "price-asc") {
      sortObject.product_price = "asc";
    }

    let limit = 3;
    if (req.query.limit) {
      limit = req.query.limit;
    }

    let page = 1;
    if (req.query.page) {
      page = req.query.page;
    }

    const offers = await Offer.find(filtersObject)
      .select("product_name product_price product_image")
      .sort(sortObject)
      .limit(limit)
      .skip((page - 1) * limit);

    const count = await Offer.countDocuments(filtersObject);

    res.json({ count: count, offers: offers });
  } catch (error) {
    res.json({ message: error.message });
  }
});

// Service pour recuperer les details d"une annonce en fonction de son id

router.get("/offer/:id", async (req, res) => {
  console.log(req.params);

  try {
    const offerFindById = await Offer.findById(req.params.id)
      .populate({
        path: "owner",
        select: "account",
      })
      .select("product_details product_image");

    res.json(offerFindById);
  } catch (error) {
    res.json({ message: error.message });
  }
});

module.exports = router;
