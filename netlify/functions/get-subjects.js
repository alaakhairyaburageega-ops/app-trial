// Netlify Serverless Function: get-subjects
// Fetches the subjects associated with the logged-in teacher

const { executeQuery } = require('./utils/db');
const { authenticateRequest } = require('./utils/auth');

exports.handler = async function(event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const decoded = authenticateRequest(event);

    if (!decoded) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Unauthorized access. Invalid session." })
      };
    }

    const teacherId = decoded.teacher_id;

    // Secure database query for subjects owned by teacherId
    const query = "SELECT id, name, teacher_id, created_at FROM subjects WHERE teacher_id = $1";
    const subjects = await executeQuery(query, [teacherId]);

    // Enhance each subject with mockup/real statistics (student count and attendance rate)
    // To make subjects page look premium
    const enhancedSubjects = await Promise.all(subjects.map(async (subj) => {
      // Get student count (from enrollments)
      const countQuery = "SELECT COUNT(*) FROM enrollments WHERE subject_id = $1";
      // Get attendance logs statistics
      const logsQuery = "SELECT status FROM attendance_logs WHERE subject_id = $1";
      
      let studentCount = 5; // default mock
      let attendanceRate = 90; // default mock

      if (process.env.DATABASE_URL) {
        const studentCountRes = await executeQuery(countQuery, [subj.id]);
        studentCount = parseInt(studentCountRes[0].count);

        const logs = await executeQuery(logsQuery, [subj.id]);
        if (logs.length > 0) {
          const presentLogs = logs.filter(l => l.status === 'present').length;
          attendanceRate = Math.round((presentLogs / logs.length) * 100);
        } else {
          attendanceRate = 0; // No attendance recorded yet
        }
      } else {
        // Fallback mock calculations based on global arrays
        const db = require('./utils/db');
        const enrolled = db.mockEnrollments.filter(e => e.subject_id === subj.id).length;
        studentCount = enrolled;

        const logs = db.mockAttendanceLogs.filter(l => l.subject_id === subj.id);
        if (logs.length > 0) {
          const presents = logs.filter(l => l.status === 'present').length;
          attendanceRate = Math.round((presents / logs.length) * 100);
        } else {
          attendanceRate = 100; // default for mock subject 3
        }
      }

      return {
        ...subj,
        student_count: studentCount,
        attendance_rate: attendanceRate
      };
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(enhancedSubjects)
    };

  } catch (error) {
    console.error("Get subjects endpoint failure:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "فشل استرجاع قائمة المواد: " + error.message })
    };
  }
};
