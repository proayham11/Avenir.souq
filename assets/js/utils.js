// utils.js - دوال مساعدة عامة

// تنسيق السعر
function formatPrice(price) {
    return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: 'SAR'
    }).format(price);
}

// تحويل التاريخ
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// نسخ للنصوص
function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => alert('تم النسخ!'))
        .catch(err => console.error('خطأ في النسخ:', err));
}

// التحقق من البريد الإلكتروني
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// التحقق من الهاتف
function validatePhone(phone) {
    const re = /^05\d{8}$/;
    return re.test(phone);
}

// توليد ID عشوائي
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// حفظ في localStorage
function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// جلب من localStorage
function getFromStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

// عرض رسالة نجاح
function showSuccess(message) {
    alert('✅ ' + message);
}

// عرض رسالة خطأ
function showError(message) {
    alert('❌ ' + message);
}

// تصدير الدوال
window.formatPrice = formatPrice;
window.formatDate = formatDate;
window.copyToClipboard = copyToClipboard;
window.validateEmail = validateEmail;
window.validatePhone = validatePhone;
window.generateId = generateId;
window.saveToStorage = saveToStorage;
window.getFromStorage = getFromStorage;
window.showSuccess = showSuccess;
window.showError = showError;