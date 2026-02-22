const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const promptRoutes = require('./routes/promptRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const engineRoutes = require('./routes/engineRoutes');

dotenv.config();
connectDB();

const app = express();

// 1. CORS - MUST BE FIRST
const corsOptions = {
    origin: true, // Allow all origins temporarily for 100% connectivity debugging
    credentials: true,
    optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// 2. Security & Logging
app.use(helmet({
    crossOriginResourcePolicy: false, // Help with loading external images
}));
app.use(morgan('dev'));

// Request Logger for debugging Render hangs
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// 3. Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200, // Increased for admin dashboard
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' })); // Increased for image uploads
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.get('/api/health', (req, res) => {
    const mongoose = require('mongoose');
    res.json({
        status: 'UP',
        db: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
        timestamp: new Date(),
        origin: req.headers.origin
    });
});

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Routes
app.use('/api/users', authRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/engines', engineRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(
    PORT,
    console.log(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
    )
);
