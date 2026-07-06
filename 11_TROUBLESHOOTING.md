<!-- صادر التزامًا بملف القواعد العامة: .agents/rules/00_GLOBAL_RULES.md -->

# سجل الأخطاء ومعالجتها (Troubleshooting Log)

يسجل هذا المستند جميع المشاكل التقنية والأخطاء التي تمت مواجهتها أثناء تطوير تطبيق **Spoken English**، مع تحليل أسبابها الجذرية وطرق حلها بشكل دائم.

---

### [2026-07-06] خطأ مسار الأداة عند كتابة ملفات المشروع غير التابعة للـ Artifacts

**الخطأ الذي ظهر:**
```
Error invalid tool call: There was a problem parsing the tool call. 
Error Message: model output error: invalid tool call error (invalid_args) d:\attendance-app\app-trial\01_README.md is not a valid artifact path; artifacts must be in C:\Users\Aletqan\.gemini\antigravity-ide\brain\e318e270-8734-4599-8641-95943f6c85cf/
```

**لماذا حدث الخطأ (Root Cause):**
تم استدعاء أداة `write_to_file` لإنشاء ملف المشروع الرئيسي `01_README.md` مع توفير الحقل `ArtifactMetadata` بالخطأ. تتوقع الأداة وجود `ArtifactMetadata` فقط للملفات التي تُنشأ داخل مجلد الـ Artifacts المخصص للـ Brain/System. تمرير هذا الحقل لملف خارج هذا المجلد يتسبب في فشل التحقق من صحة المدخلات البرمجية للأداة.

**كيف تم حله:**
تمت إعادة استدعاء الأداة لإنشاء ملف `01_README.md` مع استبعاد وتصفير حقل `ArtifactMetadata` نهائياً، كون الملف ملفاً برمجياً للمشروع وليس وثيقة للنظام المساعد، مما سمح للأداة بالكتابة بنجاح في مجلد العمل `d:\attendance-app\app-trial`.
