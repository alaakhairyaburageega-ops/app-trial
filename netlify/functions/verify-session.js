// Netlify Serverless Function: verify-session
// Validates JWT cookie and returns authenticated teacher profile details

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
        body: JSON.stringify({ error: "جلسة العمل غير صالحة أو منتهية. يرجى تسجيل الدخول." })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        authenticated: true,
        teacher: {
          id: decoded.teacher_id,
          email: decoded.email,
          full_name: decoded.full_name
        }
      })
    };
  } catch (error) {
    console.error("Session verification failure:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "فشل التحقق من الجلسة: " + error.message })
    };
  }
};
