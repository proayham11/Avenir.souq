// upload.js - النسخة الآمنة والمصححة
let selectedFiles = [];
let uploadedLinks = [];

document.addEventListener('DOMContentLoaded', initUploadSystem);

function initUploadSystem() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    
    if (!dropArea || !fileInput || !uploadBtn) {
        console.log('⏳ انتظار تحميل العناصر...');
        setTimeout(initUploadSystem, 500);
        return;
    }
    
    console.log('✅ تهيئة نظام الرفع');
    setupDragAndDrop(dropArea);
    fileInput.addEventListener('change', handleFileSelect);
    uploadBtn.addEventListener('click', startUpload);
}

async function startUpload() {
    const uploadBtn = document.getElementById('uploadBtn');
    
    if (selectedFiles.length === 0) {
        alert('⚠️ لم تختر أي صور للرفع');
        return;
    }
    
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'جاري الرفع...';
    
    uploadedLinks = [];
    
    try {
        const formData = new FormData();
        selectedFiles.forEach(file => {
            formData.append('images', file);
        });

        console.log('📤 إرسال الطلب إلى السيرفر...');
        const response = await fetch('http://localhost:3000/api/upload-multiple', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        console.log('📥 استجابة السيرفر:', result);
        
        if (result.success) {
            uploadedLinks = result.images.map(img => img.rawUrl);
            
            // حفظ الروابط في localStorage
            localStorage.setItem('uploaded_image_links', JSON.stringify(uploadedLinks));
            
            // عرض النتائج
            showResults();
            
            console.log('✅ تم رفع الصور بنجاح:', uploadedLinks);
        } else {
            throw new Error(result.error || 'حدث خطأ غير معروف');
        }
        
    } catch (error) {
        console.error('❌ خطأ في الرفع:', error);
        alert('حدث خطأ أثناء الرفع: ' + error.message);
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = '⬆️ رفع الصور إلى GitHub';
    }
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        selectedFiles = files;
        showPreview(files);
        document.getElementById('uploadBtn').style.display = 'block';
    }
}

function showPreview(files) {
    const previewSection = document.getElementById('previewSection');
    const previewGrid = document.getElementById('previewGrid');
    
    if (!previewSection || !previewGrid) {
        console.error('❌ عناصر المعاينة غير موجودة');
        return;
    }
    
    previewSection.style.display = 'block';
    previewGrid.innerHTML = '';
    
    files.forEach((file, index) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.innerHTML = `
                <img src="${e.target.result}" alt="معاينة">
                <div class="file-info">
                    <span>${file.name}</span>
                    <small>${formatFileSize(file.size)}</small>
                </div>
                <button onclick="removeFile(${index})">✕</button>
            `;
            previewGrid.appendChild(previewItem);
        };
        
        reader.readAsDataURL(file);
    });
}

function showResults() {
    const uploadBtn = document.getElementById('uploadBtn');
    const previewSection = document.getElementById('previewSection');
    const results = document.getElementById('results');
    const linksContainer = document.getElementById('linksContainer');
    
    if (uploadBtn) uploadBtn.style.display = 'none';
    if (previewSection) previewSection.style.display = 'none';
    if (results) results.style.display = 'block';
    
    if (linksContainer) {
        linksContainer.innerHTML = '';
        
        uploadedLinks.forEach(link => {
            const linkBox = document.createElement('div');
            linkBox.className = 'link-box';
            linkBox.innerHTML = `
                <input type="text" value="${link}" readonly onclick="this.select()">
                <button onclick="copyLink('${link}')">نسخ</button>
            `;
            linksContainer.appendChild(linkBox);
        });
    }
    
    console.log('💾 تم حفظ الروابط في localStorage');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 ب';
    const k = 1024;
    const sizes = ['ب', 'ك.ب', 'م.ب', 'ج.ب'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function copyLink(link) {
    navigator.clipboard.writeText(link);
    alert('✅ تم نسخ الرابط!');
}

function copyAllLinks() {
    const allLinks = uploadedLinks.join('\n');
    navigator.clipboard.writeText(allLinks);
    alert('✅ تم نسخ جميع الروابط!');
}

function goBack() {
    window.history.back();
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    
    if (selectedFiles.length === 0) {
        document.getElementById('uploadBtn').style.display = 'none';
        const previewSection = document.getElementById('previewSection');
        if (previewSection) previewSection.style.display = 'none';
    } else {
        showPreview(selectedFiles);
    }
}

function setupDragAndDrop(dropArea) {
    // منع السلوك الافتراضي
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // إظهار التأثير
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, function() {
            dropArea.classList.add('highlight');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, function() {
            dropArea.classList.remove('highlight');
        }, false);
    });
    
    // التعامل مع الإفلات
    dropArea.addEventListener('drop', function(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFileSelect({ target: { files } });
    }, false);
}

// جعل الدوال متاحة عالمياً
window.removeFile = removeFile;
window.copyLink = copyLink;
window.copyAllLinks = copyAllLinks;
window.goBack = goBack;