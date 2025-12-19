const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Octokit } = require('@octokit/rest');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// إعدادات CORS للسماح بالواجهة
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:5500'],
    credentials: true
}));
app.use(express.json());
app.use(express.static('.')); // تقديم الملفات الثابتة

// إعداد Octokit مع التوكن الآمن من .env
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

const UPLOAD_CONFIG = {
    USERNAME: process.env.GITHUB_USERNAME || 'proayham11',
    REPOSITORY: process.env.GITHUB_REPO || 'avenir-images',
    BRANCH: 'main',
    FOLDER: 'products'
};

// إعداد multer لمعالجة الرفع
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('الملف يجب أن يكون صورة فقط'));
        }
    }
});

// مسار الصحة
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK',
        config: {
            username: UPLOAD_CONFIG.USERNAME,
            repository: UPLOAD_CONFIG.REPOSITORY,
            folder: UPLOAD_CONFIG.FOLDER
        }
    });
});

// مسار التحقق من إعدادات GitHub
app.get('/api/verify-config', async (req, res) => {
    try {
        const { data } = await octokit.repos.get({
            owner: UPLOAD_CONFIG.USERNAME,
            repo: UPLOAD_CONFIG.REPOSITORY
        });
        
        res.json({
            success: true,
            message: '✅ إعدادات GitHub صحيحة',
            repo: data.full_name,
            private: data.private
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: '❌ خطأ في إعدادات GitHub',
            error: error.message
        });
    }
});

// مسار رفع الصورة إلى GitHub
app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'لم يتم اختيار أي صورة' });
        }

        const file = req.file;
        const fileName = `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
        const filePath = `${UPLOAD_CONFIG.FOLDER}/${fileName}`;
        
        // تحويل الصورة إلى base64
        const base64Content = file.buffer.toString('base64');
        
        // رفع الصورة إلى GitHub
        const { data } = await octokit.repos.createOrUpdateFileContents({
            owner: UPLOAD_CONFIG.USERNAME,
            repo: UPLOAD_CONFIG.REPOSITORY,
            path: filePath,
            message: `رفع صورة منتج: ${file.originalname}`,
            content: base64Content,
            branch: UPLOAD_CONFIG.BRANCH
        });

        // إنشاء رابط GitHub Pages
        const rawUrl = `https://raw.githubusercontent.com/${UPLOAD_CONFIG.USERNAME}/${UPLOAD_CONFIG.REPOSITORY}/${UPLOAD_CONFIG.BRANCH}/${filePath}`;
        const pagesUrl = `https://${UPLOAD_CONFIG.USERNAME}.github.io/${UPLOAD_CONFIG.REPOSITORY}/${filePath}`;

        res.json({
            success: true,
            message: '✅ تم رفع الصورة بنجاح',
            fileName: file.originalname,
            urls: {
                raw: rawUrl,
                pages: pagesUrl,
                github: data.content.html_url
            },
            size: file.size,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('خطأ في رفع الصورة:', error);
        res.status(500).json({
            success: false,
            error: 'فشل في رفع الصورة',
            details: error.message
        });
    }
});

// مسار رفع متعدد
app.post('/api/upload-multiple', upload.array('images', 10), async (req, res) => {
    try {
        const files = req.files;
        
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'لم يتم اختيار أي صور' });
        }

        const uploadPromises = files.map(async (file) => {
            const fileName = `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
            const filePath = `${UPLOAD_CONFIG.FOLDER}/${fileName}`;
            const base64Content = file.buffer.toString('base64');

            await octokit.repos.createOrUpdateFileContents({
                owner: UPLOAD_CONFIG.USERNAME,
                repo: UPLOAD_CONFIG.REPOSITORY,
                path: filePath,
                message: `رفع صورة منتج: ${file.originalname}`,
                content: base64Content,
                branch: UPLOAD_CONFIG.BRANCH
            });

            return {
                fileName: file.originalname,
                rawUrl: `https://raw.githubusercontent.com/${UPLOAD_CONFIG.USERNAME}/${UPLOAD_CONFIG.REPOSITORY}/${UPLOAD_CONFIG.BRANCH}/${filePath}`,
                pagesUrl: `https://${UPLOAD_CONFIG.USERNAME}.github.io/${UPLOAD_CONFIG.REPOSITORY}/${filePath}`,
                size: file.size
            };
        });

        const results = await Promise.allSettled(uploadPromises);
        const successfulUploads = results.filter(r => r.status === 'fulfilled').map(r => r.value);
        const failedUploads = results.filter(r => r.status === 'rejected');

        res.json({
            success: true,
            total: files.length,
            uploaded: successfulUploads.length,
            failed: failedUploads.length,
            images: successfulUploads,
            errors: failedUploads.map(f => f.reason.message)
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'فشل في رفع الصور',
            details: error.message
        });
    }
});

// مسار الحصول على الإعدادات الآمنة
app.get('/api/config', (req, res) => {
    res.json({
        username: UPLOAD_CONFIG.USERNAME,
        repository: UPLOAD_CONFIG.REPOSITORY,
        folder: UPLOAD_CONFIG.FOLDER,
        maxFiles: 10,
        maxSize: '5MB'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 السيرفر يعمل على port ${PORT}`);
    console.log(`🚀 السيرفر يعمل على http://localhost:${PORT}`);
    console.log(`📁 المستودع: ${UPLOAD_CONFIG.USERNAME}/${UPLOAD_CONFIG.REPOSITORY}`);
    console.log(`🔒 التوكن مخفي بأمان في ملف .env`);
});