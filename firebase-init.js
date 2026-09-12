/* MEJT — Firebase bootstrap
   -------------------------------------------------------------------------
   1. Create a free Firebase project: https://console.firebase.google.com
   2. Add a "Web app" to it, then paste the config it gives you below.
   3. Enable Firestore (production mode) and Authentication → Email/Password.
   4. Paste the rules from /firestore.rules into Firestore → Rules.
   5. Create exactly one Auth user for yourself — that's your admin login.
   Full walkthrough: see README.md in this project.
   ------------------------------------------------------------------------- */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Discord webhook used to notify you when a code is redeemed.
// Server Settings → Integrations → Webhooks → New Webhook → Copy URL.
// Note: this URL lives in public front-end code, so anyone who digs it out
// of the page source could post junk messages to that channel (they can NOT
// forge a valid redemption, codes are still checked against Firestore).
// If that risk bothers you later, move this call behind a small serverless
// function (e.g. a Cloudflare Worker) — see README.md for pointers.
export const DISCORD_WEBHOOK_URL = "YOUR_DISCORD_WEBHOOK_URL";

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export const isConfigured = !firebaseConfig.apiKey.startsWith("YOUR_");
