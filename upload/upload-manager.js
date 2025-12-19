// upload-manager.js - النسخة المعدلة للعمل مع السيرفر
class UploadManager {
    constructor() {
        this.files = [];
        this.uploadedUrls = [];
        this.init();
    }
    
    init() {
        this.setupDragAndDrop();
        this.setupFileInput();
    }
    
    // إعداد السحب والإفلات
    setupDragAndDrop() {
        const dropArea = document.getElementById('dropArea');
        if (!dropArea) {
            console.error('❌ dropArea غير موجود');
            return;
        }
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, this.preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, this.highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, this.unhighlight, false);
        });
        
        dropArea.addEventListener('drop', this.handleDrop.bind(this), false);
    }
    
    setupFileInput() {
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        }
    }
    
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    highlight() {
        const dropArea = document.getElementById('dropArea');
        if (dropArea) dropArea.classList.add('dragover');
    }
    
    unhighlight() {
        const dropArea = document.getElementById('dropArea');
        if (dropArea) dropArea.classList.remove('dragover');
    }
    
    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        this.handleFiles(files);
    }
    
    handleFileSelect(e) {
        const files = e.target.files;
        this.handleFiles(files);
    }
    
    // معالجة الملفات المختارة
    handleFiles(fileList) {
        const files = Array.from(fileList);
        
        if (files.length > 10) {
            alert('الحد الأقصى 10 صور في المرة الواحدة');
            return;
        }
        
        for (const file of files) {
            if (file.size > 5 * 1024 * 1024) {
                alert(`الصورة ${file.name} كبيرة جداً (الحد الأقصى 5MB)`);
                return;
            }
            
            if (!file.type.startsWith('image/')) {
                alert(`الملف ${file.name} ليس صورة`);
                return;
            }
        }
        
        this.files = files;
        this.displayPreview();
    }
    
    // عرض معاينة الصور
    displayPreview() {
        const previewContainer = document.getElementById('previewContainer');
        const imagePreview = document.getElementById('imagePreview');
        
        if (!previewContainer || !imagePreview) return;
        
        imagePreview.innerHTML = '';
        previewContainer.style.display = 'block';
        
        this.files.forEach((file, index) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <button class="remove-preview" onclick="uploadManager.removeFile(${index})">×</button>
                    <div style="position: absolute; bottom: 0; background: rgba(0,0,0,0.7); width: 100%; padding: 5px; font-size: 11px; color: white;">
                        ${this.truncateFilename(file.name)} (${this.formatBytes(file.size)})
                    </div>
                `;
                imagePreview.appendChild(previewItem);
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    // رفع الصور إلى السيرفر
    async uploadImages() {
        if (this.files.length === 0) {
            alert('لم تختر أي صور');
            return;
        }
        
        this.showProgress();
        this.uploadedUrls = [];
        const totalFiles = this.files.length;
        
        try {
            const formData = new FormData();
            this.files.forEach(file => formData.append('images', file));
            
            const response = await fetch(`${window.UPLOAD_CONFIG.API_URL}/upload-multiple`, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.uploadedUrls = result.images.map(img => img.rawUrl);
                
                // عرض الروابط
                this.uploadedUrls.forEach((url, index) => {
                    this.displayUploadedLink(this.files[index].name, url);
                });
                
                // حفظ في localStorage
                localStorage.setItem('uploaded_image_links', JSON.stringify(this.uploadedUrls));
                
                this.completeUpload();
            } else {
                throw new Error(result.error || 'فشل في رفع الصور');
            }
            
        } catch (error) {
            console.error('خطأ في الرفع:', error);
            alert('حدث خطأ: ' + error.message);
        }
    }
    
    // استخدام الصور في المنتج
    useImages() {
        if (this.uploadedUrls.length === 0) {
            alert('لم يتم رفع أي صور بعد');
            return;
        }
        
        if (window.opener) {
            window.opener.postMessage({
                type: 'images_uploaded',
                images: this.uploadedUrls
            }, '*');
        }
        
        setTimeout(() => {
            window.close();
        }, 1000);
    }
    
    // دوال المساعدة
    showProgress() {
        const progressContainer = document.getElementById('progressContainer');
        if (progressContainer) progressContainer.style.display = 'block';
    }
    
    displayUploadedLink(filename, url) {
        const linksContainer = document.getElementById('uploadedLinks');
        if (!linksContainer) return;
        
        const linkBox = document.createElement('div');
        linkBox.className = 'link-box';
        linkBox.innerHTML = `
            <strong>✅ ${this.truncateFilename(filename)}</strong>
            <input type="text" value="${url}" readonly onclick="this.select()">
            <button class="copy-btn" onclick="navigator.clipboard.writeText('${url}')">
                نسخ الرابط
            </button>
        `;
        linksContainer.appendChild(linkBox);
    }
    
    completeUpload() {
        const progressContainer = document.getElementById('progressContainer');
        const resultContainer = document.getElementById('resultContainer');
        
        if (progressContainer) progressContainer.style.display = 'none';
        if (resultContainer) resultContainer.style.display = 'block';
    }
    
    // دوال مساعدة للنصوص
    truncateFilename(filename, maxLength = 25) {
        if (filename.length <= maxLength) return filename;
        return filename.substring(0, maxLength - 3) + '...';
    }
    
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
    
    removeFile(index) {
        this.files.splice(index, 1);
        this.displayPreview();
        
        if (this.files.length === 0) {
            const previewContainer = document.getElementById('previewContainer');
            if (previewContainer) previewContainer.style.display = 'none';
        }
    }
    
    clearSelection() {
        this.files = [];
        this.uploadedUrls = [];
        
        const previewContainer = document.getElementById('previewContainer');
        const resultContainer = document.getElementById('resultContainer');
        const progressContainer = document.getElementById('progressContainer');
        const uploadedLinks = document.getElementById('uploadedLinks');
        const fileInput = document.getElementById('fileInput');
        
        if (previewContainer) previewContainer.style.display = 'none';
        if (resultContainer) resultContainer.style.display = 'none';
        if (progressContainer) progressContainer.style.display = 'none';
        if (uploadedLinks) uploadedLinks.innerHTML = '';
        if (fileInput) fileInput.value = '';
    }
}

// إنشاء مثيل المدير
let uploadManager;

function initUploadSystem() {
    uploadManager = new UploadManager();
    
    // جعل الدوال متاحة globally
    window.uploadManager = uploadManager;
    window.uploadImages = () => uploadManager.uploadImages();
    window.clearSelection = () => uploadManager.clearSelection();
    window.useImages = () => uploadManager.useImages();
}