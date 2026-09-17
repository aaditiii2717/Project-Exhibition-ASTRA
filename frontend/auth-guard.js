// Mission Control access guard. Runs synchronously in <head>, before the
// x-dc template mounts, so an unauthenticated visitor is redirected before
// any protected UI is ever painted. Also exposes window.ASTRA_AUTH for the
// Component to read (role-gated UI) and patches fetch() to attach the
// bearer token to same-origin /api requests.
(() => {
  "use strict";

  const STORAGE_KEY = "astraAuth";
  const LOGIN_PATH = "login.html";

  function readSession() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (!session || !session.token || !session.role || !session.expires_at) return null;
      if (session.expires_at * 1000 <= Date.now()) return null;
      return session;
    } catch (_) {
      return null;
    }
  }

  function redirectToLogin() {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    window.location.replace(LOGIN_PATH);
  }

  const session = readSession();
  if (!session) {
    redirectToLogin();
    return;
  }

  window.ASTRA_AUTH = session;

  window.astraLogout = function astraLogout() {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    window.location.replace(LOGIN_PATH);
  };

  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const url = typeof input === "string" ? input : input?.url || "";
    if (!url.startsWith("/api/") || url === "/api/auth/login") return nativeFetch(input, init);

    const headers = new Headers(init.headers || (typeof input !== "string" ? input.headers : undefined));
    headers.set("Authorization", `Bearer ${session.token}`);
    return nativeFetch(input, { ...init, headers }).then((response) => {
      if (response.status === 401) redirectToLogin();
      return response;
    });
  };
})();
