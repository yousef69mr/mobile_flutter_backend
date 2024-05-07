import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import { PrismaClient } from '@prisma/client'
import fileUpload from 'express-fileupload';
import userRouter from './api/users/user.controller.js'
import authRouter from './api/auth/auth.controller.js'
import favoriteStoresRouter from './api/favorite_stores/favorite_store.controller.js'
import storeRouter from './api/stores/store.controller.js'

const db = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}


dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

// enable files upload
app.use(fileUpload({
  createParentPath: true
}));

app.use(express.static('uploads'));

app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.use('/api/auth', authRouter)
app.use('/api/users', userRouter);
app.use('/api/stores', storeRouter);
app.use('/api/favorite_stores', favoriteStoresRouter);


app.get("/", (req, res) => res.send("Express on Vercel"));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


// export default app;
// module.exports = app;

//app.listen(8080, () => console.log('Server has started on port 8080'))
