import { useEffect, useMemo, useState } from "react";

const F = "'Outfit',sans-serif";
const FH = "'Libre Baskerville',serif";

function getLookupFromSearch(search = "") {
  const params = new URLSearchParams(search);
  return {
    reference: String(params.get("reference") || "").trim(),
    code: String(params.get("code") || "").trim(),
    q: String(params.get("q") || "").trim()
  };
}

function buildLookupQuery(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const params = new URLSearchParams();
  if (raw.toUpperCase().startsWith("CTR-")) {
    params.set("code", raw.toUpperCase());
  } else {
    params.set("reference", raw);
  }
  return params.toString();
}

function statusStyles(tone = "neutral") {
  if (tone === "success") {
    return {
      background: "rgba(22,163,74,.10)",
      border: "1px solid rgba(22,163,74,.18)",
      color: "#166534"
    };
  }

  if (tone === "warning") {
    return {
      background: "rgba(245,158,11,.10)",
      border: "1px solid rgba(245,158,11,.18)",
      color: "#92400E"
    };
  }

  if (tone === "danger") {
    return {
      background: "rgba(220,38,38,.08)",
      border: "1px solid rgba(220,38,38,.16)",
      color: "#991B1B"
    };
  }

  if (tone === "info") {
    return {
      background: "rgba(37,99,235,.10)",
      border: "1px solid rgba(37,99,235,.16)",
      color: "#1D4ED8"
    };
  }

  return {
    background: "rgba(15,23,42,.04)",
    border: "1px solid rgba(148,163,184,.16)",
    color: "#334155"
  };
}

export default function CertificateVerificationPage() {
  const responsiveCss = `
    @media (max-width: 900px) {
      .verify-main-grid {
        grid-template-columns: 1fr !important;
      }
    }

    @media (max-width: 768px) {
      .verify-topbar {
        flex-direction: column !important;
        align-items: flex-start !important;
      }

      .verify-primary-card,
      .verify-side-card {
        padding: 22px 18px !important;
        border-radius: 22px !important;
      }

      .verify-lookup-form,
      .verify-result-grid {
        grid-template-columns: 1fr !important;
      }
    }
  `;

  const initialLookup = useMemo(() => getLookupFromSearch(window.location.search), []);
  const [query, setQuery] = useState(initialLookup.reference || initialLookup.code || initialLookup.q || "");
  const [state, setState] = useState({
    loading: Boolean(initialLookup.reference || initialLookup.code || initialLookup.q),
    error: "",
    result: null
  });

  const fetchVerification = async (params) => {
    setState((current) => ({ ...current, loading: true, error: "" }));

    try {
      const response = await fetch(`/api/public-verify-certification?${params}`, {
        headers: {
          Accept: "application/json"
        }
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.detail || payload?.error || "No fue posible validar el certificado.");
      }

      setState({
        loading: false,
        error: "",
        result: payload
      });
    } catch (error) {
      setState({
        loading: false,
        error: error.message || "No fue posible validar el certificado.",
        result: null
      });
    }
  };

  useEffect(() => {
    const initialParams = new URLSearchParams();
    if (initialLookup.reference) initialParams.set("reference", initialLookup.reference);
    if (initialLookup.code) initialParams.set("code", initialLookup.code.toUpperCase());
    if (!initialLookup.reference && !initialLookup.code && initialLookup.q) {
      initialParams.set("q", initialLookup.q);
    }

    if (initialParams.toString()) {
      fetchVerification(initialParams.toString());
    }
  }, [initialLookup.code, initialLookup.q, initialLookup.reference]);

  const submitLookup = (event) => {
    event.preventDefault();
    const params = buildLookupQuery(query);
    if (!params) return;
    window.history.replaceState(null, "", `${window.location.pathname}?${params}`);
    fetchVerification(params);
  };

  const result = state.result;
  const status = result?.status || {
    label: "Consulta manual",
    tone: "neutral",
    description: "Ingresa la referencia del certificado o el código de validación."
  };
  const badgeStyle = statusStyles(status.tone);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 12% 18%, rgba(96,165,250,.22), transparent 28%), radial-gradient(circle at 88% 14%, rgba(59,130,246,.16), transparent 26%), linear-gradient(180deg, #EFF6FF 0%, #F8FBFF 50%, #F5F8FD 100%)",
        color: "#0B1D3A",
        fontFamily: F,
        padding: "56px 20px 72px"
      }}
    >
      <style>{responsiveCss}</style>
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        <div
          className="verify-topbar"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            marginBottom: 30,
            flexWrap: "wrap"
          }}
        >
          <a
            href="/"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              color: "#0B1D3A"
            }}
          >
            <img
              src="/logo192.png"
              alt="CONTARAE"
              style={{ width: 44, height: 44, borderRadius: 14, objectFit: "contain" }}
            />
            <div>
              <div style={{ fontFamily: FH, fontWeight: 700, fontSize: 24 }}>CONTARAE</div>
              <div style={{ fontSize: 11, letterSpacing: 1.8, color: "#5A6F8A" }}>
                VALIDACIÓN DE CERTIFICADOS
              </div>
            </div>
          </a>
          <a
            href="/certificacion"
            style={{
              textDecoration: "none",
              padding: "12px 18px",
              borderRadius: 999,
              background: "rgba(37,99,235,.10)",
              border: "1px solid rgba(37,99,235,.14)",
              color: "#1D4ED8",
              fontWeight: 700
            }}
          >
            Solicitar certificación
          </a>
        </div>

        <div
          className="verify-main-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.08fr) minmax(300px, .92fr)",
            gap: 22
          }}
        >
          <section
            className="verify-primary-card"
            style={{
              padding: 34,
              borderRadius: 28,
              background: "linear-gradient(180deg, rgba(255,255,255,.96), rgba(255,255,255,.92))",
              border: "1px solid rgba(37,99,235,.12)",
              boxShadow: "0 22px 54px rgba(15,23,42,.08)"
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                borderRadius: 999,
                background: "rgba(37,99,235,.06)",
                border: "1px solid rgba(37,99,235,.10)",
                color: "#2563EB",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1.5,
                marginBottom: 16
              }}
            >
              VALIDACIÓN PÚBLICA
            </div>

            <h1
              style={{
                fontFamily: FH,
                fontSize: "clamp(34px,4.2vw,54px)",
                lineHeight: 1.02,
                margin: "0 0 14px",
                textWrap: "balance"
              }}
            >
              Verifique la autenticidad de su certificado
            </h1>

            <p
              style={{
                margin: 0,
                fontSize: 17,
                lineHeight: 1.8,
                color: "#526983",
                maxWidth: 680
              }}
            >
              Consulte si el documento fue emitido por CONTARAE, confirme su estado y valide el código oficial
              asociado a la certificación.
            </p>

            <form
              className="verify-lookup-form"
              onSubmit={submitLookup}
              style={{
                marginTop: 24,
                display: "grid",
                gridTemplateColumns: "minmax(0,1fr) auto",
                gap: 12
              }}
            >
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ingrese referencia o código de validación"
                style={{
                  width: "100%",
                  padding: "15px 16px",
                  borderRadius: 16,
                  border: "1px solid rgba(148,163,184,.28)",
                  outline: "none",
                  fontSize: 15,
                  fontFamily: F,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,.6)"
                }}
              />
              <button
                type="submit"
                style={{
                  border: "none",
                  borderRadius: 16,
                  padding: "0 20px",
                  background: "linear-gradient(135deg, #1D4ED8, #38BDF8)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: "pointer",
                  fontFamily: F,
                  boxShadow: "0 14px 28px rgba(37,99,235,.20)"
                }}
              >
                Validar
              </button>
            </form>

            <div
              style={{
                marginTop: 24,
                padding: 20,
                borderRadius: 20,
                ...badgeStyle
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.4, marginBottom: 8 }}>
                ESTADO DE CONSULTA
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{status.label}</div>
              <div style={{ fontSize: 14, lineHeight: 1.75 }}>{status.description}</div>
              {state.loading && <div style={{ marginTop: 12, fontWeight: 700 }}>Consultando certificado...</div>}
              {state.error && (
                <div style={{ marginTop: 12, fontWeight: 700, color: "#B91C1C" }}>{state.error}</div>
              )}
            </div>

            {result?.found && result?.certificate && (
              <div
                style={{
                  marginTop: 20,
                  padding: 24,
                  borderRadius: 24,
                  background: "#F8FBFF",
                  border: "1px solid rgba(37,99,235,.10)"
                }}
              >
                <div
                  className="verify-result-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                    gap: 16
                  }}
                >
                  {[
                    ["Consecutivo", result.certificate.consecutive || "No asignado"],
                    ["Código de validación", result.certificate.verificationCode || ""],
                    ["Titular", result.certificate.holderName || ""],
                    ["Documento", result.certificate.holderDocument || ""],
                    ["Destino", result.certificate.destination || "No especificado"],
                    ["Período", result.certificate.period || "No especificado"],
                    ["Ingreso mensual", result.certificate.totalMonthlyIncome || ""],
                    ["Emitido el", result.certificate.issuedAt || "Aún no emitido"]
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        padding: "14px 16px",
                        borderRadius: 18,
                        background: "#fff",
                        border: "1px solid rgba(37,99,235,.10)"
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.3, color: "#2563EB", marginBottom: 6 }}>
                        {label.toUpperCase()}
                      </div>
                      <div style={{ fontSize: 14, lineHeight: 1.65, color: "#0B1D3A", fontWeight: 600 }}>{value}</div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: 16,
                    padding: 16,
                    borderRadius: 18,
                    background: "rgba(15,23,42,.03)",
                    border: "1px solid rgba(148,163,184,.14)"
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.3, color: "#475569", marginBottom: 8 }}>
                    HUELLA DIGITAL DEL DOCUMENTO
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      lineHeight: 1.8,
                      color: "#334155",
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                      wordBreak: "break-word"
                    }}
                  >
                    {result.certificate.hashDisplay || "Se registrará al emitir el certificado final."}
                  </div>
                </div>
              </div>
            )}
          </section>

          <aside
            className="verify-side-card"
            style={{
              padding: 28,
              borderRadius: 28,
              background: "linear-gradient(180deg, #0B1D3A, #112B50 70%, #173D74)",
              color: "#fff",
              border: "1px solid rgba(96,165,250,.14)",
              boxShadow: "0 22px 54px rgba(15,23,42,.18)"
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.6, color: "#93C5FD", marginBottom: 10 }}>
              CÓMO FUNCIONA
            </div>
            <h2
              style={{
                fontFamily: FH,
                fontSize: "clamp(30px,3vw,40px)",
                lineHeight: 1.05,
                margin: "0 0 16px"
              }}
            >
              Validación directa y trazable
            </h2>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.85, color: "rgba(226,232,240,.82)" }}>
              Cada certificado oficial emitido por CONTARAE incorpora un código único de validación y una ruta pública
              de consulta. Si el documento presenta alteraciones, la verificación oficial es la que prevalece.
            </p>

            <div style={{ display: "grid", gap: 14, marginTop: 22 }}>
              {[
                "Escanee el QR incluido en el PDF o ingrese la referencia manualmente.",
                "Verifique que el estado aparezca como vigente o emitido.",
                "Confirme que el código de validación coincida con el documento consultado."
              ].map((item, index) => (
                <div
                  key={item}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "40px 1fr",
                    gap: 12,
                    padding: 16,
                    borderRadius: 18,
                    background: "rgba(255,255,255,.06)",
                    border: "1px solid rgba(148,163,184,.10)"
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 14,
                      background: "rgba(96,165,250,.18)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800
                    }}
                  >
                    {index + 1}
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.75, color: "rgba(255,255,255,.86)" }}>{item}</div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 20,
                padding: 18,
                borderRadius: 18,
                background: "rgba(15,23,42,.30)",
                border: "1px solid rgba(96,165,250,.14)"
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.3, color: "#93C5FD", marginBottom: 8 }}>
                IMPORTANTE
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.75, color: "rgba(226,232,240,.82)" }}>
                La imagen de firma y el aspecto visual del PDF no sustituyen la consulta oficial. La validez debe
                confirmarse mediante el código y la página de verificación de CONTARAE.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
