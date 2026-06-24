const {
  authTtlMs,
  hashCode,
  isEmail,
  json,
  normalizeEmail,
  readSignedPayload,
  signPayload,
} = require("./auth-utils");

exports.handler = async function handler(event) {
  if (event.httpMethod === "OPTIONS") return json(200, { ok: true });
  if (event.httpMethod !== "POST") return json(405, { error: "METHOD_NOT_ALLOWED" });

  try {
    const body = JSON.parse(event.body || "{}");
    const email = normalizeEmail(body.email);
    const code = String(body.code || "").trim();
    const payload = readSignedPayload(body.challenge);

    if (!isEmail(email) || !/^\d{6}$/.test(code)) return json(400, { error: "邮箱或验证码格式不正确" });
    if (!payload || payload.email !== email || Date.now() > Number(payload.expiresAt)) {
      return json(400, { error: "验证码已失效，请重新获取" });
    }
    if (payload.codeHash !== hashCode(email, code)) return json(401, { error: "验证码不正确" });

    const expiresAt = Date.now() + authTtlMs();
    const token = signPayload({ email, expiresAt });
    return json(200, { token, email, expiresAt });
  } catch (error) {
    console.error(error);
    return json(500, { error: "验证码校验失败" });
  }
};