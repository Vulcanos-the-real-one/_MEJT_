import { db, DISCORD_WEBHOOK_URL, isConfigured } from "./firebase-init.js";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const form = document.getElementById("redeem-form");
const codeInput = document.getElementById("code-input");
const nameInput = document.getElementById("name-input");
const msgEl = document.getElementById("redeem-msg");
const resultEl = document.getElementById("redeem-result");
const submitBtn = document.getElementById("redeem-submit");
const setupNotice = document.getElementById("setup-notice");

if (!isConfigured && setupNotice) {
  setupNotice.hidden = false;
}

function setMessage(text, kind) {
  msgEl.textContent = text;
  msgEl.className = "redeem-msg" + (kind ? ` ${kind}` : "");
}

function shakeInput() {
  codeInput.classList.remove("shake");
  // force reflow so the animation can re-trigger on repeated errors
  void codeInput.offsetWidth;
  codeInput.classList.add("shake");
}

function showResult(tier, note) {
  resultEl.className = `redeem-result show ${tier.toLowerCase()}`;
  resultEl.innerHTML = `
    <div class="tier-name">${tier} unlocked 🎉</div>
    <p>${note}</p>
  `;
  launchConfetti(tier.toLowerCase() === "mvp" ? ["#ffd700", "#ff7a1a"] : ["#04abf1", "#2abe65"]);
}

async function notifyDiscord(tier, code, username) {
  if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL.startsWith("YOUR_")) return;
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: "🎟️ Code redeemed",
            color: tier === "MVP" ? 16766720 : 305393,
            fields: [
              { name: "Tier", value: tier, inline: true },
              { name: "Minecraft name", value: username, inline: true },
              { name: "Code", value: `\`${code}\``, inline: false },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
  } catch (err) {
    // Notification failing should never block the player's redemption.
    console.warn("Discord notification failed:", err);
  }
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const code = codeInput.value.trim().toUpperCase().replace(/\s+/g, "");
  const username = nameInput.value.trim();

  if (!code) {
    setMessage("Enter a code first.", "error");
    shakeInput();
    return;
  }
  if (!username) {
    setMessage("Your Minecraft username is needed so we know who to grant the rank to.", "error");
    return;
  }
  if (!isConfigured) {
    setMessage("The redeem system isn't connected yet — ask the server admin.", "info");
    return;
  }

  submitBtn.disabled = true;
  setMessage("Checking code…", "info");
  resultEl.classList.remove("show");

  try {
    const ref = doc(db, "codes", code);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      setMessage("That code doesn't exist. Double-check for typos.", "error");
      shakeInput();
      return;
    }

    const data = snap.data();
    const maxUses = data.maxUses ?? 1;
    const uses = data.uses ?? 0;
    const expired = data.expiresAt && data.expiresAt.toDate && data.expiresAt.toDate() < new Date();

    if (uses >= maxUses) {
      setMessage("This code has already been redeemed.", "error");
      shakeInput();
      return;
    }
    if (expired) {
      setMessage("This code has expired.", "error");
      shakeInput();
      return;
    }

    await updateDoc(ref, {
      uses: uses + 1,
      redeemed: uses + 1 >= maxUses,
      redeemedAt: serverTimestamp(),
      redeemedBy: username,
    });

    setMessage("", null);
    showResult(
      data.tier,
      `Nice one, ${username} — your ${data.tier} rank has been recorded and will be applied in-game shortly.`
    );
    form.reset();
    notifyDiscord(data.tier, code, username);
  } catch (err) {
    console.error(err);
    setMessage("Something went wrong on our end. Try again in a moment.", "error");
  } finally {
    submitBtn.disabled = false;
  }
});

/* ---------- confetti burst ---------- */
function launchConfetti(colors) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) return;

  const layer = document.getElementById("confetti-layer");
  if (!layer) return;

  const count = 60;
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("span");
    const size = Math.random() * 8 + 5;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const startX = window.innerWidth / 2 + (Math.random() - 0.5) * 120;
    const drift = (Math.random() - 0.5) * 500;
    const rise = Math.random() * 200 + 220;
    const rotate = Math.random() * 720 - 360;
    const duration = Math.random() * 900 + 1100;

    piece.style.cssText = `
      position:absolute; left:${startX}px; top:60%;
      width:${size}px; height:${size * 0.5}px; background:${color};
      border-radius:2px; opacity:1;
      transform: translate(0,0) rotate(0deg);
      transition: transform ${duration}ms cubic-bezier(.15,.7,.3,1), opacity ${duration}ms ease;
    `;
    layer.appendChild(piece);

    requestAnimationFrame(() => {
      piece.style.transform = `translate(${drift}px, ${-rise}px) rotate(${rotate}deg)`;
      piece.style.opacity = "0";
    });

    setTimeout(() => piece.remove(), duration + 100);
  }
}
