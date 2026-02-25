const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const promptRoutes = require('./routes/promptRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const engineRoutes = require('./routes/engineRoutes');

connectDB();

const app = express();

// 1. CORS - MUST BE FIRST
const corsOptions = {
    origin: [
        'https://promptcollection-lake.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000'
    ],
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

// 4. Critical Health Check - MUST BE BEFORE OTHER ROUTES
// This helps Render and Vercel verify the service is "LIVE" even during DB congestion
app.get('/api/health', async (req, res) => {
    const { pool } = require('./config/db');
    let dbStatus = 'UNKNOWN';
    try {
        await pool.query('SELECT 1');
        dbStatus = 'CONNECTED';
    } catch (err) {
        dbStatus = 'DISCONNECTED';
    }

    res.json({
        status: 'UP',
        service: 'PROMPT_COLLECTION_API',
        db: dbStatus,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        node_env: process.env.NODE_ENV,
        ip_request: req.ip
    });
});

app.get('/', (req, res) => {
    res.status(200).json({
        message: 'PromptCollection API is running',
        docs: '/api/health'
    });
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
