import { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/HamburgerMenu.css";
export default function HamburgerMenu() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [open, setOpen] = useState(false);


    const links = useMemo(() => {
        if (!user) {
            return [
                { to: "/a-propos", label: "À propos" },
                { to: "/mentions-legales", label: "Mentions légales" },
            ];
        }

        return [
            { to: "/app", label: "Accueil" },
            { to: "/a-propos", label: "À propos" },
            { to: "/app/produits", label: "Produits" },
            { to: "/mentions-legales", label: "Mentions légales" },
        ];
    }, [user]);

    function close() {
        setOpen(false);
    }

    async function onLogout() {
        if (typeof logout === "function") {
            await logout();
        }
        close();
        navigate("/", { replace: true });
    }

    return (
        <>
            {/* Bouton topbar visible seulement quand le menu est fermé */}
            {!open && (
                <button
                    type="button"
                    className="topbar"
                    aria-label="Ouvrir le menu"
                    aria-expanded={open}
                    onClick={() => setOpen(true)}
                >
                    <span className="hamburgerLines" aria-hidden="true" />
                </button>
            )}

            {/* Overlay */}
            <div
                className={`menuOverlay ${open ? "open" : ""}`}
                onClick={close}
            />

            {/* Drawer */}
            <aside className={`drawer ${open ? "open" : ""}`} aria-hidden={!open}>
                <div className="drawerHeader">
                    <div className="drawerTitle">Menu</div>
                    <button
                        type="button"
                        className="drawerClose"
                        onClick={close}
                        aria-label="Fermer"
                    >
                        ✕
                    </button>
                </div>

                <nav className="drawerNav">
                    {links.map((l) => (
                        <NavLink
                            key={l.to}
                            to={l.to}
                            className={({ isActive }) =>
                                `drawerLink ${isActive ? "active" : ""}`
                            }
                            onClick={close}
                        >
                            {l.label}
                        </NavLink>
                    ))}

                    {user && (
                        <button type="button" className="drawerLink logout" onClick={onLogout}>
                            Se déconnecter
                        </button>
                    )}
                </nav>

                <div className="drawerFooter">
                    <div className="muted">{user ? "Connecté" : "Non connecté"}</div>
                </div>
            </aside>
        </>
    );
}