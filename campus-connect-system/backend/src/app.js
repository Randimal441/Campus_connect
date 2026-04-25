require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const approvalRoutes = require('./routes/approvalRoutes');
const clubsSportsRoutes = require('./routes/clubsSportsRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const consultingReviewRoutes = require('./routes/consultingReviewRoutes');
const consultingRoutes = require('./routes/consultingRoutes');
const eventsRoutes = require('./routes/eventsRoutes');
const studyMaterialRoutes = require('./routes/studyMaterialRoutes');
const medicationChatRoutes = require('./routes/medicationChatRoutes');
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
app.use('/api/consulting/reviews', consultingReviewRoutes);
app.use('/api/consulting', consultingRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/study-materials', studyMaterialRoutes);
app.use('/api/medication-chat', medicationChatRoutes);

app.use(errorHandler);

module.exports = app;
