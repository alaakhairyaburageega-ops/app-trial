// Netlify Serverless Function: get-students
// Returns a list of mock students for Phase 1 Staging

exports.handler = async function(event, context) {
  // CORS Headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  // 8 Mock students representing different groups and levels
  const students = [
    { id: 1, full_name: "أحمد محمد العتيبي", class_group: "Group A - Level 1", is_active: true },
    { id: 2, full_name: "خالد عبد الرحمن السديري", class_group: "Group A - Level 1", is_active: true },
    { id: 3, full_name: "سارة فهد بن دخيل", class_group: "Group B - Level 1", is_active: true },
    { id: 4, full_name: "فاطمة علي الحربي", class_group: "Group B - Level 1", is_active: true },
    { id: 5, full_name: "عبد الله عمر القحطاني", class_group: "Group A - Level 2", is_active: true },
    { id: 6, full_name: "ريما صالح اليوسف", class_group: "Group B - Level 2", is_active: true },
    { id: 7, full_name: "محمد سليمان الدوسري", class_group: "Group A - Level 3", is_active: true },
    { id: 8, full_name: "نورة فيصل المطيري", class_group: "Group B - Level 3", is_active: true }
  ];

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(students)
  };
};
