(function () {
  const STORAGE_KEY = "shandongGuzhuAuth.v1";
  const state = { challenge: "", countdownTimer: null, remainingSeconds: 0 };

  const authScreen = document.querySelector("#authScreen");
  const authForm = document.querySelector("#authForm");
  const emailInput = document.querySelector("#authEmail");
  const codeInput = document.querySelector("#authCode");
  const sendButton = document.querySelector("#sendCodeButton");
  const status = document.querySelector("#authStatus");
  const logoutButton = document.querySelector("#logoutButton");

  function setStatus(message, type) {
    status.textContent = message || "";
    status.dataset.type = type || "";
  }

  function getSession() {
    try {
      const session = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!session || !session.token || Date.now() > Number(session.expiresAt)) return null;
      return session;
    } catch (_error) {
      return null;
    }
  }

  function lock() {
    document.body.classList.add("auth-locked");
    authScreen.hidden = false;
    emailInput.focus();
  }

  function unlock(session) {
    document.body.classList.remove("auth-locked");
    authScreen.hidden = true;
    if (session && session.email) logoutButton.textContent = `退出登录（${session.email}）`;
  }

  function saveSession(session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    unlock(session);
  }

  function clearCountdown() {
    if (state.countdownTimer) window.clearInterval(state.countdownTimer);
    state.countdownTimer = null;
    state.remainingSeconds = 0;
    sendButton.disabled = false;
    sendButton.textContent = "获取验证码";
  }

  function startCountdown(seconds) {
    state.remainingSeconds = seconds;
    sendButton.disabled = true;
    sendButton.textContent = `${state.remainingSeconds}s 后重发`;
    state.countdownTimer = window.setInterval(() => {
      state.remainingSeconds -= 1;
      if (state.remainingSeconds <= 0) {
        clearCountdown();
        return;
      }
      sendButton.textContent = `${state.remainingSeconds}s 后重发`;
    }, 1000);
  }

  async function postJson(url, payload) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "请求失败");
    return data;
  }

  sendButton.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    if (!email) {
      setStatus("请先输入邮箱。", "error");
      return;
    }
    sendButton.disabled = true;
    setStatus("正在发送验证码...", "pending");
    try {
      const data = await postJson("/.netlify/functions/request-code", { email });
      state.challenge = data.challenge;
      codeInput.value = "";
      codeInput.focus();
      setStatus("验证码已发送，请在 10 分钟内输入。", "success");
      startCountdown(60);
    } catch (error) {
      clearCountdown();
      setStatus(error.message || "验证码发送失败。", "error");
    }
  });

  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = emailInput.value.trim();
    const code = codeInput.value.trim();
    if (!state.challenge) {
      setStatus("请先获取验证码。", "error");
      return;
    }
    setStatus("正在校验验证码...", "pending");
    try {
      const session = await postJson("/.netlify/functions/verify-code", { email, code, challenge: state.challenge });
      clearCountdown();
      setStatus("", "");
      saveSession(session);
    } catch (error) {
      setStatus(error.message || "验证码校验失败。", "error");
    }
  });

  logoutButton.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    state.challenge = "";
    clearCountdown();
    codeInput.value = "";
    lock();
  });

  const session = getSession();
  if (session) unlock(session);
  else lock();
})();