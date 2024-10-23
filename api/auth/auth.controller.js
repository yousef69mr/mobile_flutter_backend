import express from 'express';
import { verifyToken } from '../../lib/auth.js'
import { db } from '../../lib/database.js';
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";


const router = express.Router();

router.post("/login", async (req, res) => {
    // console.log(req.body);
    const { password, email } = req.body;
    // console.log(userData);
    if (!email || !password) return res.status(400).send({ message: "Missing email or password." });

    // try {



    const user = await db.user.findUnique({ where: { email } });

    if (!user) return res.status(404).json({ message: "User not found." });

    const passwordsMatch = bcrypt.compare(password, user.password);

    if (!passwordsMatch) return res.status(403).json({ message: "Invaild credintials" });

    jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: "7d" }, (err, token) => {
        if (err) throw err;

        res.status(200).json({ token });

    })

    // } catch (error) {
    //   res.status(500).json({ message: "internal error." });
    // }
}
)


router.post("/register", async (req, res) => {
    // console.log(req.body);
    const { name, password, level, email, gender } = req.body;
    // console.log(userData);
    if (!name) return res.status(400).send({ message: "name is missing!" });

    if (!password) return res.status(400).send({ message: "password is missing!" });

    if (!email) return res.status(400).send({ message: "email is missing!" });

    if (!level) return res.status(400).send({ message: "level is missing!" });

    // try {

    const existingUser = await db.user.findFirst({
        where: {
            email
        }
    });

    if (existingUser) {
        res.status(403).json({ message: "email already in use." });
        return;
    }

    const salt = 10;

    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await db.user.create({ data: { name, level, email, password: hashedPassword, gender } });

    jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: "7d" }, (err, token) => {
        if (err) throw err;

        res.status(201).json({ token });

    })

}
)

router.get("/active_user", verifyToken, (req, res) => {

    jwt.verify(req.token, process.env.JWT_SECRET, async (err, authData) => {
        if (err) {
            res.sendStatus(403);
        } else {
            const { user } = authData;
            try {
                const activeUser = await db.user.findUnique({
                    where: {
                        id: user.id
                    },
                    include: {
                        favoriteStores: {
                            include: {
                                store: true
                            }
                        }
                    }
                })

                if (!activeUser) {
                    return res.status(404).json({ message: "User not found" })
                }

                const userFavoriteStores = activeUser.favoriteStores.map(store => ({ ...store.store, id: store.id }));

                const formattedUser = { ...activeUser, favoriteStores: userFavoriteStores }
                // console.log(authData)
                res.status(200).json(formattedUser);
            } catch (e) {
                res.status(500).json({ message: "internal error" })
            }
        }
    })
})


export default router;
