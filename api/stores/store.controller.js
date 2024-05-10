import express from 'express';
import { UserRole } from '@prisma/client'
import { verifyToken } from '../../lib/auth.js';
import { db } from '../../lib/database.js';
import jwt from "jsonwebtoken";

const router = express.Router();



router.get("/", async (req, res) => {

  const { type, productId } = req.query; // Get the "type" parameter from the query string

  // console.log(productId)
  let filter = {};
  if (type) {
    filter.type = type; // Add the "type" filter if provided
  }

  if (productId) {
    filter.products = {
      some: {
        productId // Filter stores where at least one product has the specified productId
      }
    }
  }
  try {

    const stores = await db.store.findMany({
      where: { ...filter },
      include: {
        users: true,
        // products: {
        //   include: {
        //     product: true // Include the associated product information
        //   }
        // }
      }
    });
    res.status(200).json(stores);
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
    type,
    longitude,
    latitude,
  } = req.body;

  if (!name) {
    res.status(400).json({ message: "name is missing" });
  }

  if (!longitude) {
    res.status(400).json({ message: "longitude is missing" });
  }

  if (!latitude) {
    res.status(400).json({ message: "latitude is missing" });
  }

  try {
    const newStore = await db.store.create({
      data: {
        name,
        type,
        latitude,
        longitude
      },
      include: {
        products: {
          include: {
            product: true
          }
        },
      }
    });
    res.status(201).json(newStore);
  } catch (error) {
    console.log("Error in /api/stores POST route: ", error);
    res.status(500).json({ message: "Server Error" });
  }
})

router.get("/:storeId", async (req, res) => {

  const storeId = req.params.storeId;

  if (!storeId) {
    res.status(400).json({ message: "storeId is missing" });
  }

  try {

    const store = await db.store.findUnique({
      where: { id: storeId },
      include: {
        users: true,
        products: {
          include: {
            product: true
          }
        },
      }
    });

    if (!store) {
      res.status(404).json({ message: "store not found" });
    }

    res.status(200).json(store);
  } catch (error) {
    console.log("Error in /api/stores/:storeId GET route: ", error);
    res.status(500).json({ message: "Server Error" });
  }
})

router.patch("/:storeId", verifyToken, async (req, res) => {
  const decodedToken = jwt.verify(req.token, process.env.JWT_SECRET);
  const { user } = decodedToken;

  const existingUser = await db.user.findUnique({ where: { id: user.id } });
  if (!existingUser) {
    return res.status(403).json({ message: "You are not authorized to make this request" });
  }

  if (existingUser.role !== UserRole.ADMIN) {
    res.status(401).json({ message: "unauthorized!" });
  }

  const storeId = req.params.storeId;

  if (!storeId) {
    res.status(400).json({ message: "storeId is missing" });
  }

  const {
    name,
    type,
    longitude,
    latitude
  } = req.body;

  if (!name) {
    res.status(400).json({ message: "name is missing" });
  }

  if (!latitude || !longitude) {
    res.status(400).json({ message: "coordinates are missing" });
  }

  try {
    const existingStore = await db.store.findUnique({
      where: {
        id: storeId,

      }
    });
    if (!existingStore) {
      res.status(404).json({ message: "store not found" });
    }

    const store = await db.store.update({
      where: { id: storeId },
      data: {
        name,
        type,
        longitude,
        latitude
      },
      include: {
        products: {
          include: {
            product: true
          }
        },
      }
    });
    res.status(200).json(store);
  } catch (error) {
    console.log("Error in /api/stores/:storeId PATCH route: ", error);
    res.status(500).json({ message: "Server Error" });
  }
})

router.delete("/:storeId", verifyToken, async (req, res) => {
  const decodedToken = jwt.verify(req.token, process.env.JWT_SECRET);
  const { user } = decodedToken;

  const existingUser = await db.user.findUnique({ where: { id: user.id } });
  if (!existingUser) {
    return res.status(403).json({ message: "You are not authorized to make this request" });
  }

  if (existingUser.role !== UserRole.ADMIN) {
    res.status(401).json({ message: "unauthorized!" });
  }

  const storeId = req.params.storeId;

  if (!storeId) {
    res.status(400).json({ message: "storeId is missing" });
  }


  try {
    const existingStore = await db.store.findUnique({
      where: {
        id: storeId,

      }
    });
    if (!existingStore) {
      res.status(404).json({ message: "store not found" });
    }

    const store = await db.store.delete({
      where: { id: storeId },
    });
    res.status(204).json(store);
  } catch (error) {
    console.log("Error in /api/stores/:storeId DELETE route: ", error);
    res.status(500).json({ message: "Server Error" });
  }
})

router.get("/:storeId/products", async (req, res) => {

  const storeId = req.params.storeId;

  if (!storeId) {
    res.status(400).json({ message: "storeId is missing" });
  }

  try {
    const existingStore = await db.store.findUnique({
      where: {
        id: storeId,
      }
    });
    if (!existingStore) {
      res.status(404).json({ message: "store not found" });
    }

    const storeProducts = await db.storeProduct.findMany({
      where: {
        storeId,
      }, include: {
        product: true
      }
    });

    const products = storeProducts.map(storeProduct => ({ ...storeProduct.product, storeLinkId: storeProduct.id, price: storeProduct.price }))

    res.status(200).json(products);
  } catch (error) {
    console.log("Error in /api/stores/:storeId/products GET route: ", error);
    res.status(500).json({ message: "Server Error" });
  }
})

router.post("/:storeId/products", verifyToken, async (req, res) => {
  const decodedToken = jwt.verify(req.token, process.env.JWT_SECRET);
  const { user } = decodedToken;

  const existingUser = await db.user.findUnique({ where: { id: user.id } });
  if (!existingUser) {
    return res.status(403).json({ message: "You are not authorized to make this request" });
  }

  if (existingUser.role !== UserRole.ADMIN) {
    res.status(401).json({ message: "unauthorized!" });
  }

  const storeId = req.params.storeId;

  if (!storeId) {
    res.status(400).json({ message: "storeId is missing" });
  }

  const {
    productId,
    price
  } = req.body;

  if (!productId) {
    res.status(400).json({ message: "productId is missing" });
  }

  if (!price) {
    res.status(400).json({ message: "price is missing" });
  }

  if (isNaN(price)) {
    res.status(400).json({ message: "price must be a number" });
  }

  try {
    const existingStore = await db.store.findUnique({
      where: {
        id: storeId,

      }
    });
    if (!existingStore) {
      res.status(404).json({ message: "store not found" });
    }

    const existingProduct = await db.product.findUnique({
      where: {
        id: productId,
      }
    });
    if (!existingProduct) {
      res.status(404).json({ message: "product not found" });
    }


    const storeProduct = await db.storeProduct.findFirst({
      where: {
        storeId,
        productId
      }
    })

    if (storeProduct) {
      res.status(406).json({ message: "product to store link exists" });
    }

    await db.storeProduct.create({
      data: {
        price: parseFloat(price),
        storeId,
        productId
      }
    })

    const store = await db.store.findUnique({
      where: { id: storeId },
      include: {
        products: {
          include: {
            product: true
          }
        },
      }
    });
    res.status(200).json(store);
  } catch (error) {
    console.log("Error in /api/stores/:storeId/products POST route: ", error);
    res.status(500).json({ message: "Server Error" });
  }
})

export default router;

