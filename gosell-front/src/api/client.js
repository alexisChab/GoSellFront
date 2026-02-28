// src/api/client.js

// Sinon mets "http://localhost:5000"
const API = ""; // <- recommandé avec proxy

function getCookie(name) {
    const m = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]*)"));
    return m ? decodeURIComponent(m[2]) : "";
}

function getCsrfToken() {
    return getCookie("csrf_access_token") || "";
}

export async function apiRequest(path, options = {}) {
    const method = (options.method || "GET").toUpperCase();
    const csrf = getCsrfToken();

    const headers = {
        ...(options.headers || {}),
    };

    // Body auto JSON
    let body = options.body;
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    const isBlob = typeof Blob !== "undefined" && body instanceof Blob;

    if (body != null && typeof body === "object" && !isFormData && !isBlob) {
        body = JSON.stringify(body);
        if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";
    } else if (typeof body === "string") {
        if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";
    }

    // ✅ Tu veux CSRF même sur GET
    if (csrf) headers["X-CSRF-TOKEN"] = csrf;

    const res = await fetch(`${API}${path}`, {
        ...options,
        method,
        headers,
        body,
        credentials: "include",
    });

    // 204
    if (res.status === 204) return null;

    const ct = res.headers.get("content-type") || "";
    const payload = ct.includes("application/json") ? await res.json() : await res.text();

    if (!res.ok) {
        const msg =
            typeof payload === "string"
                ? payload
                : payload?.error?.message || payload?.message || `Request failed (${res.status})`;

        const err = new Error(msg);
        err.status = res.status;
        err.payload = payload;
        throw err;
    }

    return payload;
}