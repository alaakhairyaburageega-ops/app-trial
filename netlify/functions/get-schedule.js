// Netlify Serverless Function: get-schedule
// Returns scheduled days of the week for a selected subject

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

    const { subject_id } = event.queryStringParameters || {};

    if (!subject_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "معرّف المادة (subject_id) مطلوب كحجة استعلام." })
      };
    }

    // Query subject schedule days
    const query = "SELECT id, subject_id, day_of_week, start_time, end_time FROM subject_schedule WHERE subject_id = $1";
    const schedule = await executeQuery(query, [parseInt(subject_id)]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(schedule)
    };

  } catch (error) {
    console.error("Get schedule endpoint failure:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "فشل استرجاع جدول المادة: " + error.message })
    };
  }
};
