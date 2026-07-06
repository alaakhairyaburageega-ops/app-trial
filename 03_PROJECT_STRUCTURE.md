<!-- صادر التزامًا بملف القواعد العامة: .agents/rules/00_GLOBAL_RULES.md -->

# هيكلية المشروع (Project Structure - v2)

يوضح هذا المستند الهيكل التنظيمي المحدّث للمجلدات والملفات في مشروع تطبيق حضور طلاب **Spoken English**:

```
spoken-english-attendance/
├── .agents/
│   └── rules/
│       └── 00_GLOBAL_RULES.md       →   والمبادئ الهندسية السبعة
├── 01_README.md                     → نظرة عامة على التطبيق وفكرته الأساسية
├── 03_PROJECT_STRUCTURE.md          → توثيق هيكلية المجلدات والملفات (هذا الملف)
├── 06_DECISIONS.md                  → سجل القرارات المعمارية (ADR)
├── 09_DATABASE_SCHEMA.md            → مخطط وتصميم قاعدة البيانات (NeonDB / PostgreSQL)
├── 11_TROUBLESHOOTING.md            → سجل تتبع الأخطاء ومعالجتها
├── netlify.toml                     → ملف إعدادات النشر لـ Netlify
├── public/                          → الواجهة الأمامية (Frontend - Vanilla Stack)
│   ├── index.html                   → شاشة تسجيل الدخول للمعلمين (Login)
│   ├── dashboard.html               → لوحة التحكم والإحصائيات المتقدمة (Dashboard)
│   ├── subjects.html                → قائمة المواد المسندة للمعلم الحالي
│   ├── schedule.html                → أيام جدول الحصص الأسبوعي للمادة المحددة
│   ├── attendance.html              → صفحة تسجيل حضور وغياب طلاب المادة
│   ├── css/
│   │   └── styles.css               → الهوية البصرية، الألوان الرسمية، الحالات والمؤثرات
│   └── js/
│       ├── auth.js                  → التحقق من صلاحيات الجلسة والتوجيه وتصفية الدخول
│       ├── dashboard.js             → منطق لوحة التحكم ورسم البياني الإحصائي
│       ├── subjects.js              → منطق استعراض مواد المعلم والتوجيه
│       ├── schedule.js              → منطق عرض جدول المادة وتحديد اليوم الحالي
│       └── attendance.js            → منطق الحضور والغياب وحفظ السجلات
└── netlify/
    └── functions/                   → الدوال عديمة الخادم (Backend - Netlify Functions)
        ├── login.js                 → التحقق من بيانات الدخول وإصدار توكن JWT في cookie
        ├── verify-session.js        → دالة التحقق من صحة التوكن واسترجاع بيانات المعلم
        ├── get-dashboard-stats.js   → دالة حساب وتوفير إحصائيات لوحة التحكم
        ├── get-subjects.js          → دالة جلب قائمة المواد الخاصة بالمعلم الحالي
        ├── get-schedule.js          → دالة جلب الأيام والجدول الأسبوعي لمادة معينة
        ├── get-enrolled-students.js → دالة جلب قائمة الطلاب المسجلين بمادة معينة
        └── save-attendance.js       → دالة حفظ وتحديث سجلات الحضور في قاعدة البيانات
```
