import express from 'express';
import * as fs from 'fs';
import { UserRole } from '@prisma/client'
import { db } from '../../lib/database.js';
import { verifyToken } from '../../lib/auth.js'
import jwt from "jsonwebtoken";

const router = express.Router();


router.get("/", verifyToken, (req, res) => {
    jwt.verify(req.token, process.env.JWT_SECRET, async (err, _) => {
        if (err) {
            res.status(403).json({ message: 'Invalid token' });
        } else {
            const users = await db.user.findMany({
                include: {
                    favoriteStores: true
                }
            });
            res.status(200).json(users);
        }
    })
})

router.patch("/:userId", verifyToken, async (req, res) => {
    const userId = req.params.userId; // Retrieve id=require(params
    const decodedToken = jwt.verify(req.token, process.env.JWT_SECRET);
    const { user } = decodedToken;

    if (user.id !== userId && user.role !== UserRole.ADMIN) {
        res.status(401).json({ message: "unauthorized!" });
    }
    const {
        name,
        email,
        password,
        studentId,
        level,
        gender,
        role
    } = req.body;

    if (isNaN(level)) {
        res.status(400).json({ message: "Level must be a number." });
    }

    let avatar;

    try {

        const existingUser = await db.user.findUnique({
            where: {
                id: userId
            }
        })

        if (!existingUser) {
            res.status(404).json({ message: "user not found" });
        }

        if (req.files?.avatar) {

            if (Array.isArray(req.files?.avatar)) {
                res.status(400).json({ message: "avatar must be a single image" });
            }

            const avatarFile = req.files?.avatar;

            if (avatarFile.mimetype.split('/')[0] !== "image") {
                res.status(406).json({ message: "avatar must be an image" });
            }
            try {
                if (existingUser.avatar) {
                    fs.unlinkSync('./uploads' + existingUser.avatar);
                }
            } catch (error) {
                console.error(error);
            }
            //Use the mv() method to place the file in the upload directory (i.e. "uploads")
            avatarFile.mv(`./uploads/users/${userId}/` + avatarFile.name);
            avatar = `/users/${userId}/${avatarFile.name}`.replaceAll(` `, "%20");
            // console.log(avatar);
        }

        const updatedUser = await db.user.update({
            where: { id: userId },
            data: {
                name,
                email,
                password,
                studentId,
                level: parseInt(level),
                gender,
                avatar,
                role
            }, include: {
                favoriteStores: true
            }
        })

        res.status(200).json(updatedUser); // Return userId and user data
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "internal error" });
    }
})

router.delete("/:userId", verifyToken, async (req, res) => {
    try {
        const userId = req.params.userId; // Retrieve id=require(params
        const decodedToken = jwt.verify(req.token, process.env.JWT_SECRET);
        const { user } = decodedToken;

        if (user.id !== userId && user.role !== UserRole.ADMIN) {
            res.status(401).json({ message: "unauthorized!" });
        }

        const deletedUser = await db.user.delete({
            where: { id: userId },
        })

        res.status(204).json(deletedUser); // Return userId and user data
    } catch (error) {
        res.status(403).json({ message: 'Invalid token' });
    }
})

export default router;

