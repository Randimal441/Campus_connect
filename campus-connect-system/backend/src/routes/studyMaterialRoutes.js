const express = require('express');
const multer = require('multer');
const path = require('path');
const {
    getAllMaterials,
    getMyMaterials,
    uploadMaterial,
    downloadMaterial,
    rateMaterial,
    reportMaterial,
    deleteMaterial,
    summarizeMaterial,
} = require('../controllers/studyMaterialController');
const { protect } = require('../middlewares/authMiddleware');

// Multer storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `material-${uniqueSuffix}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Only .pdf, .doc, .docx, .ppt, .pptx, .txt files are allowed.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/', getAllMaterials);
router.get('/my', getMyMaterials);
router.post('/upload', upload.single('file'), uploadMaterial);
router.get('/:id/download', downloadMaterial);
router.post('/:id/rate', rateMaterial);
router.post('/:id/report', reportMaterial);
router.delete('/:id', deleteMaterial);
router.post('/:id/summarize', summarizeMaterial);

module.exports = router;
