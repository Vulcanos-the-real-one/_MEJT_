import { db, auth, isConfigured } from "./firebase-init.js";
import {
  doc,
  setDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L — easier to read aloud

const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const lockScreen = document.getElementById("admin-lock");
const dash = document.getElementById("admin-dash");
const signOutBtn = document.getElementById("sign-out");
const setupNotice = document.getElementById("admin-setup-notice");

const genForm = document.getElementById("generate-form");
const genList = document.getElementById("generated-list");
const tableBody = document.getElementById("codes-tbody");
const searchInput = document.getElementById("codes-search");
const emptyState = document.getElementById("codes-empty");

if (!isConfigured) {
  setupNotice.hidden = false;
  lockScreen.style.display = "none";
} else {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      lockScreen.classList.remove("show");
      lockScreen.style.display = "none";
      dash.classList.add("show");
      subscribeToCodes();
    } else {
      lockScreen.style.display = "block";
      dash.classList.remove("show");
    }
  });
}

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    loginError.textContent = "Login failed — check your email and password.";
  }
});

signOutBtn?.addEventListener("click", () => signOut(auth));

function randomCode(tier) {
  let body = "";
  for (let i = 0; i < 8; i++) {
    body += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    if (i === 3) body += "-";
  }
  return `${tier}-${body}`;
}

genForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const tier = document.getElementById("gen-tier").value;
  const quantity = Math.min(Math.max(parseInt(document.getElementById("gen-qty").value, 10) || 1, 1), 50);
  const expiryDays = parseInt(document.getElementById("gen-expiry").value, 10);
  const note = document.getElementById("gen-note").value.trim();
  const genBtn = document.getElementById("generate-submit");

  genBtn.disabled = true;
  genBtn.textContent = "Generating…";

  const created = [];
  try {
    for (let i = 0; i < quantity; i++) {
      const code = randomCode(tier);
      const expiresAt =
        Number.isFinite(expiryDays) && expiryDays > 0
          ? Timestamp.fromDate(new Date(Date.now() + expiryDays * 86400000))
          : null;

      await setDoc(doc(db, "codes", code), {
        tier,
        note: note || null,
        maxUses: 1,
        uses: 0,
        redeemed: false,
        createdAt: serverTimestamp(),
        expiresAt,
      });
      created.push(code);
    }

    genList.innerHTML = created
      .map((c) => `<div><span>${c}</span></div>`)
      .join("");
    genList.classList.add("show");
  } catch (err) {
    console.error(err);
    alert("Something went wrong generating codes — check the console.");
  } finally {
    genBtn.disabled = false;
    genBtn.textContent = "Generate codes";
  }
});

document.getElementById("copy-generated")?.addEventListener("click", () => {
  const codes = Array.from(genList.querySelectorAll("span")).map((s) => s.textContent);
  navigator.clipboard.writeText(codes.join("\n"));
});

let allCodes = [];

function subscribeToCodes() {
  const q = query(collection(db, "codes"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snap) => {
    allCodes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderTable();
  });
}

function renderTable() {
  const filter = (searchInput?.value || "").trim().toUpperCase();
  const rows = allCodes.filter(
    (c) => !filter || c.id.includes(filter) || (c.redeemedBy || "").toUpperCase().includes(filter)
  );

  emptyState.hidden = rows.length !== 0;

  tableBody.innerHTML = rows
    .map((c) => {
      const status = c.redeemed
        ? `<span class="tag redeemed">Redeemed</span>`
        : `<span class="tag active">Active</span>`;
      const tier = `<span class="tag ${c.tier?.toLowerCase()}">${c.tier}</span>`;
      const created = c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString() : "—";
      return `<tr>
        <td>${c.id}</td>
        <td>${tier}</td>
        <td>${status}</td>
        <td>${c.redeemedBy || "—"}</td>
        <td>${created}</td>
      </tr>`;
    })
    .join("");
}

searchInput?.addEventListener("input", renderTable);
