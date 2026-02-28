import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client";
import "../styles/ProductsPage.css";

function eur(v) {
    if (v === null || v === undefined) return "—";
    const n = Number(v);
    if (Number.isNaN(n)) return "—";
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

function Badge({ children, tone = "neutral" }) {
    return <span className={`pBadge pBadge--${tone}`}>{children}</span>;
}

function statusBadges(p) {
    const out = [];

    if (p.est_vendu) out.push(<Badge key="sold" tone="ok">Vendu</Badge>);
    else if (p.en_vente) out.push(<Badge key="sale" tone="info">En vente</Badge>);
    else out.push(<Badge key="draft" tone="neutral">Brouillon</Badge>);

    if (p.a_ete_achete) out.push(<Badge key="bought" tone="neutral">Acheté</Badge>);
    else out.push(<Badge key="free" tone="neutral">Gratuit</Badge>);

    return out;
}

function toNumberOrNull(v) {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

export default function ProductsPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // --- Filtres ---
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // ✅ pliés par défaut
    const [filtersOpen, setFiltersOpen] = useState(false);

    const [enVente, setEnVente] = useState("");       // "" | "true" | "false"
    const [estVendu, setEstVendu] = useState("");     // "" | "true" | "false"
    const [aEteAchete, setAEteAchete] = useState(""); // "" | "true" | "false"

    const [prixAchatMin, setPrixAchatMin] = useState("");
    const [prixAchatMax, setPrixAchatMax] = useState("");
    const [prixVenteMin, setPrixVenteMin] = useState("");
    const [prixVenteMax, setPrixVenteMax] = useState("");
    const [prixMinEspereMin, setPrixMinEspereMin] = useState("");
    const [prixMinEspereMax, setPrixMinEspereMax] = useState("");
    const [prixMaxEspereMin, setPrixMaxEspereMin] = useState("");
    const [prixMaxEspereMax, setPrixMaxEspereMax] = useState("");

    const [dateFrom, setDateFrom] = useState(""); // yyyy-mm-dd
    const [dateTo, setDateTo] = useState("");     // yyyy-mm-dd

    // --- Tri / pagination ---
    const [orderBy, setOrderBy] = useState("date_mise_en_vente");
    const [orderDir, setOrderDir] = useState("desc");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    // debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
        return () => clearTimeout(t);
    }, [search]);

    function buildQuery() {
        const qs = new URLSearchParams();

        if (debouncedSearch) qs.set("search", debouncedSearch);

        if (enVente !== "") qs.set("en_vente", enVente);
        if (estVendu !== "") qs.set("est_vendu", estVendu);
        if (aEteAchete !== "") qs.set("a_ete_achete", aEteAchete);

        const mapNum = [
            ["prix_achat_min", prixAchatMin],
            ["prix_achat_max", prixAchatMax],
            ["prix_vente_min", prixVenteMin],
            ["prix_vente_max", prixVenteMax],
            ["prix_min_espere_min", prixMinEspereMin],
            ["prix_min_espere_max", prixMinEspereMax],
            ["prix_max_espere_min", prixMaxEspereMin],
            ["prix_max_espere_max", prixMaxEspereMax],
        ];
        for (const [k, v] of mapNum) {
            const n = toNumberOrNull(v);
            if (n !== null) qs.set(k, String(n));
        }

        if (dateFrom) qs.set("date_mise_en_vente_from", dateFrom);
        if (dateTo) qs.set("date_mise_en_vente_to", dateTo);

        qs.set("order_by", orderBy);
        qs.set("order_dir", orderDir);

        qs.set("page", String(page));
        qs.set("page_size", String(pageSize));

        return qs;
    }

    async function load() {
        setLoading(true);
        setErr("");
        try {
            const qs = buildQuery();
            const data = await apiRequest(`/api/products?${qs.toString()}`);
            setItems(Array.isArray(data) ? data : []);
        } catch (e) {
            setErr(e?.message || "Erreur chargement produits");
            setItems([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        debouncedSearch,
        enVente, estVendu, aEteAchete,
        prixAchatMin, prixAchatMax,
        prixVenteMin, prixVenteMax,
        prixMinEspereMin, prixMinEspereMax,
        prixMaxEspereMin, prixMaxEspereMax,
        dateFrom, dateTo,
        orderBy, orderDir,
        page, pageSize,
    ]);

    useEffect(() => { setPage(1); }, [
        debouncedSearch,
        enVente, estVendu, aEteAchete,
        prixAchatMin, prixAchatMax,
        prixVenteMin, prixVenteMax,
        prixMinEspereMin, prixMinEspereMax,
        prixMaxEspereMin, prixMaxEspereMax,
        dateFrom, dateTo,
        orderBy, orderDir,
        pageSize,
    ]);

    const countLabel = useMemo(() => {
        if (loading) return "…";
        return `${items.length} produit(s)`;
    }, [items.length, loading]);

    const hasPrev = page > 1;
    const hasNext = !loading && items.length === pageSize;

    function resetAll() {
        setSearch("");
        setDebouncedSearch("");

        setEnVente("");
        setEstVendu("");
        setAEteAchete("");

        setPrixAchatMin("");
        setPrixAchatMax("");
        setPrixVenteMin("");
        setPrixVenteMax("");
        setPrixMinEspereMin("");
        setPrixMinEspereMax("");
        setPrixMaxEspereMin("");
        setPrixMaxEspereMax("");

        setDateFrom("");
        setDateTo("");

        setOrderBy("date_mise_en_vente");
        setOrderDir("desc");
        setPageSize(20);
        setPage(1);
    }

    // ✅ juste pour afficher un compteur de filtres actifs
    const activeFiltersCount = useMemo(() => {
        let n = 0;
        if (debouncedSearch) n += 1;
        if (enVente !== "") n += 1;
        if (estVendu !== "") n += 1;
        if (aEteAchete !== "") n += 1;
        if (dateFrom) n += 1;
        if (dateTo) n += 1;

        const nums = [
            prixAchatMin, prixAchatMax,
            prixVenteMin, prixVenteMax,
            prixMinEspereMin, prixMinEspereMax,
            prixMaxEspereMin, prixMaxEspereMax,
        ];
        for (const v of nums) if (toNumberOrNull(v) !== null) n += 1;

        return n;
    }, [
        debouncedSearch,
        enVente, estVendu, aEteAchete,
        dateFrom, dateTo,
        prixAchatMin, prixAchatMax,
        prixVenteMin, prixVenteMax,
        prixMinEspereMin, prixMinEspereMax,
        prixMaxEspereMin, prixMaxEspereMax,
    ]);

    return (
        <div className="pWrap">
            <div className="pHeader">
                <div>
                    <h1 className="pTitle">Produits</h1>
                    <p className="pSubtitle">Liste + recherche + filtres + tri</p>
                </div>

                <div className="pHeaderRight">
                    <div className="pCount">{countLabel}</div>
                </div>
            </div>

            <div className="cardLike pControls">
                <input
                    className="pSearch"
                    placeholder="Rechercher par nom…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <select className="pSelect" value={orderBy} onChange={(e) => setOrderBy(e.target.value)}>
                    <option value="date_mise_en_vente">Tri: Date</option>
                    <option value="nom">Tri: Nom</option>
                    <option value="prix_achat">Tri: Prix achat</option>
                    <option value="prix_vente">Tri: Prix vente</option>
                </select>

                <select className="pSelect" value={orderDir} onChange={(e) => setOrderDir(e.target.value)}>
                    <option value="desc">Desc</option>
                    <option value="asc">Asc</option>
                </select>

                <select className="pSelect" value={String(pageSize)} onChange={(e) => setPageSize(Number(e.target.value))}>
                    <option value="10">10 / page</option>
                    <option value="20">20 / page</option>
                    <option value="50">50 / page</option>
                    <option value="100">100 / page</option>
                </select>

                {/* ✅ bouton toggle filtres */}
                <button
                    className="pBtn pBtn--ghost"
                    type="button"
                    onClick={() => setFiltersOpen((v) => !v)}
                >
                    {filtersOpen ? "Masquer filtres" : "Afficher filtres"}
                    {activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ""}
                </button>

                <button className="pBtn pBtn--ghost" type="button" onClick={resetAll}>
                    Reset
                </button>
            </div>

            {/* ✅ bloc filtres pliable */}
            {filtersOpen && (
                <div className="cardLike pFilters">
                    <div className="pFiltersGrid">
                        <div className="pField">
                            <div className="pLabel">En vente</div>
                            <select className="pSelect" value={enVente} onChange={(e) => setEnVente(e.target.value)}>
                                <option value="">Tous</option>
                                <option value="true">Oui</option>
                                <option value="false">Non</option>
                            </select>
                        </div>

                        <div className="pField">
                            <div className="pLabel">Vendu</div>
                            <select className="pSelect" value={estVendu} onChange={(e) => setEstVendu(e.target.value)}>
                                <option value="">Tous</option>
                                <option value="true">Oui</option>
                                <option value="false">Non</option>
                            </select>
                        </div>

                        <div className="pField">
                            <div className="pLabel">Acheté</div>
                            <select className="pSelect" value={aEteAchete} onChange={(e) => setAEteAchete(e.target.value)}>
                                <option value="">Tous</option>
                                <option value="true">Oui</option>
                                <option value="false">Non</option>
                            </select>
                        </div>

                        <div className="pField">
                            <div className="pLabel">Date (from)</div>
                            <input className="pInput" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                        </div>

                        <div className="pField">
                            <div className="pLabel">Date (to)</div>
                            <input className="pInput" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                        </div>
                    </div>

                    <div className="pRanges">
                        <div className="pRangeBlock">
                            <div className="pRangeTitle">Prix achat</div>
                            <div className="pRangeRow">
                                <input className="pInput" type="number" step="0.01" placeholder="min"
                                       value={prixAchatMin} onChange={(e) => setPrixAchatMin(e.target.value)} />
                                <input className="pInput" type="number" step="0.01" placeholder="max"
                                       value={prixAchatMax} onChange={(e) => setPrixAchatMax(e.target.value)} />
                            </div>
                        </div>

                        <div className="pRangeBlock">
                            <div className="pRangeTitle">Prix vente</div>
                            <div className="pRangeRow">
                                <input className="pInput" type="number" step="0.01" placeholder="min"
                                       value={prixVenteMin} onChange={(e) => setPrixVenteMin(e.target.value)} />
                                <input className="pInput" type="number" step="0.01" placeholder="max"
                                       value={prixVenteMax} onChange={(e) => setPrixVenteMax(e.target.value)} />
                            </div>
                        </div>

                        <div className="pRangeBlock">
                            <div className="pRangeTitle">Prix min espéré</div>
                            <div className="pRangeRow">
                                <input className="pInput" type="number" step="0.01" placeholder="min"
                                       value={prixMinEspereMin} onChange={(e) => setPrixMinEspereMin(e.target.value)} />
                                <input className="pInput" type="number" step="0.01" placeholder="max"
                                       value={prixMinEspereMax} onChange={(e) => setPrixMinEspereMax(e.target.value)} />
                            </div>
                        </div>

                        <div className="pRangeBlock">
                            <div className="pRangeTitle">Prix max espéré</div>
                            <div className="pRangeRow">
                                <input className="pInput" type="number" step="0.01" placeholder="min"
                                       value={prixMaxEspereMin} onChange={(e) => setPrixMaxEspereMin(e.target.value)} />
                                <input className="pInput" type="number" step="0.01" placeholder="max"
                                       value={prixMaxEspereMax} onChange={(e) => setPrixMaxEspereMax(e.target.value)} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="pPager">
                <button className="pBtn" type="button" disabled={!hasPrev || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    ← Précédent
                </button>
                <div className="pPageNum">Page {page}</div>
                <button className="pBtn" type="button" disabled={!hasNext || loading} onClick={() => setPage((p) => p + 1)}>
                    Suivant →
                </button>
            </div>

            {loading && <div className="cardLike">Chargement…</div>}
            {err && <div className="cardLike cardErr">{err}</div>}

            {!loading && !err && items.length === 0 && (
                <div className="cardLike">
                    <div className="emptyTitle">Aucun produit</div>
                    <div className="emptyText">Essaie d’enlever des filtres ou change le tri.</div>
                </div>
            )}

            {!loading && !err && items.length > 0 && (
                <div className="pGrid">
                    {items.map((p) => (
                        <div className="pCard" key={p.id}>
                            <div className="pCardTop">
                                <div className="pName">{p.nom}</div>
                                <div className="pBadges">{statusBadges(p)}</div>
                            </div>

                            {p.description ? (
                                <div className="pDesc">{p.description}</div>
                            ) : (
                                <div className="pDesc pDesc--muted">Aucune description</div>
                            )}

                            <div className="pMeta">
                                <div className="pMetaRow"><span className="k">Achat</span><span className="v">{eur(p.prix_achat)}</span></div>
                                <div className="pMetaRow"><span className="k">Vente</span><span className="v">{eur(p.prix_vente)}</span></div>
                                <div className="pMetaRow"><span className="k">Min espéré</span><span className="v">{eur(p.prix_min_espere)}</span></div>
                                <div className="pMetaRow"><span className="k">Max espéré</span><span className="v">{eur(p.prix_max_espere)}</span></div>
                                <div className="pMetaRow"><span className="k">Date</span><span className="v">{p.date_mise_en_vente || "—"}</span></div>
                            </div>

                            <div className="pFooter">
                                <span className="pId">#{p.id}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}