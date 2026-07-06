<!-- صادر التزامًا بملف القواعد العامة: .agents/rules/00_GLOBAL_RULES.md -->

# مخطط قاعدة البيانات الكامل (Database Schema - v2)

يعتمد نظام **Spoken English** المحدث على هيكل قاعدة بيانات PostgreSQL علائقية متكاملة تتكون من 6 جداول مترابطة لتوفير الدعم لتعدد المعلمين وتعدد المواد وتوزيع الطلاب على المجموعات.

## 1. نصوص إنشاء الجداول (SQL DDL Script)

```sql
-- 1. جدول المعلمين (Teachers Table)
CREATE TABLE teachers (
    id            SERIAL PRIMARY KEY,
    full_name     VARCHAR(150) NOT NULL,
    email         VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول الطلاب (Students Table)
CREATE TABLE students (
    id            SERIAL PRIMARY KEY,
    full_name     VARCHAR(150) NOT NULL,
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول المواد (Subjects Table - Each subject is taught by one teacher)
CREATE TABLE subjects (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,        -- مثال: Spoken English - Level 1
    teacher_id    INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 4. جدول جدولة المادة الأسبوعي (Subject Schedule Table - Weekly days)
CREATE TABLE subject_schedule (
    id            SERIAL PRIMARY KEY,
    subject_id    INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    day_of_week   VARCHAR(10) NOT NULL CHECK (day_of_week IN
                   ('sunday','monday','tuesday','wednesday','thursday','friday','saturday')),
    start_time    TIME,
    end_time      TIME,
    UNIQUE (subject_id, day_of_week)            -- يمنع تكرار نفس اليوم الدراسي لنفس المادة
);

-- 5. جدول تسجيل الطلاب في المواد (Enrollments Table - Many-to-Many relationship)
CREATE TABLE enrollments (
    id            SERIAL PRIMARY KEY,
    student_id    INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id    INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    enrolled_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (student_id, subject_id)             -- يمنع تسجيل الطالب في المادة أكثر من مرة
);

-- 6. جدول سجلات الحضور والغياب (Attendance Logs Table)
CREATE TABLE attendance_logs (
    id              SERIAL PRIMARY KEY,
    student_id      INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id      INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id      INTEGER NOT NULL REFERENCES teachers(id),
    attendance_date DATE NOT NULL,
    status          VARCHAR(10) NOT NULL CHECK (status IN ('present', 'absent')),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (student_id, subject_id, attendance_date) -- يمنع تسجيل حالتين للطالب في نفس المادة واليوم
);
```

## 2. محددات معمارية وقواعد سلامة البيانات

*   **علاقة تسجيل الطلاب بالمواد:**
    الربط بين الطلاب والمواد يتم عبر جدول `enrollments` الذي يمثل علاقة **متعدد إلى متعدد (Many-to-Many)**. هذا يتيح تسجيل الطالب في عدة مواد مختلفة في نفس الوقت.
*   **سلامة سجلات الحضور المزدوجة:**
    الفرادة في جدول الحضور مقيدة بـ `UNIQUE (student_id, subject_id, attendance_date)` مما يتيح إمكانية تسجيل حضور الطالب في مواد مختلفة في نفس اليوم، مع منعه من الحصول على سجلين مكررين في نفس المادة ونفس اليوم.
*   **تشغيل الاستعلامات بفعالية (Dashboard Performance):**
    عمليات احتساب نسبة الحضور في لوحة التحكم تتم عبر تجميع البيانات في محرك قاعدة البيانات باستخدام `GROUP BY` و `COUNT` على مستوى Netlify Functions لمنع إرسال سجلات الحضور الخام إلى الواجهة الأمامية.
*   **حماية كلمات المرور:**
    الحقل `password_hash` يخزن قيم كلمات المرور مجزأة باستخدام خوارزميات التشفير أحادية الاتجاه (مثل `bcrypt`) ولا يتم إرجاعها أو تخزينها كنص صريح بأي شكل.
