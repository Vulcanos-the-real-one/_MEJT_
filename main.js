/* MEJT — shared site behaviour (nav, particles, status, reveals) */
(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- footer year ---------- */
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- mobile nav ---------- */
  const navToggle = document.querySelector(".nav-toggle");
  const mobileMenu = document.querySelector(".mobile-menu");
  if (navToggle && mobileMenu) {
    navToggle.addEventListener("click", () => {
      const open = mobileMenu.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    });
    mobileMenu.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        mobileMenu.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      })
    );
  }

  /* ---------- mark active nav link ---------- */
  const here = location.pathname.replace(/\/index\.html$/, "/").split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a, .mobile-menu a").forEach((a) => {
    const target = a.getAttribute("href");
    if (target && target !== "#" && (target === here || (here === "" && target === "index.html"))) {
      a.classList.add("active");
    }
  });

  /* ---------- copy server IP ---------- */
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const value = btn.getAttribute("data-copy");
      try {
        await navigator.clipboard.writeText(value);
      } catch (e) {
        const ta = document.createElement("textarea");
        ta.value = value;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      const original = btn.textContent;
      btn.textContent = "Copied!";
      btn.classList.add("copied");
      setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove("copied");
      }, 1800);
    });
  });

  /* ---------- scroll reveal (one orchestrated fade-up per section) ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    if (reducedMotion || !("IntersectionObserver" in window)) {
      revealEls.forEach((el) => el.classList.add("in"));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("in");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      revealEls.forEach((el) => io.observe(el));
    }
  }

  /* ---------- live server status (mcsrvstat.us public API) ---------- */
  const statusEl = document.querySelector("[data-server-status]");
  if (statusEl) {
    const dot = statusEl.querySelector(".status-dot");
    const label = statusEl.querySelector("[data-status-label]");
    const host = statusEl.getAttribute("data-server-status");

    fetch(`https://api.mcsrvstat.us/3/${host}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.online) {
          dot.classList.add("online");
          const count = data.players && typeof data.players.online === "number" ? data.players.online : null;
          label.textContent = count !== null ? `Online — ${count} playing now` : "Server is online";
        } else {
          dot.classList.add("offline");
          label.textContent = "Server is offline right now";
        }
      })
      .catch(() => {
        label.textContent = "Status unavailable";
      });
  }

  /* ---------- lightweight ember particle field ---------- */
  const canvas = document.getElementById("particles");
  if (canvas && !reducedMotion) {
    const ctx = canvas.getContext("2d");
    const colors = ["#fd00f3", "#04abf1", "#ffd700", "#ff7a1a", "#2abe65"];
    let particles = [];
    let w, h, dpr;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn() {
      const count = Math.min(46, Math.floor((w * h) / 26000));
      particles = Array.from({ length: count }, () => makeParticle());
    }

    function makeParticle() {
      return {
        x: Math.random() * w,
        y: h + Math.random() * h * 0.4,
        r: Math.random() * 2 + 0.6,
        speed: Math.random() * 0.5 + 0.15,
        drift: (Math.random() - 0.5) * 0.4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.5 + 0.25,
        twinkle: Math.random() * Math.PI * 2,
      };
    }

    function tick() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.y -= p.speed;
        p.x += p.drift;
        p.twinkle += 0.02;
        if (p.y < -10) Object.assign(p, makeParticle(), { y: h + 10 });
        const a = p.alpha * (0.6 + 0.4 * Math.sin(p.twinkle));
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = a;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      requestAnimationFrame(tick);
    }

    resize();
    spawn();
    tick();
    window.addEventListener("resize", () => {
      resize();
      spawn();
    });
  }
})();
