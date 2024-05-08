import express from 'express';
import { UserRole } from '@prisma/client'
import { verifyToken } from '../../lib/auth.js'

const router = express.Router();



router.get("/", async (req, res) => {

  const { type } = req.query; // Get the "type" parameter from the query string

  let filter = {};
  if (type) {
    filter.type = type; // Add the "type" filter if provided
  }
  try {
    const products = await db.product.findMany({
      where: filter,
      include: {
        // users: true
      }
    });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json(error);
  }
})

router.post("/", verifyToken, async (req, res) => {
  const decodedToken = jwt.verify(req.token, process.env.JWT_SECRET);
  const { user } = decodedToken;

  const existingUser = await db.user.findUnique({ where: { id: user.id } });
  if (!existingUser) {
    return res.status(403).json({ message: "You are not authorized to make this request" });
  }

  if (existingUser.role !== UserRole.ADMIN) {
    res.status(401).json({ message: "unauthorized!" });
  }

  const {
    name,
    price,
    storeId
  } = req.body;

  if (!name) {
    res.status(400).json({ message: "name is missing" });
  }

  if (!price) {
    res.status(400).json({ message: "price is missing" });
  }

  if (!storeId) {
    res.status(400).json({ message: "storeId is missing" });
  }

  try {
    const newProduct = await db.product.create({
      data: {
        name,
        price,
        stores: {
          connect: { id: storeId }
        },

      }
    });
    res.status(201).json(newProduct);
  } catch (error) {
    console.log("Error in /api/products POST route: ", error);
    res.status(500).json({ message: "Server Error" });
  }
})

router.patch("/:productId", verifyToken, async (req, res) => {
  const decodedToken = jwt.verify(req.token, process.env.JWT_SECRET);
  const { user } = decodedToken;

  const existingUser = await db.user.findUnique({ where: { id: user.id } });
  if (!existingUser) {
    return res.status(403).json({ message: "You are not authorized to make this request" });
  }

  if (existingUser.role !== UserRole.ADMIN) {
    res.status(401).json({ message: "unauthorized!" });
  }

  const productId = req.params.productId;

  if (!productId) {
    res.status(400).json({ message: "productId is missing" });
  }

  const {
    name,
    price
  } = req.body;

  if (!name) {
    res.status(400).json({ message: "name is missing" });
  }

  if (!price) {
    res.status(400).json({ message: "price is missing" });
  }

  try {
    const existingProduct = await db.product.findUnique({
      where: {
        id: productId,

      }
    });
    if (!existingProduct) {
      res.status(404).json({ message: "product not found" });
    }

    const product = await db.product.update({
      where: { id: productId },
      data: {
        name,
        price
      },
    });
    res.status(200).json(product);
  } catch (error) {
    console.log("Error in /api/products/:productId PATCH route: ", error);
    res.status(500).json({ message: "Server Error" });
  }
})

export default router;

