// ============================================
// إعدادات الواجهة الآمنة - النسخة النهائية
// ============================================

window.UPLOAD_CONFIG = {
    // سيتم تعيينه تلقائياً بناءً على الموقع الحالي
    API_URL: window.location.origin + '/api',
    MAX_FILES: 10,
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
};

console.log('🔧 نظام الرفع الآمن جاهز');
console.log('⚙️ الإعدادات:', window.UPLOAD_CONFIG);
console.log('🌐 الموقع الحالي:', window.location.origin);

// ============================================
// دوال مساعدة
// ============================================

async function verifyServerConnection() {
    try {
        // استخدام الرابط الديناميكي
        const apiUrl = window.UPLOAD_CONFIG.API_URL;
        console.log('🔗 محاولة الاتصال بـ:', apiUrl);
        
        const response = await fetch(`${apiUrl}/health`);
        const data = await response.json();
        console.log('✅ اتصال السيرفر:', data);
        return true;
    } catch (error) {
        console.error('❌ خطأ في الاتصال بالسيرفر:', error);
        return false;
    }
}

// التحقق من الإعدادات عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 تحميل صفحة الرفع...');
    
    // إظهار معلومات الاتصال
    console.log('📍 الموقع:', window.location.href);
    console.log('🚪 Port:', window.location.port);
    
    setTimeout(() => {
        verifyServerConnection().then(connected => {
            if (!connected) {
                const errorDiv = document.createElement('div');
                errorDiv.style.cssText = `
                    background: #fff3cd;
                    color: #856404;
                    padding: 15px;
                    border: 1px solid #ffeaa7;
                    border-radius: 5px;
                    margin: 20px 0;
                    font-family: Arial, sans-serif;
                `;
                
                errorDiv.innerHTML = `
                    <strong>⚠️ تحذير: السيرفر غير متصل</strong>
                    <p>تأكد من:</p>
                    <ol>
                        <li>السيرفر يعمل على <strong>${window.UPLOAD_CONFIG.API_URL}</strong></li>
                        <li>لا توجد مشاكل في CORS</li>
                        <li>التوكن صحيح في السيرفر</li>
                    </ol>
                    <p><small>إذا كنت محلياً، تأكد أن السيرفر يعمل على localhost:3000</small></p>
                `;
                
                document.body.insertBefore(errorDiv, document.body.firstChild);
            } else {
                console.log('🎉 النظام جاهز للاستخدام!');
            }
        });
    }, 1000);
});

// جعل الدوال متاحة عالمياً للاختبار
window.verifyServerConnection = verifyServerConnection;