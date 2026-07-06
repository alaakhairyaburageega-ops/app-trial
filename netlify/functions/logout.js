// Netlify Serverless Function: logout
// Securely clears the HttpOnly session token cookie

exports.handler = async function(event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  // Set the token cookie to expire in the past
  const cookieHeader = `token=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;

  return {
    statusCode: 200,
    headers: {
      ...headers,
      "Set-Cookie": cookieHeader
    },
    body: JSON.stringify({
      success: true,
      message: "تم تسجيل الخروج بنجاح."
    })
  };
};
