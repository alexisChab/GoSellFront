import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    async function loadMe() {
        try {
            const data = await apiRequest("/api/auth/me");
            setUser(data.user);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    async function login(email, password) {
        // backend: POST /api/auth/login renvoie { ok, user, csrf_* } + set cookies :contentReference[oaicite:2]{index=2}
        const data = await apiRequest("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });
        setUser(data.user);
        return data;
    }

    async function logout() {
        // Ton backend a /logout (access) et /logout_refresh (refresh) :contentReference[oaicite:3]{index=3}
        // On tente /logout, et s’il échoue (ex: access expiré), tu pourras ensuite appeler /refresh + /logout si tu veux.
        try {
            await apiRequest("/api/auth/logout", { method: "POST" });
        } catch {}
        setUser(null);
    }

    useEffect(() => {
        loadMe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, reload: loadMe }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}