exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const { reference, amountInCents, currency } = JSON.parse(event.body);
    const integrityKey = process.env.WOMPI_INTEGRITY_KEY;

    const crypto = require("crypto");
    const signature = crypto
      .createHash("sha256")
      .update(`${reference}${amountInCents}${currency}${integrityKey}`)
      .digest("hex");

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ signature })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Error generando firma" })
    };
  }
};
