// Relational Database Adapter / Mock Fallback for NeonDB (PostgreSQL)
// Written to satisfy 00_GLOBAL_RULES.md (Separation of Concerns & No assumptions)

const { Client } = require('pg');

// Pre-populated High-Fidelity Mock Data for local/staging when DATABASE_URL is not set
const mockTeachers = [
  { id: 1, full_name: "محمد القحطاني", email: "teacher@spoken.com", password_hash: "password123" },
  { id: 2, full_name: "أحمد العتيبي", email: "admin@spoken.com", password_hash: "admin123" }
];

const mockStudents = [
  { id: 1, full_name: "خالد عبد الرحمن السديري" },
  { id: 2, full_name: "سارة فهد بن دخيل" },
  { id: 3, full_name: "فاطمة علي الحربي" },
  { id: 4, full_name: "عبد الله عمر القحطاني" },
  { id: 5, full_name: "ريما صالح اليوسف" },
  { id: 6, full_name: "محمد سليمان الدوسري" },
  { id: 7, full_name: "نورة فيصل المطيري" },
  { id: 8, full_name: "أحمد محمد العتيبي" }
];

const mockSubjects = [
  { id: 1, name: "Spoken English - Level 1", teacher_id: 1 },
  { id: 2, name: "Business English - Advanced", teacher_id: 1 },
  { id: 3, name: "Kids Spoken English", teacher_id: 2 }
];

const mockSubjectSchedule = [
  { id: 1, subject_id: 1, day_of_week: "sunday", start_time: "09:00:00", end_time: "10:30:00" },
  { id: 2, subject_id: 1, day_of_week: "tuesday", start_time: "09:00:00", end_time: "10:30:00" },
  { id: 3, subject_id: 1, day_of_week: "thursday", start_time: "09:00:00", end_time: "10:30:00" },
  { id: 4, subject_id: 2, day_of_week: "monday", start_time: "11:00:00", end_time: "12:30:00" },
  { id: 5, subject_id: 2, day_of_week: "wednesday", start_time: "11:00:00", end_time: "12:30:00" },
  { id: 6, subject_id: 3, day_of_week: "saturday", start_time: "14:00:00", end_time: "15:30:00" },
  { id: 7, subject_id: 3, day_of_week: "monday", start_time: "14:00:00", end_time: "15:30:00" },
  { id: 8, subject_id: 3, day_of_week: "wednesday", start_time: "14:00:00", end_time: "15:30:00" }
];

const mockEnrollments = [
  { id: 1, student_id: 1, subject_id: 1 },
  { id: 2, student_id: 2, subject_id: 1 },
  { id: 3, student_id: 3, subject_id: 1 },
  { id: 4, student_id: 6, subject_id: 1 },
  { id: 5, student_id: 8, subject_id: 1 },
  
  { id: 6, student_id: 1, subject_id: 2 },
  { id: 7, student_id: 4, subject_id: 2 },
  { id: 8, student_id: 5, subject_id: 2 },
  { id: 9, student_id: 6, subject_id: 2 },
  
  { id: 10, student_id: 3, subject_id: 3 },
  { id: 11, student_id: 4, subject_id: 3 },
  { id: 12, student_id: 7, subject_id: 3 },
  { id: 13, student_id: 8, subject_id: 3 }
];

// In-Memory Attendance Logs Cache to preserve records during Netlify dev session
let mockAttendanceLogs = [
  // Subject 1 history (High attendance)
  { id: 1, student_id: 1, subject_id: 1, teacher_id: 1, attendance_date: "2026-07-01", status: "present" },
  { id: 2, student_id: 2, subject_id: 1, teacher_id: 1, attendance_date: "2026-07-01", status: "present" },
  { id: 3, student_id: 3, subject_id: 1, teacher_id: 1, attendance_date: "2026-07-01", status: "present" },
  { id: 4, student_id: 6, subject_id: 1, teacher_id: 1, attendance_date: "2026-07-01", status: "absent" },
  { id: 5, student_id: 8, subject_id: 1, teacher_id: 1, attendance_date: "2026-07-01", status: "present" },
  
  { id: 6, student_id: 1, subject_id: 1, teacher_id: 1, attendance_date: "2026-07-02", status: "present" },
  { id: 7, student_id: 2, subject_id: 1, teacher_id: 1, attendance_date: "2026-07-02", status: "present" },
  { id: 8, student_id: 3, subject_id: 1, teacher_id: 1, attendance_date: "2026-07-02", status: "present" },
  { id: 9, student_id: 6, subject_id: 1, teacher_id: 1, attendance_date: "2026-07-02", status: "present" },
  { id: 10, student_id: 8, subject_id: 1, teacher_id: 1, attendance_date: "2026-07-02", status: "present" },

  // Subject 2 history (Lower attendance, triggering dashboard alert)
  { id: 11, student_id: 1, subject_id: 2, teacher_id: 1, attendance_date: "2026-07-01", status: "absent" },
  { id: 12, student_id: 4, subject_id: 2, teacher_id: 1, attendance_date: "2026-07-01", status: "absent" },
  { id: 13, student_id: 5, subject_id: 2, teacher_id: 1, attendance_date: "2026-07-01", status: "present" },
  { id: 14, student_id: 6, subject_id: 2, teacher_id: 1, attendance_date: "2026-07-01", status: "absent" },

  { id: 15, student_id: 1, subject_id: 2, teacher_id: 1, attendance_date: "2026-07-03", status: "present" },
  { id: 16, student_id: 4, subject_id: 2, teacher_id: 1, attendance_date: "2026-07-03", status: "absent" },
  { id: 17, student_id: 5, subject_id: 2, teacher_id: 1, attendance_date: "2026-07-03", status: "absent" },
  { id: 18, student_id: 6, subject_id: 2, teacher_id: 1, attendance_date: "2026-07-03", status: "present" }
];

// Helper to check DB Connection and query database or fallback
async function executeQuery(queryText, params = []) {
  if (process.env.DATABASE_URL) {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false } // NeonDB SSL requirement
    });
    await client.connect();
    try {
      const res = await client.query(queryText, params);
      return res.rows;
    } finally {
      await client.end();
    }
  } else {
    // Virtual Mock Query Processor (Handles basic SELECT and UPSERT simulation)
    return simulateMockQuery(queryText, params);
  }
}

function simulateMockQuery(queryText, params) {
  const query = queryText.toLowerCase().trim();

  // 1. SELECT teachers WHERE email = $1
  if (query.includes('from teachers') && query.includes('email =')) {
    const email = params[0];
    const teacher = mockTeachers.find(t => t.email === email);
    return teacher ? [teacher] : [];
  }

  // 2. SELECT subjects WHERE teacher_id = $1
  if (query.includes('from subjects') && query.includes('teacher_id =')) {
    const teacherId = parseInt(params[0]);
    return mockSubjects.filter(s => s.teacher_id === teacherId);
  }

  // 3. SELECT subject_schedule WHERE subject_id = $1
  if (query.includes('from subject_schedule') && query.includes('subject_id =')) {
    const subjectId = parseInt(params[0]);
    return mockSubjectSchedule.filter(s => s.subject_id === subjectId);
  }

  // 4. SELECT students enrolled in a subject
  // Matches query for students via enrollments and subject_id
  if (query.includes('enrollments') && query.includes('students') && query.includes('subject_id =')) {
    const subjectId = parseInt(params[0]);
    const enrolledStudentIds = mockEnrollments
      .filter(e => e.subject_id === subjectId)
      .map(e => e.student_id);
    return mockStudents.filter(s => enrolledStudentIds.includes(s.id));
  }

  // 5. SELECT attendance logs for a teacher or subject
  if (query.includes('from attendance_logs')) {
    if (query.includes('teacher_id =') && query.includes('subject_id =') && query.includes('attendance_date =')) {
      const teacherId = parseInt(params[0]);
      const subjectId = parseInt(params[1]);
      const date = params[2];
      return mockAttendanceLogs.filter(l => l.teacher_id === teacherId && l.subject_id === subjectId && l.attendance_date === date);
    }
    if (query.includes('teacher_id =')) {
      const teacherId = parseInt(params[0]);
      return mockAttendanceLogs.filter(l => l.teacher_id === teacherId);
    }
  }

  // 6. UPSERT attendance log
  if (query.includes('insert into attendance_logs')) {
    const studentId = parseInt(params[0]);
    const subjectId = parseInt(params[1]);
    const teacherId = parseInt(params[2]);
    const date = params[3];
    const status = params[4];

    // Find and update if exists (UPSERT simulation)
    const existingIndex = mockAttendanceLogs.findIndex(l => 
      l.student_id === studentId && 
      l.subject_id === subjectId && 
      l.attendance_date === date
    );

    if (existingIndex > -1) {
      mockAttendanceLogs[existingIndex].status = status;
      return [mockAttendanceLogs[existingIndex]];
    } else {
      const newLog = {
        id: mockAttendanceLogs.length + 1,
        student_id: studentId,
        subject_id: subjectId,
        teacher_id: teacherId,
        attendance_date: date,
        status: status
      };
      mockAttendanceLogs.push(newLog);
      return [newLog];
    }
  }

  // Default fallback empty list
  return [];
}

module.exports = {
  executeQuery,
  mockTeachers,
  mockStudents,
  mockSubjects,
  mockEnrollments,
  mockAttendanceLogs
};
