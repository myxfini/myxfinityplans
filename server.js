require("dotenv").config();

const express = require("express");

const app = express();

const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

const REDIRECT_URL = process.env.REDIRECT_URL || "https://example.com";
const TURNSTILE_SITE_KEY = process.env.TURNSTILE_SITE_KEY || "";
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || "";

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verification</title>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>

  <style>
    *{
      box-sizing:border-box;
      margin:0;
      padding:0;
    }

    :root{
      --bg:#0b0b0f;
      --card:rgba(255,255,255,0.04);
      --border:rgba(255,255,255,0.08);
      --text:rgba(255,255,255,0.92);
      --muted:rgba(255,255,255,0.65);
    }

    html,body{
      height:100%;
    }

    body{
      min-height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
      background:var(--bg);
      color:var(--text);
      overflow:hidden;
      position:relative;
      padding:20px;
    }

    body::before{
      content:"";
      position:absolute;
      width:900px;
      height:900px;
      background:radial-gradient(circle,rgba(37,99,235,0.22),transparent 60%);
      filter:blur(120px);
      top:-200px;
      left:-200px;
      pointer-events:none;
    }

    body::after{
      content:"";
      position:absolute;
      width:700px;
      height:700px;
      background:radial-gradient(circle,rgba(147,51,234,0.20),transparent 60%);
      filter:blur(120px);
      bottom:-200px;
      right:-200px;
      pointer-events:none;
    }

    .card{
      position:relative;
      z-index:1;
      width:min(92vw,420px);
      padding:32px;
      border-radius:20px;
      background:var(--card);
      border:1px solid var(--border);
      backdrop-filter:blur(20px);
      -webkit-backdrop-filter:blur(20px);
      box-shadow:0 20px 80px rgba(0,0,0,0.6);
      text-align:center;
    }

    .eyebrow{
      font-size:12px;
      letter-spacing:0.14em;
      text-transform:uppercase;
      color:var(--muted);
      margin-bottom:14px;
    }

    h1{
      font-size:26px;
      margin-bottom:8px;
      letter-spacing:-0.02em;
      font-weight:600;
    }

    p{
      color:var(--muted);
      margin-bottom:24px;
      font-size:14px;
      line-height:1.6;
    }

    .widget-wrap{
      display:flex;
      justify-content:center;
      align-items:center;
      min-height:70px;
    }

    .status{
      margin-top:18px;
      min-height:22px;
      display:flex;
      align-items:center;
      justify-content:center;
      gap:10px;
      font-size:13px;
      color:rgba(255,255,255,0.68);
    }

    .status-text{
      display:inline-flex;
      align-items:center;
    }

    .dots::after{
      content:"";
      display:inline-block;
      width:1.2em;
      text-align:left;
      animation:dots 1.2s infinite;
    }

    .verifying-spinner{
      width:16px;
      height:16px;
      border-radius:50%;
      border:2px solid rgba(255,255,255,0.18);
      border-top-color:rgba(255,255,255,0.95);
      animation:spin 0.8s linear infinite;
      display:none;
      flex:0 0 auto;
    }

    .progress{
      margin-top:14px;
      width:100%;
      height:6px;
      border-radius:999px;
      overflow:hidden;
      background:rgba(255,255,255,0.08);
      border:1px solid rgba(255,255,255,0.05);
      display:none;
    }

    .progress-bar{
      width:35%;
      height:100%;
      border-radius:999px;
      background:linear-gradient(90deg,#2563eb,#7c3aed);
      animation:slide 1s ease-in-out infinite;
    }

    .status.verifying .verifying-spinner{
      display:inline-block;
    }

    .status.verifying + .progress{
      display:block;
    }

    .error{
      margin-top:18px;
      padding:12px 14px;
      border-radius:12px;
      background:rgba(255,59,48,0.08);
      border:1px solid rgba(255,59,48,0.18);
      color:rgba(255,255,255,0.88);
      font-size:13px;
      line-height:1.5;
      text-align:left;
    }

    @keyframes spin{
      to{ transform:rotate(360deg); }
    }

    @keyframes dots{
      0%{ content:""; }
      25%{ content:"."; }
      50%{ content:".."; }
      75%{ content:"..."; }
      100%{ content:""; }
    }

    @keyframes slide{
      0%{ transform:translateX(-140%); }
      100%{ transform:translateX(320%); }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="eyebrow">Security Check</div>
    <h1>Verification required</h1>
    <p>Please complete the verification below to continue.</p>

    ${
      !TURNSTILE_SITE_KEY || !TURNSTILE_SECRET_KEY
        ? `<div class="error">Missing TURNSTILE_SITE_KEY or TURNSTILE_SECRET_KEY in environment variables.</div>`
        : `
    <div class="widget-wrap">
      <div
        class="cf-turnstile"
        data-sitekey="${TURNSTILE_SITE_KEY}"
        data-theme="dark"
        data-callback="onTurnstileSuccess"
        data-error-callback="onTurnstileError"
        data-expired-callback="onTurnstileExpired">
      </div>
    </div>

    <div class="status" id="status">
      <span class="verifying-spinner" id="spinner"></span>
      <span class="status-text" id="statusText">Waiting for verification<span class="dots"></span></span>
    </div>

    <div class="progress" id="progress">
      <div class="progress-bar"></div>
    </div>`
    }
  </div>

  <script>
    const statusEl = document.getElementById("status");
    const statusText = document.getElementById("statusText");

    async function onTurnstileSuccess(token){
      if (!statusEl || !statusText) return;

      statusEl.classList.add("verifying");
      statusText.textContent = "Verifying";

      try{
        const res = await fetch("/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ token })
        });

        const data = await res.json();

        if(data.success){
          statusText.textContent = "Verified. Redirecting";
          window.location.replace(${JSON.stringify(REDIRECT_URL)});
        }else{
          statusEl.classList.remove("verifying");
          statusText.textContent = "Verification failed. Refresh page.";
        }
      }catch(err){
        statusEl.classList.remove("verifying");
        statusText.textContent = "Network error. Refresh page.";
      }
    }

    function onTurnstileError(){
      if (!statusEl || !statusText) return;
      statusEl.classList.remove("verifying");
      statusText.textContent = "Verification error. Refresh page.";
    }

    function onTurnstileExpired(){
      if (!statusEl || !statusText) return;
      statusEl.classList.remove("verifying");
      statusText.textContent = "Verification expired. Try again.";
    }
  </script>
</body>
</html>`);
});

app.post("/verify", async (req, res) => {
  try {
    const token = req.body.token;

    if (!TURNSTILE_SECRET_KEY || !TURNSTILE_SITE_KEY) {
      return res.json({ success: false, error: "missing_keys" });
    }

    if (!token) {
      return res.json({ success: false, error: "missing_token" });
    }

    const params = new URLSearchParams();
    params.append("secret", TURNSTILE_SECRET_KEY);
    params.append("response", token);

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
      }
    );

    const data = await response.json();

    return res.json({ success: !!data.success });
  } catch (error) {
    console.error("Verification error:", error);
    return res.json({ success: false, error: "server_error" });
  }
});

app.listen(PORT, HOST, () => {
  console.log("Server running on http://" + HOST + ":" + PORT);
});
