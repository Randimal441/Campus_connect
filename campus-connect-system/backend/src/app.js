require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const approvalRoutes = require('./routes/approvalRoutes');
const clubsSportsRoutes = require('./routes/clubsSportsRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const consultingRoutes = require('./routes/consultingRoutes');
const eventsRoutes = require('./routes/eventsRoutes');
const { errorHandler } = require('./middlewares/errorMiddleware');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/clubs-sports', clubsSportsRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/consulting', consultingRoutes);
app.use('/api/events', eventsRoutes);

app.use(errorHandler);

module.exports = app;
