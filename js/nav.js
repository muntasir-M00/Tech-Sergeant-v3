/**
 * TechSarge Navigation v2
 * -------------------------------------------------------
 * - Injects popup side nav into all pages (no need to define it in HTML).
 * - Highlights active link in top nav and side nav.
 * - Hides Admin Panel link unless authenticated.
 * - Toast helper.
 */
(function () {
  const PAGES = {
    home: "index.html",
    ai: "ai.html",
    videos: "videos.html",
    osdownload: "osdownload.html",
    repair: "repair.html",
    admin: "admin.html",
  };

  const NAV_LINKS = [
    { key: "home", icon: "home", label: "Home" },
    { key: "ai", icon: "memory", label: "Diagnostics" },
    { key: "videos", icon: "play_circle", label: "Video Library" },
    { key: "osdownload", icon: "download", label: "OS Center" },
    { key: "repair", icon: "handyman", label: "Repair Store" },
  ];

  function currentPage() {
    const path = window.location.pathname.split("/").pop() || "index.html";
    if (!path || path === "/") return "home";
    const found = Object.entries(PAGES).find(([, file]) => file === path);
    return found ? found[0] : "home";
  }

  function isAdmin() {
    return typeof Auth !== "undefined" && Auth.isAuthenticated();
  }

  function injectLoginModal() {
    if (document.getElementById("ts-login-backdrop")) return;
    const backdrop = document.createElement("div");
    backdrop.id = "ts-login-backdrop";
    backdrop.className = "ts-modal-backdrop";
    backdrop.style.zIndex = "200";
    backdrop.innerHTML = `
      <div class="ts-login-card" style="position:relative">
        <button type="button" data-ts-login-close style="position:absolute;top:16px;right:16px;background:transparent;border:none;color:#71717a;cursor:pointer">
          <span class="material-symbols-outlined" style="font-size:20px">close</span>
        </button>
        <h3>Admin Access</h3>
        <p>This area is restricted to TechSarge administrators only.</p>
        <label for="ts-login-user">Username / Email</label>
        <input type="text" id="ts-login-user" class="ts-form-input" placeholder="Enter username or email" autocomplete="username" />
        <label for="ts-login-pw" style="margin-top:12px">Password</label>
        <input type="password" id="ts-login-pw" class="ts-form-input" placeholder="Enter admin password" autocomplete="current-password" />
        <p id="ts-login-err" class="ts-login-error">Incorrect credentials. Please try again.</p>
        <button id="ts-login-submit-btn" class="ts-sidenav-login-btn">Authenticate</button>
        <p class="ts-login-hint">Default: admin / techsarge2026</p>
      </div>
    `;
    document.body.appendChild(backdrop);

    backdrop.querySelector('[data-ts-login-close]')?.addEventListener("click", () => {
      backdrop.classList.remove("show");
    });
    document.getElementById("ts-login-submit-btn")?.addEventListener("click", performSidenavLogin);
    document.getElementById("ts-login-pw")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") performSidenavLogin();
    });
    document.getElementById("ts-login-user")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") document.getElementById("ts-login-pw")?.focus();
    });
  }

  function openLoginModal() {
    const modal = document.getElementById("ts-login-backdrop");
    if (!modal) return;
    modal.classList.add("show");
    document.getElementById("ts-login-user")?.focus();
  }

  function injectSideNav() {
    const existing = document.getElementById("ts-sidenav");
    if (existing) existing.remove();
    const backdrop = document.createElement("div");
    backdrop.className = "ts-sidenav-backdrop";
    backdrop.id = "ts-sidenav-backdrop";
    document.body.appendChild(backdrop);

    const aside = document.createElement("aside");
    aside.id = "ts-sidenav";
    aside.className = "ts-sidenav";

    const links = [...NAV_LINKS];
    if (isAdmin()) {
      links.push({ key: "admin", icon: "shield_person", label: "Admin Panel" });
    }

    const page = currentPage();
    aside.innerHTML = `
      <div class="ts-sidenav-header">
        <div class="flex items-center gap-3">
          <div class="relative flex items-center justify-center w-9 h-9 bg-white/5 rounded-lg border border-white/10">
            <span class="text-xl font-black tracking-tighter monogram-t">T</span>
            <span class="text-xl font-black tracking-tighter monogram-s" style="margin-left:-3px">S<div class="monogram-glow"></div></span>
          </div>
          <span class="text-sm font-bold text-white tracking-tight">TechSarge</span>
        </div>
        <button class="ts-sidenav-close" id="ts-sidenav-close">
          <span class="material-symbols-outlined" style="font-size:18px">close</span>
        </button>
      </div>
      <nav id="ts-sidenav-nav" class="flex-1 py-2">
        ${links.map((l) => `
          <a href="${l.action === "login" ? "#" : PAGES[l.key]}" class="ts-sidenav-link${page === l.key ? " ts-active-nav" : ""}" ${l.action ? `data-action="${l.action}"` : ""}>
            <span class="material-symbols-outlined" style="font-size:20px">${l.icon}</span>
            ${l.label}
          </a>
        `).join("")}
      </nav>
      ${isAdmin() ? `
      <div class="px-4 pb-6 border-t border-white/6 pt-4">
        <button id="ts-sidenav-logout" class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-zinc-400 hover:text-red-400 hover:bg-red-400/5 transition-all">
          <span class="material-symbols-outlined" style="font-size:18px">logout</span>
          Log Out
        </button>
      </div>
      ` : `
      <div class="px-4 pb-6 border-t border-white/6 pt-4">
        <button id="ts-sidenav-admin-button" class="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest border border-cyan-400/40 text-cyan-400 rounded-lg hover:bg-cyan-400/10 transition-all" title="Admin Login">
          <span class="material-symbols-outlined" style="font-size:16px">lock</span>
          Admin
        </button>
      </div>
      `}
    `;
    document.body.appendChild(aside);

    document.getElementById("ts-sidenav-close")
      .addEventListener("click", closeSideNav);
    backdrop.addEventListener("click", closeSideNav);

    if (isAdmin()) {
      const logoutBtn = document.getElementById("ts-sidenav-logout");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
          Auth.logout();
          window.location.href = "index.html";
        });
      }
    } else {
      const adminButton = document.getElementById("ts-sidenav-admin-button");
      if (adminButton) {
        adminButton.addEventListener("click", (event) => {
          event.preventDefault();
          closeSideNav();
          openLoginModal();
        });
      }
    }
  }

  function performSidenavLogin() {
    const user = document.getElementById("ts-login-user")?.value || "";
    const pw = document.getElementById("ts-login-pw")?.value || "";
    const errorEl = document.getElementById("ts-login-err");
    if (Auth.login(user, pw)) {
      closeSideNav();
      document.getElementById("ts-login-backdrop")?.classList.remove("show");
      window.location.href = "admin.html";
      return;
    }
    if (errorEl) {
      errorEl.classList.add("show");
    }
  }

  function openSideNav() {
    document.getElementById("ts-sidenav")?.classList.add("open");
    document.getElementById("ts-sidenav-backdrop")?.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeSideNav() {
    document.getElementById("ts-sidenav")?.classList.remove("open");
    document.getElementById("ts-sidenav-backdrop")?.classList.remove("open");
    document.body.style.overflow = "";
  }

  function wireTopNav() {
    const page = currentPage();
    document.querySelectorAll("[data-nav]").forEach((el) => {
      const target = el.getAttribute("data-nav");
      if (PAGES[target]) el.setAttribute("href", PAGES[target]);
      const isActive = target === page;
      el.classList.toggle("ts-active-nav", isActive);
    });

    document.querySelectorAll("[data-nav-style='top']").forEach((el) => {
      const target = el.getAttribute("data-nav");
      const isActive = target === page;
      el.classList.remove("text-zinc-400", "text-cyan-400", "border-b-2", "border-cyan-400", "font-bold", "ts-topnav-link");
      el.classList.add("ts-topnav-link");
      if (isActive) el.classList.add("ts-active-nav");
    });

    const toggle = document.getElementById("ts-menu-toggle");
    if (toggle) toggle.addEventListener("click", openSideNav);
  }

  function activate() {
    injectLoginModal();
    injectSideNav();
    wireTopNav();
  }

  window.tsToast = function (message, type) {
    let el = document.querySelector(".ts-toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "ts-toast";
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.toggle("error", type === "error");
    requestAnimationFrame(() => el.classList.add("show"));
    clearTimeout(window.__tsToastTimer);
    window.__tsToastTimer = setTimeout(() => el.classList.remove("show"), 2500);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", activate);
  } else {
    activate();
  }
})();
