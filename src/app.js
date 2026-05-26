require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const app = express();

app.use(express.json());
app.use(morgan('dev'));

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGOSSE_URl;
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

app.get('/api/v1/health', (req, res) => {
    return res.status(200).json({ status: 'ok', message: 'Library API is running' });
});

app.use('/api/v1/users', require('./routes/users.routes'));
app.use('/api/v1/materials', require('./routes/materials.routes'));
app.use('/api/v1/loans', require('./routes/loans.routes'));
app.use('/api/v1/reservations', require('./routes/reservations.routes'));
app.use('/api/v1/reviews', require('./routes/reviews.routes'));

app.use(notFound);
app.use(errorHandler);

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    });