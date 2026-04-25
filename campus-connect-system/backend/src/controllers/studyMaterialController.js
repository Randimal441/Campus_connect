const path = require('path');
const fs = require('fs');
const StudyMaterial = require('../models/StudyMaterial');

// ---------- helpers ----------
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// ---------- GET all materials ----------
const getAllMaterials = async (req, res, next) => {
    try {
        const { search, subject } = req.query;
        console.log(`Getting all materials (Search: "${search || ''}", Subject: "${subject || 'All'}") for user: ${req.user?._id}`);
        
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

        console.log(`Found ${materials.length} materials.`);
        res.json(materials);
    } catch (error) {
        next(error);
    }
};

// ---------- GET logged-in user's materials ----------
const getMyMaterials = async (req, res, next) => {
    try {
        console.log(`Getting materials for logged-in user: ${req.user?._id}`);
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
            console.warn('Upload attempt without file.');
            return res.status(400).json({ message: 'Please upload a file.' });
        }

        const { title, description, subject } = req.body;
        console.log(`Uploading: "${title}" by user: ${req.user?._id}`);
        console.log(`Multer saved file to: ${req.file.path}`);

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

        console.log(`Material document created: ${material._id}`);

        const populated = await StudyMaterial.findById(material._id).populate(
            'uploadedBy',
            'fullName email'
        );
        res.status(201).json(populated);
    } catch (error) {
        console.error('Upload Error:', error);
        next(error);
    }
};

// ---------- GET download material ----------
const downloadMaterial = async (req, res, next) => {
    try {
        const materialId = req.params.id;
        console.log(`Download requested for material ID: ${materialId} by user: ${req.user?._id}`);

        const material = await StudyMaterial.findById(materialId);
        if (!material) {
            console.warn(`Material not found: ${materialId}`);
            return res.status(404).json({ message: 'Not found.' });
        }

        // Increment download count
        material.downloadCount += 1;
        await material.save();

        const filePath = path.join(UPLOADS_DIR, path.basename(material.fileUrl));
        console.log(`Resolved file path: ${filePath}`);

        if (!fs.existsSync(filePath)) {
            console.error(`File does not exist on disk: ${filePath}`);
            return res.status(404).json({ message: 'File not found on server.' });
        }

        console.log(`Sending file: ${material.fileName}`);
        res.download(filePath, material.fileName);
    } catch (error) {
        console.error('Download error:', error);
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
        console.log(`Summarization requested for material: ${req.params.id}`);
        const material = await StudyMaterial.findById(req.params.id);
        if (!material) return res.status(404).json({ message: 'Not found.' });

        // RETURN CACHED SUMMARY IF EXISTS
        if (material.aiSummary) {
            console.log('Returning cached summary.');
            return res.json({ summary: material.aiSummary });
        }

        const filePath = path.join(UPLOADS_DIR, path.basename(material.fileUrl));
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            return res.status(404).json({ message: 'File not found on server.' });
        }

        let textContent = '';
        const ext = path.extname(material.fileName).toLowerCase();
        console.log(`Starting text extraction for ${ext} file: ${material.fileName}`);

        try {
            if (ext === '.txt') {
                textContent = fs.readFileSync(filePath, 'utf-8');
            } else if (ext === '.pdf') {
                const pdfParse = require('pdf-parse');
                const dataBuffer = fs.readFileSync(filePath);
                const pdfData = await pdfParse(dataBuffer);
                textContent = pdfData.text;
            } else {
                return res.status(400).json({
                    message: 'AI summarization currently supports .txt and .pdf files only.',
                });
            }
        } catch (extractErr) {
            console.error('Text extraction error:', extractErr);
            return res.status(500).json({ message: 'Failed to extract text from file. The file might be corrupted or protected.' });
        }

        console.log(`Text extracted successfully. Length: ${textContent?.length || 0} characters.`);

        if (!textContent || textContent.trim().length < 20) {
            console.warn('Text content too short for summarization.');
            return res.status(400).json({ message: 'File content is too short to summarize.' });
        }

        // Trim to prevent exceeding API limits
        const trimmed = textContent.substring(0, 30000); 

        const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_HIMANSHA || '').trim();
        if (!GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY is missing in .env');
            return res.status(500).json({ message: 'AI service is not configured.' });
        }

        console.log(`Calling Gemini API via @google/genai SDK...`);
        let genAI;
        try {
            const mod = await import('@google/genai');
            const { GoogleGenAI } = mod;
            genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        } catch (err) {
            console.error('Failed to initialize @google/genai:', err);
            return res.status(500).json({ message: 'AI initialization failed.' });
        }

        let summary;
        try {
            const promptText = `Generate a professional summary of the following study material in Markdown format. Use headings and bullet points. Include a "Key Takeaway" section.\n\nContent:\n${trimmed}`;

            // Model Priority: 1. gemini-1.5-flash, 2. gemini-pro, 3. gemini-3-flash-preview
            const modelsToTry = ['gemini-1.5-flash', 'gemini-pro', 'gemini-3-flash-preview'];
            let lastError = null;

            for (const modelName of modelsToTry) {
                try {
                    console.log(`Attempting Gemini model: ${modelName}...`);
                    const result = await genAI.models.generateContent({
                        model: modelName,
                        contents: [{ role: 'user', parts: [{ text: promptText }] }],
                        generationConfig: { maxOutputTokens: 2048 },
                    });

                    summary = result?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (summary) {
                        console.log(`Success with model: ${modelName}`);
                        break; 
                    }
                } catch (err) {
                    lastError = err;
                    console.warn(`Model ${modelName} failed: ${err.message}`);
                    continue; // Try next model
                }
            }

            if (!summary && lastError) throw lastError;

        } catch (err) {
            console.error('All Gemini fallback models failed:', err.message);
            if (err.status === 429 || err.message?.includes('429')) {
                return res.status(429).json({ message: 'AI service quota exceeded. Please try again later.' });
            }
            if (err.status === 503 || err.message?.includes('503')) {
                return res.status(503).json({ message: 'AI service is currently overloaded. Please try again in a few minutes.' });
            }
            throw err;
        }

        if (!summary) {
            console.error('Gemini API returned no summary.');
            return res.status(500).json({ message: 'Could not generate a summary. The AI returned an empty response.' });
        }

        console.log('Summary generated successfully!');
        // CACHE THE SUMMARY
        material.aiSummary = summary;
        await material.save();

        res.json({ summary });
    } catch (error) {
        console.error('Summarize Unexpected Error:', error);
        if (error.status === 429) {
            return res.status(429).json({ message: 'AI service quota exceeded. Please try again later.' });
        }
        res.status(502).json({ message: 'AI service is currently busy or unavailable. Please try again in a few moments.' });
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
