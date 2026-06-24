const crypto = require("crypto");
const {
  CODE_TTL_MS,
  hashCode,
  isAllowedEmail,
  isEmail,
  json,
  normalizeEmail,
  signPayload,
} = require("./auth-utils");

async function sendEmail(email, code) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error("Email service is not configured");
  }

  const subject = process.env.EMAIL_SUBJECT || "山东雇主责任险报价工具验证码";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject,
      text: `您的验证码是 ${code}，10 分钟内有效。若非本人操作，请忽略本邮件。`,
      html: `<p>您的验证码是 <strong style="font-size:20px">${code}</strong>，10 分钟内有效。</p><p>若非本人操作，请忽略本邮件。</p>`,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Email provider rejected request: ${detail}`);
  }
}

exports.handler = async function handler(event) {
  if (event.httpMethod === "OPTIONS") return json(200, { ok: true });
  if (event.httpMethod !== "POST") return json(405, { error: "METHOD_NOT_ALLOWED" });

  try {
    const body = JSON.parse(event.body || "{}");
    const email = normalizeEmail(body.email);
    if (!isEmail(email)) return json(400, { error: "请输入有效邮箱" });
    if (!isAllowedEmail(email)) return json(403, { error: "该邮箱不在允许范围内" });

    const code = String(crypto.randomInt(100000, 1000000));
    const expiresAt = Date.now() + CODE_TTL_MS;
    const challenge = signPayload({ email, codeHash: hashCode(email, code), expiresAt });

    await sendEmail(email, code);

    return json(200, { challenge, expiresAt, expiresInSeconds: Math.floor(CODE_TTL_MS / 1000) });
  } catch (error) {
    console.error(error);
    return json(500, { error: "验证码发送失败，请检查邮件服务配置" });
  }
};