/**
 * TechSarge Auth Layer
 * -------------------------------------------------------
 * Username + password gate stored in localStorage.
 * Session persists as sessionStorage flag so closing the
 * browser/tab automatically logs out.
 */
(function () {
  const SESSION_KEY = "techsarge:session";
  const AUTH_PREFIX = "techsarge:v2:auth";

  function getCredentials() {
    try {
      const raw = localStorage.getItem(AUTH_PREFIX);
      if (raw) {
        const arr = JSON.parse(raw);
        if (arr && arr[0]) return arr[0];
      }
    } catch (_) {}
    return { username: "admin", password: "techsarge2026" };
  }

  function login(usernameOrEmail, pw) {
    const creds = getCredentials();
    const storedUser = (creds.username || "admin").toLowerCase();
    const storedEmail = (creds.email || "").toLowerCase();
    const inputUser = (usernameOrEmail || "").trim().toLowerCase();
    const passwordMatch = pw === (creds.password || "techsarge2026");
    const userMatch = inputUser === storedUser || (storedEmail && inputUser === storedEmail);
    if (userMatch && passwordMatch) {
      sessionStorage.setItem(SESSION_KEY, "1");
      return true;
    }
    return false;
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  function isAuthenticated() {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  }

  function changePassword(newPw) {
    const creds = getCredentials();
    const arr = [{ ...creds, id: "auth_main", password: newPw }];
    localStorage.setItem(AUTH_PREFIX, JSON.stringify(arr));
  }

  function changeUsername(newUsername, newEmail) {
    const creds = getCredentials();
    const arr = [{ ...creds, id: "auth_main", username: newUsername, email: newEmail || "" }];
    localStorage.setItem(AUTH_PREFIX, JSON.stringify(arr));
  }

  function getUsername() {
    return getCredentials().username || "admin";
  }

  function requireAuth() {
    if (!isAuthenticated()) {
      window.location.href = "index.html";
      return false;
    }
    return true;
  }

  window.Auth = { login, logout, isAuthenticated, requireAuth, changePassword, changeUsername, getUsername };
})();
