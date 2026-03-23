const path = require('path');
const fs = require('fs');
const StudyMaterial = require('../models/StudyMaterial');

// ---------- helpers ----------
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// ---------- GET all materials ----------
const getAllMaterials = async (req, res, next) => {
    try {
        const { search, subject } = req.query;
        const filter = {};

        if (subject && subject !== 'All') {
            filter.subject = subject;
        }
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        const materials = await StudyMaterial.find(filter)
            .populate('uploadedBy', 'fullName email')
            .sort({ createdAt: -1 });

        res.json(materials);
    } catch (error) {
        next(error);
    }
};

// ---------- GET logged-in user's materials ----------
const getMyMaterials = async (req, res, next) => {
    try {
        const materials = await StudyMaterial.find({ uploadedBy: req.user._id })
            .populate('uploadedBy', 'fullName email')
            .sort({ createdAt: -1 });

        res.json(materials);
    } catch (error) {
        next(error);
    }
};

// ---------- POST upload material ----------
const uploadMaterial = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file.' });
        }

        const { title, description, subject } = req.body;
        if (!title) {
            return res.status(400).json({ message: 'Title is required.' });
        }

        const material = await StudyMaterial.create({
            title,
            description: description || '',
            subject: subject || 'General',
            fileUrl: `/uploads/${req.file.filename}`,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            uploadedBy: req.user._id,
        });

        const populated = await StudyMaterial.findById(material._id).populate(
            'uploadedBy',
            'fullName email'
        );
        res.status(201).json(populated);
    } catch (error) {
        next(error);
    }
};

// ---------- GET download material ----------
const downloadMaterial = async (req, res, next) => {
    try {
        const material = await StudyMaterial.findById(req.params.id);
        if (!material) return res.status(404).json({ message: 'Not found.' });

        // Increment download count
        material.downloadCount += 1;
        await material.save();

        const filePath = path.join(UPLOADS_DIR, path.basename(material.fileUrl));

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found on server.' });
        }

        res.download(filePath, material.fileName);
    } catch (error) {
        next(error);
    }
};

// ---------- POST rate a material ----------
const rateMaterial = async (req, res, next) => {
    try {
        const { value } = req.body;
        if (!value || value < 1 || value > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
        }

        const material = await StudyMaterial.findById(req.params.id);
        if (!material) return res.status(404).json({ message: 'Not found.' });

        // Check if user already rated – update instead of duplicate
        const existingIdx = material.ratings.findIndex(
            (r) => r.user.toString() === req.user._id.toString()
        );

        if (existingIdx >= 0) {
            material.ratings[existingIdx].value = value;
        } else {
            material.ratings.push({ user: req.user._id, value });
        }

        material.recalcRating();
        await material.save();

        res.json({
            message: 'Rating submitted.',
            averageRating: material.averageRating,
            totalRatings: material.totalRatings,
        });
    } catch (error) {
        next(error);
    }
};

// ---------- POST report a material ----------
const reportMaterial = async (req, res, next) => {
    try {
        const { reason } = req.body;
        if (!reason) {
            return res.status(400).json({ message: 'Report reason is required.' });
        }

        const material = await StudyMaterial.findById(req.params.id);
        if (!material) return res.status(404).json({ message: 'Not found.' });

        // Prevent duplicate reports from the same user
        const alreadyReported = material.reports.some(
            (r) => r.user.toString() === req.user._id.toString()
        );
        if (alreadyReported) {
            return res.status(400).json({ message: 'You have already reported this resource.' });
        }

        material.reports.push({ user: req.user._id, reason });
        await material.save();

        res.json({ message: 'Report submitted. Thank you for keeping the campus safe!' });
    } catch (error) {
        next(error);
    }
};

// ---------- DELETE own material ----------
const deleteMaterial = async (req, res, next) => {
    try {
        const material = await StudyMaterial.findById(req.params.id);
        if (!material) return res.status(404).json({ message: 'Not found.' });

        // Only allow owner or admin to delete
        const isOwner = material.uploadedBy.toString() === req.user._id.toString();
        const isAdmin = ['super_admin', 'resource_coordinator'].includes(req.user.role);

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'You are not authorized to delete this material.' });
        }

        // Remove actual file from disk
        const filePath = path.join(UPLOADS_DIR, path.basename(material.fileUrl));
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await StudyMaterial.findByIdAndDelete(req.params.id);
        res.json({ message: 'Material deleted successfully.' });
    } catch (error) {
        next(error);
    }
};

// ---------- POST AI summarize ----------
const summarizeMaterial = async (req, res, next) => {
    try {
        const material = await StudyMaterial.findById(req.params.id);
        if (!material) return res.status(404).json({ message: 'Not found.' });

        const filePath = path.join(UPLOADS_DIR, path.basename(material.fileUrl));
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found on server.' });
        }

        let textContent = '';
        const ext = path.extname(material.fileName).toLowerCase();

        if (ext === '.txt') {
            textContent = fs.readFileSync(filePath, 'utf-8');
        } else if (ext === '.pdf') {
            const pdfParse = require('pdf-parse');
            const dataBuffer = fs.readFileSync(filePath);
            const pdfData = await pdfParse(dataBuffer);
            textContent = pdfData.text;
        } else {
            // For .doc, .docx, .ppt, .pptx — return a helpful message
            return res.status(400).json({
                message: 'AI summarization currently supports .txt and .pdf files only.',
            });
        }

        if (!textContent || textContent.trim().length < 20) {
            return res.status(400).json({ message: 'File content is too short to summarize.' });
        }

        // Trim to prevent exceeding API limits
        const trimmed = textContent.substring(0, 15000);

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            return res.status(500).json({ message: 'AI service is not configured. Please add GEMINI_API_KEY to .env' });
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: `You are an academic study assistant. Summarize the following study material in a clear, well-structured format. Use bullet points for key concepts. Keep it concise but comprehensive.\n\n---\n${trimmed}`,
                                },
                            ],
                        },
                    ],
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Gemini API error:', errorData);
            return res.status(502).json({ message: 'AI service returned an error. Please try again later.' });
        }

        const data = await response.json();
        const summary =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            'Could not generate a summary.';

        res.json({ summary });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllMaterials,
    getMyMaterials,
    uploadMaterial,
    downloadMaterial,
    rateMaterial,
    reportMaterial,
    deleteMaterial,
    summarizeMaterial,
};
