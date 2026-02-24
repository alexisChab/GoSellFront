const API = import.meta.env.VITE_API_URL;

export async function apiRequest(path, options = {}) {
    const res = await fetch(`${API}${path}`, {
        credentials: "include", // IMPORTANT pour cookies
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
        ...options,
    });

    // si pas JSON, on renvoie le texte
    const contentType = res.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
        ? await res.json()
        : await res.text();

    if (!res.ok) {
        const msg =
            typeof payload === "string"
                ? payload
                : payload?.error?.message || "Request failed";
        throw new Error(msg);
    }

    return payload;
}