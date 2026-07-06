// Netlify Serverless Function: login
// Authenticates credentials, signs session JWT, and sets HttpOnly cookie

const { executeQuery } = require('./utils/db');
const { generateToken } = require('./utils/auth');
const bcrypt = require('bcryptjs');

exports.handler = async function(event, context) {
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
    const { email, password } = JSON.parse(event.body);

    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "يرجى إدخال البريد الإلكتروني وكلمة المرور." })
      };
    }

    // Query teacher by email
    const query = "SELECT id, full_name, email, password_hash FROM teachers WHERE email = $1";
    const teachers = await executeQuery(query, [email.trim().toLowerCase()]);

    if (teachers.length === 0) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة." })
      };
    }

    const teacher = teachers[0];

    // Password validation supporting both hashed values and local plain mock passwords
    const isMatch = teacher.password_hash.length === 60 
      ? bcrypt.compareSync(password, teacher.password_hash)
      : password === teacher.password_hash;

    if (!isMatch) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة." })
      };
    }

    // Create session token
    const token = generateToken({
      teacher_id: teacher.id,
      email: teacher.email,
      full_name: teacher.full_name
    });

    // Set cookie headers - Secure, HttpOnly, Lax
    // In local development, we exclude Secure to prevent localhost HTTPS requirements issues, or use standard configuration
    const isLocalhost = event.headers.host && event.headers.host.includes('localhost');
    const cookieHeader = `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400;${isLocalhost ? '' : ' Secure;'}`;

    return {
      statusCode: 200,
      headers: {
        ...headers,
        "Set-Cookie": cookieHeader
      },
      body: JSON.stringify({
        success: true,
        message: "تم تسجيل الدخول بنجاح.",
        teacher: {
          id: teacher.id,
          full_name: teacher.full_name,
          email: teacher.email
        }
      })
    };

  } catch (error) {
    console.error("Login endpoint failure:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "حدث خطأ أثناء معالجة الطلب: " + error.message })
    };
  }
};
