// Netlify Serverless Function: get-enrolled-students
// Fetches the students enrolled in a subject, merged with attendance status for a specific date (v2)

const { executeQuery } = require('./utils/db');

exports.handler = async function (event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json"
  };

  // معالجة طلبات Preflight (OPTIONS)
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    // استخراج المتغيرات بأمان من رابط الطلب
    const params = event.queryStringParameters || {};
    const subject_id = params.subject_id;
    const date = params.date;

    // التحقق من وجود معرف المادة
    if (!subject_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "معرّف المادة (subject_id) مطلوب كحجة استعلام." })
      };
    }

    const parsedSubjectId = parseInt(subject_id);

    // 1. جلب الطلاب المسجلين في هذه المادة بناءً على جدول الجسور الجديد enrollments
    const studentsQuery = `
      SELECT s.id, s.full_name 
      FROM students s 
      JOIN enrollments e ON s.id = e.student_id 
      WHERE e.subject_id = $1 AND s.is_active = true
      ORDER BY s.full_name ASC
    `;
    const students = await executeQuery(studentsQuery, [parsedSubjectId]);

    // الهيكلية الافتراضية للطلاب (بدون رصد حضور مسبق)
    let mergedStudents = students.map(student => ({
      id: student.id,
      full_name: student.full_name,
      status: null
    }));

    // 2. إذا تم تمرير تاريخ محدد، يتم دمج حالة الحضور والغياب المسجلة سابقاً في هذا اليوم
    if (date) {
      const logsQuery = `
        SELECT student_id, status 
        FROM attendance_logs 
        WHERE subject_id = $1 AND attendance_date = $2
      `;
      const logs = await executeQuery(logsQuery, [parsedSubjectId, date]);

      // بناء خريطة مطابقة (Map) لمعرف الطالب وحالته
      const statusMap = {};
      logs.forEach(log => {
        statusMap[log.student_id] = log.status;
      });

      // دمج الحالات مع قائمة الطلاب المسجلين
      mergedStudents = students.map(student => ({
        id: student.id,
        full_name: student.full_name,
        status: statusMap[student.id] || null
      }));
    }

    // إرجاع النتيجة النهائية بنجاح
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(mergedStudents)
    };

  } catch (error) {
    console.error("Get enrolled students endpoint failure:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "فشل استرجاع قائمة الطلاب: " + error.message })
    };
  }
};