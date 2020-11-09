const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const auth = require('../middleware/auth');
const User = require('../models/user');
const { sendWelcomeEmail, sendCancellationEmail } = require('../emails/account');

const router = new express.Router();

router.post('/users', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const user = await new User({ name, email, password }).save();
        const token = await user.generateAuthToken();
        sendWelcomeEmail(email, name);
        res.status(201).send({ user: user.getPublicProfile(), token });
    } catch (err) {
        res.status(400).send(err);
    }
});

router.post('/users/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findByCredentials(email, password);
        const token = await user.generateAuthToken();
        res.send({ user: user.getPublicProfile(), token });
    } catch (err) {
        res.status(500).send(err);
    }
});

router.post('/users/logout', auth, async (req, res) => {
    try {
        const { user, token } = req;
        user.tokens = user.tokens.filter(tokenObj => tokenObj.token !== token);
        await user.save();
        res.status(200).send();
    } catch (err) {
        res.status(500).send();
    }
});

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        const user = req.user;
        user.tokens = [];
        await user.save();
        res.status(200).send();
    } catch (err) {
        res.status(500).send();
    }
});

const avatars = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        const fileName = file.originalname;
        const isValidFileType = fileName.endsWith(".png") || fileName.endsWith(".jpg") || fileName.endsWith(".jpeg");
        if (isValidFileType) {
            cb(undefined, true);
        } else {
            cb(new Error('invalid file type'));
        }
    }
});

router.post('/users/me/avatar', auth, avatars.single('avatar'), async (req, res) => {
    const user = req.user;
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
    user.avatar = buffer;
    await user.save();
    res.send();
}, (err, req, res, next) => {
    res.status(400).send({ error: err.message });
});

router.delete('/users/me/avatar', auth, async (req, res) => {
    try {
        const user = req.user;
        user.avatar = undefined;
        await user.save();
        res.send();
    } catch (error) {
        res.status(500).send({ error });
    }
});

router.get('/users/me/avatar', auth, async (req, res) => {
    try {
        const user = req.user;
        if (!user || !user.avatar) {
            return res.status(404).send();
        }
        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    } catch (error) {
        res.status(500).send({ error });
    }
})

router.get('/users/me', auth, async (req, res) => {
    const user = req.user;
    res.send({ user: user.getPublicProfile() });
});

router.patch('/users/me', auth, async (req, res) => {
    const allowedUpdates = new Set(['name', 'email', 'password', 'age']);
    const updates = Object.keys(req.body);
    const isValidUpdate = updates.every(key => allowedUpdates.has(key));
    if (!isValidUpdate) {
        return res.status(400).send({ error: "Attempt to change invalid property" });
    }

    try {
        const user = req.user;
        updates.forEach(key => user[key] = req.body[key]);
        await user.save();
        res.send({ user: user.getPublicProfile() });
    } catch (err) {
        res.status(500).send(err);
    }
});

router.delete('/users/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.remove();
        sendCancellationEmail(user.email, user.name);
        res.send({ user: user.getPublicProfile() });
    } catch (err) {
        res.status(500).send(err);
    }
});

module.exports = router;