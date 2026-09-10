js
// PE Revision — AI marking proxy
// Receives {model, max_tokens, system, messages} from a tutor page,
// calls Anthropic using the server-side key, and returns the response.

exports.handler = async function (event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: "Method not allowed" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: "Server is missing ANTHROPIC_API_KEY" };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, headers, body: "Invalid JSON in request" };
  }

  const model = payload.model || "claude-sonnet-4-5";
  const max_tokens = payload.max_tokens || 1000;
  const system = payload.system || undefined;
  const messages = payload.messages || [];

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model, max_tokens, system, messages }),
    });

    const text = await res.text();

    if (!res.ok) {
      return { statusCode: res.status, headers, body: text };
    }
    return { statusCode: 200, headers, body: text };
  } catch (err) {
    return { statusCode: 502, headers, body: "Upstream error: " + err.message };
  }
};
