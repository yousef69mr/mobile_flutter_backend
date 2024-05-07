import express from 'express';
import { UserRole } from '@prisma/client'
import { verifyToken } from '../../lib/auth.js'

const router = express.Router();


router.get("/", verifyToken, async (req, res) => {
  const decodedToken = jwt.verify(req.token, process.env.JWT_SECRET);
  const { user } = decodedToken;


  const existingUser = await db.user.findUnique({ where: { id: user.id } });
  if (!existingUser || !user) {
    return res.status(403).json({ message: "You are not authorized to make this request" });
  }


  try {
    let favoriteStores;

    if (existingUser.role !== UserRole.ADMIN) {
      favoriteStores = await db.favoriteStore.findMany({
        where: {
          userId: existingUser.id
        }
      });
      return res.status(200).json(favoriteStores);
    }

    favoriteStores = await db.favoriteStore.findMany();
    res.status(200).json(favoriteStores);
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
    const existingFavorites = await db.favoriteStore.findFirst({
      where: {
        userId,
        storeId
      }
    });

    if (existingFavorites) {
      return res.status(406).json({ message: "This store is already on your favorites list." });
    }

    const newFavorite = await db.favoriteStore.create({
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

router.delete("/:favoriteStoreId", verifyToken, async (req, res) => {
  const favoriteStoreId = req.params.favoriteStoreId;
  const decodedToken = jwt.verify(req.token, process.env.JWT_SECRET);
  const { user } = decodedToken;

  if (!user) {
    res.status(401).json({ message: "unauthorized!" });
  }

  try {
    const foundFavorite = await db.favoriteStore.delete({ where: { id: favoriteStoreId } });

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

