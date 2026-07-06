// Netlify Serverless Function: get-dashboard-stats
// Calculates overall attendance, alert indicators, and trends for dashboard visualizer

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

    // 1. Get total active subjects owned by the teacher
    const subjectsQuery = "SELECT id, name FROM subjects WHERE teacher_id = $1";
    const subjects = await executeQuery(subjectsQuery, [teacherId]);
    const totalSubjects = subjects.length;

    // 2. Get total enrolled students (unique student_id across all owned subjects)
    let totalStudents = 0;
    let overallAttendanceRate = 0;
    let highAbsenceAlerts = [];
    let weeklyTrend = [];

    if (process.env.DATABASE_URL) {
      // Execute database aggregates
      const enrollQuery = `
        SELECT COUNT(DISTINCT student_id) 
        FROM enrollments e
        JOIN subjects s ON e.subject_id = s.id
        WHERE s.teacher_id = $1
      `;
      const enrollRes = await executeQuery(enrollQuery, [teacherId]);
      totalStudents = parseInt(enrollRes[0].count);

      // Overall attendance rate
      const statsQuery = `
        SELECT status FROM attendance_logs 
        WHERE teacher_id = $1
      `;
      const logs = await executeQuery(statsQuery, [teacherId]);
      if (logs.length > 0) {
        const presents = logs.filter(l => l.status === 'present').length;
        overallAttendanceRate = Math.round((presents / logs.length) * 100);
      }

      // High absence subjects (rate < 80%)
      for (const subj of subjects) {
        const subjLogs = await executeQuery("SELECT status FROM attendance_logs WHERE subject_id = $1", [subj.id]);
        if (subjLogs.length > 0) {
          const presents = subjLogs.filter(l => l.status === 'present').length;
          const rate = Math.round((presents / subjLogs.length) * 100);
          if (rate < 80) {
            highAbsenceAlerts.push({
              subject_name: subj.name,
              attendance_rate: rate,
              warning: "معدل غياب مرتفع (High Absenteeism)"
            });
          }
        }
      }

      // Trend analysis (group by attendance_date)
      const trendQuery = `
        SELECT attendance_date, 
               COUNT(*) FILTER (WHERE status = 'present') as presents,
               COUNT(*) as total
        FROM attendance_logs
        WHERE teacher_id = $1
        GROUP BY attendance_date
        ORDER BY attendance_date ASC
        LIMIT 5
      `;
      const trendRes = await executeQuery(trendQuery, [teacherId]);
      weeklyTrend = trendRes.map(t => ({
        label: t.attendance_date.toISOString().split('T')[0],
        rate: Math.round((parseInt(t.presents) / parseInt(t.total)) * 100)
      }));

    } else {
      // Fallback mock calculations based on global arrays
      const db = require('./utils/db');
      
      const teacherSubjectIds = db.mockSubjects
        .filter(s => s.teacher_id === teacherId)
        .map(s => s.id);
      
      const enrolledStudentIds = db.mockEnrollments
        .filter(e => teacherSubjectIds.includes(e.subject_id))
        .map(e => e.student_id);
      
      totalStudents = new Set(enrolledStudentIds).size;

      // Overall attendance rate
      const teacherLogs = db.mockAttendanceLogs.filter(l => l.teacher_id === teacherId);
      if (teacherLogs.length > 0) {
        const presents = teacherLogs.filter(l => l.status === 'present').length;
        overallAttendanceRate = Math.round((presents / teacherLogs.length) * 100);
      }

      // Alerts
      db.mockSubjects.filter(s => s.teacher_id === teacherId).forEach(subj => {
        const subjLogs = db.mockAttendanceLogs.filter(l => l.subject_id === subj.id);
        if (subjLogs.length > 0) {
          const presents = subjLogs.filter(l => l.status === 'present').length;
          const rate = Math.round((presents / subjLogs.length) * 100);
          if (rate < 80) {
            highAbsenceAlerts.push({
              subject_name: subj.name,
              attendance_rate: rate,
              warning: "معدل غياب مرتفع (High Absenteeism)"
            });
          }
        }
      });

      // Default mock trend array
      weeklyTrend = [
        { label: "07-01", rate: 70 },
        { label: "07-02", rate: 85 },
        { label: "07-03", rate: 68 },
        { label: "07-04", rate: 80 },
        { label: "07-05", rate: 92 }
      ];
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        total_subjects: totalSubjects,
        total_students: totalStudents,
        attendance_rate: overallAttendanceRate,
        alerts: highAbsenceAlerts,
        trend: weeklyTrend
      })
    };

  } catch (error) {
    console.error("Get dashboard stats endpoint failure:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "فشل استرجاع بيانات لوحة التحكم: " + error.message })
    };
  }
};
