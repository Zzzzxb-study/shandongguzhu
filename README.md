# 山东雇主责任险报价工具

山东省（不含青岛地区）雇主责任保险（2026）静态报价工具。

## 在线地址

https://shandong-guzhu-quote-2026.netlify.app

## 本地使用

直接用浏览器打开 `index.html`。

## 部署说明

项目为纯前端静态页面，运行文件包括：

- `index.html`
- `style.css`
- `rates.js`
- `calculator.js`
- `app.js`

Netlify 发布目录为本地生成目录 `netlify-publish/`，不纳入 Git 管理。
## 邮箱验证码配置

Netlify 环境变量需要配置：

- `AUTH_SECRET`：验证码签名密钥，至少 24 位字符。
- `RESEND_API_KEY`：Resend 发信 API Key。
- `EMAIL_FROM`：发信邮箱，例如 `报价工具 <noreply@example.com>`。
- `EMAIL_SUBJECT`：邮件标题，可选。
- `AUTH_ALLOWED_DOMAINS`：允许登录的邮箱域名，可选，多个域名用英文逗号分隔，例如 `example.com,company.com`。
- `AUTH_SESSION_HOURS`：登录有效小时数，可选，默认 12 小时。

验证码有效期为 10 分钟。项目使用 Netlify Functions 发送和校验验证码。