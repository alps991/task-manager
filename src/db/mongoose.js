const mongoose = require('mongoose');

const connUrl = process.env.MONGODB_URL;
mongoose.connect(connUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
});