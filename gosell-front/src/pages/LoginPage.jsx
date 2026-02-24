import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    async function onSubmit(e) {
        e.preventDefault();
        setError("");
        setSubmitting(true);
        try {
            await login(email.trim(), password);
            navigate("/app", { replace: true });
        } catch (err) {
            setError(err.message || "Identifiants invalides");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div style={{ maxWidth: 420, margin: "60px auto", padding: 16 }}>
            <h1>GoSell</h1>
            <p>Connecte-toi pour accéder à ton espace.</p>

            <form onSubmit={onSubmit}>
                <label>Email</label>
                <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    autoComplete="email"
                    required
                    style={{ width: "100%", padding: 10, margin: "6px 0 14px" }}
                />

                <label>Mot de passe</label>
                <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    autoComplete="current-password"
                    required
                    style={{ width: "100%", padding: 10, margin: "6px 0 14px" }}
                />

                {error && (
                    <div style={{ marginBottom: 12, color: "crimson" }}>
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    style={{ width: "100%", padding: 10 }}
                >
                    {submitting ? "Connexion..." : "Se connecter"}
                </button>
            </form>
        </div>
    );
}