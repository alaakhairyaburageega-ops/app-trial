// Netlify Serverless Function: save-attendance
// Records and UPSERTs attendance logs to database under authenticated teacher session

const { executeQuery } = require('./utils/db');

exports.handler = async function (event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed. Use POST." })
    };
  }

  try {
    const { subject_id, date, records } = JSON.parse(event.body);

    if (!subject_id || !date || !records || !Array.length) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "البيانات المرسلة غير مكتملة." })
      };
    }

    // المعلم التجريبي الحالي يحمل الرقم 1 افتراضياً في بيئة التطوير السحابية
    const currentTeacherId = 1;

    // إدخال أو تحديث السجلات (UPSERT) بناءً على المفتاح الفريد المركب
    const query = `
      INSERT INTO attendance_logs (student_id, subject_id, teacher_id, attendance_date, status)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (student_id, subject_id, attendance_date) 
      DO UPDATE SET status = EXCLUDED.status, created_at = NOW();
    `;

    for (const record of records) {
      await executeQuery(query, [
        parseInt(record.student_id),
        parseInt(subject_id),
        currentTeacherId,
        date,
        record.status
      ]);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: "تم حفظ السجلات بنجاح في قاعدة البيانات السحابية." })
    };

  } catch (error) {
    console.error("Save attendance failure:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "حدث خطأ داخل السيرفر أثناء الحفظ: " + error.message })
    };
  }
};