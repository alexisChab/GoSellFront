import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../api/client";
import "../styles/ProductDetailPage.css";

function toNumOrNull(s) {
    if (s === "" || s === null || s === undefined) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
}

export default function ProductDetailPage() {
    const { id } = useParams();
    const productId = Number(id);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");
    const [savedMsg, setSavedMsg] = useState("");

    const [original, setOriginal] = useState(null);

    // form fields
    const [nom, setNom] = useState("");
    const [description, setDescription] = useState("");

    const [enVente, setEnVente] = useState(false);
    const [estVendu, setEstVendu] = useState(false);
    const [aEteAchete, setAEteAchete] = useState(false);

    const [prixAchat, setPrixAchat] = useState("");
    const [prixVente, setPrixVente] = useState("");
    const [prixMinEspere, setPrixMinEspere] = useState("");
    const [prixMaxEspere, setPrixMaxEspere] = useState("");

    const [dateMiseEnVente, setDateMiseEnVente] = useState(""); // yyyy-mm-dd

    async function fetchProduct() {
        setLoading(true);
        setErr("");
        setSavedMsg("");
        try {
            const p = await apiRequest(`/api/products/${productId}`);
            setOriginal(p);

            setNom(p.nom ?? "");
            setDescription(p.description ?? "");

            const sold = Boolean(p.est_vendu);
            const onSale = Boolean(p.en_vente);

            // ✅ si vendu => en_vente doit être false
            setEstVendu(sold);
            setEnVente(sold ? false : onSale);

            setAEteAchete(Boolean(p.a_ete_achete));

            setPrixAchat(p.prix_achat ?? "");
            setPrixVente(p.prix_vente ?? "");
            setPrixMinEspere(p.prix_min_espere ?? "");
            setPrixMaxEspere(p.prix_max_espere ?? "");

            setDateMiseEnVente(p.date_mise_en_vente ?? "");
        } catch (e) {
            setErr(e?.message || "Erreur chargement produit");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!Number.isFinite(productId)) {
            setErr("ID produit invalide");
            setLoading(false);
            return;
        }
        fetchProduct();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId]);

    // ✅ règle métier live : si l’utilisateur coche "Vendu", on force En vente = false
    useEffect(() => {
        if (estVendu) {
            setEnVente(false);
        }
    }, [estVendu]);

    const patchPayload = useMemo(() => {
        if (!original) return null;

        // IMPORTANT: si vendu => en_vente false (double sécurité)
        const next = {
            nom: nom.trim(),
            description: description === "" ? null : description,

            est_vendu: Boolean(estVendu),
            en_vente: Boolean(estVendu) ? false : Boolean(enVente),
            a_ete_achete: Boolean(aEteAchete),

            prix_achat: toNumOrNull(prixAchat),
            prix_vente: toNumOrNull(prixVente),
            prix_min_espere: toNumOrNull(prixMinEspere),
            prix_max_espere: toNumOrNull(prixMaxEspere),

            date_mise_en_vente: dateMiseEnVente === "" ? null : dateMiseEnVente,
        };

        // PATCH: n’envoyer que les champs modifiés
        const changed = {};
        for (const k of Object.keys(next)) {
            const prev = original[k] ?? null;
            const curr = next[k] ?? null;
            if (curr !== prev) changed[k] = next[k];
        }
        return changed;
    }, [
        original,
        nom,
        description,
        enVente,
        estVendu,
        aEteAchete,
        prixAchat,
        prixVente,
        prixMinEspere,
        prixMaxEspere,
        dateMiseEnVente,
    ]);

    const canSave =
        Boolean(original) &&
        patchPayload &&
        Object.keys(patchPayload).length > 0 &&
        !saving;

    async function onSave() {
        if (!canSave) return;

        setSaving(true);
        setErr("");
        setSavedMsg("");

        try {
            const updated = await apiRequest(`/api/products/${productId}`, {
                method: "PATCH",
                body: patchPayload,
            });

            // resync
            setOriginal(updated);

            setNom(updated.nom ?? "");
            setDescription(updated.description ?? "");

            const sold = Boolean(updated.est_vendu);
            setEstVendu(sold);
            setEnVente(sold ? false : Boolean(updated.en_vente));

            setAEteAchete(Boolean(updated.a_ete_achete));

            setPrixAchat(updated.prix_achat ?? "");
            setPrixVente(updated.prix_vente ?? "");
            setPrixMinEspere(updated.prix_min_espere ?? "");
            setPrixMaxEspere(updated.prix_max_espere ?? "");

            setDateMiseEnVente(updated.date_mise_en_vente ?? "");

            setSavedMsg("Modifications enregistrées.");
        } catch (e) {
            setErr(e?.message || "Erreur lors de la sauvegarde");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="dWrap">
            <div className="dHeader">
                <div>
                    <h1 className="dTitle">Produit #{id}</h1>
                    <p className="dSub">Afficher et modifier</p>
                </div>

                <div className="dHeaderActions">
                    <button className="btnGhost" type="button" onClick={() => navigate("/app/produits")}>
                        ← Retour
                    </button>

                    <button className="btnPrimary" type="button" disabled={!canSave} onClick={onSave}>
                        {saving ? "Sauvegarde…" : "Enregistrer"}
                    </button>
                </div>
            </div>

            {loading && <div className="card">Chargement…</div>}
            {err && <div className="card cardErr">{err}</div>}
            {savedMsg && <div className="card cardOk">{savedMsg}</div>}

            {!loading && !err && original && (
                <div className="grid2">
                    <div className="card">
                        <div className="sectionTitle">Infos</div>

                        <label className="field">
                            <div className="label">Nom</div>
                            <input className="input" value={nom} onChange={(e) => setNom(e.target.value)} />
                        </label>

                        <label className="field">
                            <div className="label">Description</div>
                            <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
                        </label>

                        <div className="row3">
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={enVente}
                                    onChange={(e) => setEnVente(e.target.checked)}
                                    disabled={estVendu} // ✅ si vendu, on empêche de remettre en vente
                                />
                                <span>En vente</span>
                            </label>

                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={estVendu}
                                    onChange={(e) => setEstVendu(e.target.checked)}
                                />
                                <span>Vendu</span>
                            </label>

                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={aEteAchete}
                                    onChange={(e) => setAEteAchete(e.target.checked)}
                                />
                                <span>Acheté</span>
                            </label>
                        </div>

                        {estVendu && (
                            <div className="hint">
                                Produit vendu → <b>En vente</b> est automatiquement désactivé.
                            </div>
                        )}

                        <label className="field">
                            <div className="label">Date mise en vente</div>
                            <input
                                className="input"
                                type="date"
                                value={dateMiseEnVente}
                                onChange={(e) => setDateMiseEnVente(e.target.value)}
                            />
                        </label>
                    </div>

                    <div className="card">
                        <div className="sectionTitle">Prix</div>

                        <div className="row2">
                            <label className="field">
                                <div className="label">Prix achat</div>
                                <input
                                    className="input"
                                    type="number"
                                    step="0.01"
                                    value={prixAchat}
                                    onChange={(e) => setPrixAchat(e.target.value)}
                                />
                            </label>

                            <label className="field">
                                <div className="label">Prix vente</div>
                                <input
                                    className="input"
                                    type="number"
                                    step="0.01"
                                    value={prixVente}
                                    onChange={(e) => setPrixVente(e.target.value)}
                                />
                            </label>
                        </div>

                        <div className="row2">
                            <label className="field">
                                <div className="label">Prix min espéré</div>
                                <input
                                    className="input"
                                    type="number"
                                    step="0.01"
                                    value={prixMinEspere}
                                    onChange={(e) => setPrixMinEspere(e.target.value)}
                                />
                            </label>

                            <label className="field">
                                <div className="label">Prix max espéré</div>
                                <input
                                    className="input"
                                    type="number"
                                    step="0.01"
                                    value={prixMaxEspere}
                                    onChange={(e) => setPrixMaxEspere(e.target.value)}
                                />
                            </label>
                        </div>

                        <div className="hint">
                            {canSave ? `Champs modifiés : ${Object.keys(patchPayload).length}` : "Aucune modification"}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}