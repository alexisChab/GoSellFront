import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";
import "../styles/DashboardPage.css";

function eur(v) {
    const n = Number(v ?? 0);
    if (Number.isNaN(n)) return "—";
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}
function num(v) {
    const n = Number(v ?? 0);
    if (Number.isNaN(n)) return "—";
    return new Intl.NumberFormat("fr-FR").format(n);
}

function Badge({ children, tone = "neutral" }) {
    return <span className={`badge badge--${tone}`}>{children}</span>;
}

function Stat({ label, value }) {
    return (
        <div className="stat">
            <div className="statLabel">{label}</div>
            <div className="statValue">{value}</div>
        </div>
    );
}

function riskTone(riskLevel) {
    switch (riskLevel) {
        case "HIGH":
        case "HIGH_RISK":
            return "danger";
        case "MEDIUM":
        case "MEDIUM_RISK":
            return "warn";
        case "LOW":
        case "LOW_MARGIN":
        default:
            return "info";
    }
}

function reasonLabel(reason) {
    switch (reason) {
        case "ZERO_COST":
            return "Coût d’achat manquant (0€)";
        case "MISSING_EXPECTED":
            return "Prix attendu manquant";
        case "LOW_MARGIN":
            return "Marge faible";
        default:
            return reason ?? "—";
    }
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            setErr("");
            try {
                const json = await apiRequest("/api/dashboard/summary");
                if (mounted) setData(json);
            } catch (e) {
                if (mounted) setErr(e.message || "Erreur dashboard");
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const hello = useMemo(() => {
        const fn = user?.first_name || user?.prenom || "";
        return fn ? `Bienvenue, ${fn}` : "Bienvenue";
    }, [user]);

    const counts = data?.counts ?? {};
    const benef = data?.benefices ?? {};
    const bCounts = benef?.counts ?? {};
    const bScope = benef?.scope ?? {};
    const totals = benef?.totals ?? {};

    const best = data?.best_types ?? {};
    const risk = data?.risk_products ?? {};
    const riskItems = Array.isArray(risk?.items) ? risk.items : [];

    return (
        <div className="dashWrap">
            <div className="dashHeader">
                <div>
                    <h1 className="dashTitle">Dashboard</h1>
                    <p className="dashSubtitle">{hello}</p>
                </div>
            </div>

            {loading && <div className="card">Chargement…</div>}
            {err && <div className="card cardError">{err}</div>}

            {!loading && !err && (
                <div className="grid">
                    {/* BENEFICES */}
                    <div className="card span2">
                        <div className="cardTop">
                            <div>
                                <div className="cardKicker">Bénéfices</div>
                                <div className="cardTitle">Résumé financier</div>
                            </div>
                            <div className="scopeBadges">
                                <Badge tone={bScope.include_products ? "ok" : "neutral"}>Produits</Badge>
                                <Badge tone={bScope.include_stocks ? "ok" : "neutral"}>Stocks</Badge>
                                <Badge tone={bScope.include_fees ? "ok" : "neutral"}>Frais</Badge>
                            </div>
                        </div>

                        <div className="heroRow">
                            <div className="hero">
                                <div className="heroLabel">Profit médian (attendu)</div>
                                <div className="heroValue">{eur(totals.profit_expected_median)}</div>
                                <div className="heroHint">
                                    {totals.is_profit_expected_median ? "Basé sur la médiane" : "Estimation"}
                                </div>
                            </div>

                            <div className="hero">
                                <div className="heroLabel">CA médian (attendu)</div>
                                <div className="heroValue">{eur(totals.revenue_expected_median)}</div>
                                <div className="heroHint">Potentiel de revente</div>
                            </div>

                            <div className="hero">
                                <div className="heroLabel">Coût total</div>
                                <div className="heroValue">{eur(totals.cost_total)}</div>
                                <div className="heroHint">Produits + stocks</div>
                            </div>
                        </div>

                        <div className="subGrid">
                            <div className="subCard">
                                <div className="subTitle">Détail coûts</div>
                                <Stat label="Coût produits" value={eur(totals.cost_products)} />
                                <Stat label="Coût stocks" value={eur(totals.cost_stocks)} />
                                <Stat label="Frais" value={eur(totals.fees)} />
                            </div>

                            <div className="subCard">
                                <div className="subTitle">Qualité des données</div>
                                <Stat label="Produits pris en compte" value={num(bCounts.nb_produits)} />
                                <Stat label="Ignorés (coût manquant)" value={num(bCounts.nb_produits_ignored_missing_cost)} />
                                <Stat label="Ignorés (prix attendu manquant)" value={num(bCounts.nb_produits_ignored_missing_expected)} />
                            </div>
                        </div>
                    </div>

                    {/* COUNTS */}
                    <div className="card">
                        <div className="cardTop">
                            <div>
                                <div className="cardKicker">Counts</div>
                                <div className="cardTitle">Inventaire</div>
                            </div>
                        </div>

                        <div className="pills">
                            <div className="pill">
                                <span className="pillLabel">Produits total</span>
                                <strong className="pillValue">{num(counts.nb_produits_total)}</strong>
                            </div>
                            <div className="pill">
                                <span className="pillLabel">En vente</span>
                                <strong className="pillValue">{num(counts.nb_produits_en_vente)}</strong>
                            </div>
                            <div className="pill">
                                <span className="pillLabel">Vendus</span>
                                <strong className="pillValue">{num(counts.nb_produits_vendus)}</strong>
                            </div>
                            <div className="pill">
                                <span className="pillLabel">Lots</span>
                                <strong className="pillValue">{num(counts.nb_lots)}</strong>
                            </div>
                            <div className="pill">
                                <span className="pillLabel">Stocks</span>
                                <strong className="pillValue">{num(counts.nb_stocks)}</strong>
                            </div>
                        </div>
                    </div>

                    {/* BEST TYPES */}
                    <div className="card">
                        <div className="cardTop">
                            <div>
                                <div className="cardKicker">Best types</div>
                                <div className="cardTitle">Top catégories</div>
                            </div>
                            <Badge tone="neutral">{num(best.count)} résultat(s)</Badge>
                        </div>

                        {Array.isArray(best.items) && best.items.length > 0 ? (
                            <div className="list">
                                {best.items.slice(0, 6).map((it, idx) => (
                                    <div className="listRow" key={idx}>
                                        <div className="listName">{it?.nom ?? it?.name ?? `Type ${idx + 1}`}</div>
                                        <Badge tone="ok">x{Number(it?.multiple ?? it?.avg_multiple ?? 0).toFixed(2)}</Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty">
                                <div className="emptyTitle">Aucun type</div>
                                <div className="emptyText">
                                    Aucun type ne correspond aux filtres actuels (min multiple {best?.filters?.min_multiple ?? "—"}).
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RISK PRODUCTS */}
                    <div className="card">
                        <div className="cardTop">
                            <div>
                                <div className="cardKicker">Risk products</div>
                                <div className="cardTitle">À vérifier</div>
                            </div>
                            <Badge tone="neutral">{num(risk.count)} produit(s)</Badge>
                        </div>

                        {riskItems.length === 0 ? (
                            <div className="empty">
                                <div className="emptyTitle">RAS</div>
                                <div className="emptyText">Aucun produit à risque selon les critères.</div>
                            </div>
                        ) : (
                            <div className="list">
                                {riskItems.slice(0, 6).map((p) => (
                                    <div className="riskRow" key={p.product_id}>
                                        <div className="riskLeft">
                                            <div className="riskName">{p.nom}</div>
                                            <div className="riskMeta">
                                                <span>{reasonLabel(p.reason)}</span>
                                                <span className="dot">•</span>
                                                <span>Coût: {eur(p.cost_total)}</span>
                                                <span className="dot">•</span>
                                                <span>Profit attendu: {eur(p.profit_amount)}</span>
                                            </div>
                                        </div>

                                        <div className="riskRight">
                                            <Badge tone={riskTone(p.risk_level)}>{p.risk_level}</Badge>
                                            <div className="riskSmall">
                                                {p.multiple != null ? `x${Number(p.multiple).toFixed(2)}` : "multiple —"}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}