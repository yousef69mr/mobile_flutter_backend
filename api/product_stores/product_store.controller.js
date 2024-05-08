import express from 'express';
import { db } from '../../lib/database.js';
import { verifyToken } from '../../lib/auth.js'
import jwt from "jsonwebtoken";

const router = express.Router();


router.get("/", verifyToken, async (req, res) => {
  const decodedToken = jwt.verify(req.token, process.env.JWT_SECRET);
  const { user } = decodedToken;


  const existingUser = await db.user.findUnique({ where: { id: user.id } });
  if (!existingUser || !user) {
    return res.status(403).json({ message: "You are not authorized to make this request" });
  }


  try {
    const productStores = await db.storeProduct.findMany();
    res.status(200).json(productStores);
  } catch (error) {
    console.log("Error getting store to favorites: ", error);
    res.status(500).json(error);
  }

})

router.post("/", verifyToken, async (req, res) => {
  const decodedToken = jwt.verify(req.token, process.env.JWT_SECRET);
  const { user } = decodedToken;

  if (!user) {
    res.status(401).json({ message: "unauthorized!" });
  }

  const {
    userId,
    storeId
  } = req.body;

  if (!userId) {
    res.status(400).json({ message: "userId is missing" });
  }

  if (!storeId) {
    res.status(400).json({ message: "storeId is missing" });
  }

  try {

    // check to see if the user already has this store in their favorite list
    const existingProducts = await db.storeProduct.findFirst({
      where: {
        userId,
        storeId
      }
    });

    if (existingProducts) {
      return res.status(406).json({ message: "This product is already on your store list." });
    }

    const newFavorite = await db.storeProduct.create({
      data: {
        userId,
        storeId
      }
    });
    res.status(201).json(newFavorite);


  } catch (error) {
    console.log("Error adding store to favorites: ", error);
    res.status(500).json(error);
  }

})

router.delete("/:productStoreId", verifyToken, async (req, res) => {
  const productStoreId = req.params.productStoreId;
  const decodedToken = jwt.verify(req.token, process.env.JWT_SECRET);
  const { user } = decodedToken;

  if (!user) {
    res.status(401).json({ message: "unauthorized!" });
  }

  try {
    const foundFavorite = await db.storeProduct.delete({ where: { id: productStoreId } });

    if (!foundFavorite) {
      return res.status(404).json({ message: "Could not find favorite with given id" });
    }
    res.status(200).json(foundFavorite);
  }
  catch (error) {
    console.log("Error adding store to favorites: ", error);
    res.status(500).json(error);
  }

})

export default router;

