const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');

const router = new express.Router();

router.post('/tasks', auth, async (req, res) => {
    try {
        const { description, completed } = req.body;
        const user = req.user;
        const task = await new Task({ description, completed, owner: user._id }).save();
        res.status(201).send(task);
    } catch (err) {
        res.status(500).send(err);
    }
});

router.get('/tasks', auth, async (req, res) => {
    try {
        const user = req.user;
        const match = {};
        if (req.query.completed) {
            match["completed"] = req.query.completed.toLowerCase() === "true";
        }
        const sort = {};
        if (req.query.sortBy) {
            const [sortType, order] = req.query.sortBy.split(":");
            sort[sortType] = order === "asc" ? 1 : -1;
        }
        await user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate();
        res.send(user.tasks);
    } catch (err) {
        res.status(500).send(err);
    }
});

router.get('/tasks/:id', auth, async (req, res) => {
    try {
        const _id = req.params.id;
        const user = req.user;
        const task = await Task.findOne({ _id, owner: user._id });
        if (!task) {
            return res.status(404).send();
        }
        res.send(task);
    } catch (err) {
        res.status(500).send(err);
    }
});

router.patch('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;
    const allowedUpdates = new Set(['description', 'completed']);
    const updates = Object.keys(req.body);
    const isValidUpdate = updates.every(key => allowedUpdates.has(key));
    if (!isValidUpdate) {
        return res.status(404).send({ error: "Attempt to change invalid property" });
    }

    try {
        const user = req.user;
        const task = await Task.findOne({ _id, owner: user._id });
        if (!task) {
            return res.status(404).send();
        }
        updates.forEach(key => task[key] = req.body[key]);
        await task.save();
        res.send(task);
    } catch (err) {
        res.status(500).send(err);
    }
});

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const _id = req.params.id;
        const user = req.user;
        const task = await Task.findOneAndDelete({ _id, owner: user._id });
        if (!task) {
            return res.status(404).send();
        }
        res.send(task);
    } catch (err) {
        res.status(500).send(err);
    }
});

module.exports = router;
