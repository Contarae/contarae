function toBase64(value) {
  return Buffer.from(value).toString("base64");
}

export async function sendResendEmail({
  apiKey,
  from,
  to,
  subject,
  html,
  text,
  replyTo,
  idempotencyKey,
  attachments = []
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {})
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      text,
      replyTo,
      attachments: attachments.map((attachment) => ({
        filename: attachment.filename,
        content: toBase64(attachment.content),
        type: attachment.type || "application/octet-stream",
        disposition: attachment.disposition || "attachment"
      }))
    })
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || "Resend no aceptó el envío");
  }

  return payload;
}
