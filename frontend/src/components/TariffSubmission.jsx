import React, { useState } from "react"

const API_BASE = "https://stanfliet-ota-api.onrender.com"

const defaultInputs = {
  rab: 48100000,
  depreciation: 1220000,
  returnOnAssets: 8.5,
  primaryEnergyCost: 12500000,
  oAndM_cost: 3400000,
  iprep_cost: 890000,
  efficiencyFactor: 0.95,
  inflationAdjustment: 5.2,
  totalVolumes: 28500000,
  tariff_per_kwh: 2.1437
}

export default function TariffSubmission({ token, user }) {
  const [inputs, setInputs] = useState({ ...defaultInputs })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState("")
  const [activeStep, setActiveStep] = useState("form")

  const updateField = (field, value) => setInputs(prev => ({ ...prev, [field]: parseFloat(value) || 0 }))

  const handleSubmit = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(API_BASE + "/api/v1/itvm/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify(inputs)
      })
      if (!res.ok) throw new Error("Submission failed")
      const data = await res.json()
      setResult(data)
      setActiveStep("results")
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const handleSign = async (party) => {
    if (!result) return
    setLoading(true)
    try {
      const res = await fetch(API_BASE + "/api/v1/itvm/" + result.id + "/sign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify({ party })
      })
      if (!res.ok) throw new Error("Signing failed")
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        { ["form", "validation", "signatures", "complete"].map(s => (
          <div key={s} style={{
            flex: 1, padding: "10px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600, textAlign: "center",
            background: activeStep === s ? "#3b82f6" : "var(--surface, #ffffff)",
            color: activeStep === s ? "white" : "var(--text-secondary, #64748b)",
            border: "1px solid var(--border, #e2e8f0)"
          }}>
            {s === "form" ? "1. Input Data" : s === "validation" ? "2. Validation" : s === "signatures" ? "3. Signatures" : "4. Complete"}
          </div>
        )) }
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: 12, marginBottom: 20, color: "#ef4444", fontSize: 13 }}>{error}</div>
      )}

      {activeStep === "form" && (
        <div style={{ background: "var(--surface, #ffffff)", borderRadius: 16, padding: 24, border: "1px solid var(--border, #e2e8f0)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 20px 0", color: "var(--text, #1e293b)" }}>NERSA Tariff Submission Inputs</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {Object.entries(inputs).map(([key, val]) => (
              <div key={key}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #64748b)", display: "block", marginBottom: 4 }}>
                  {key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                </label>
                <input type="number" step="0.0001" value={val} onChange={e => updateField(key, e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border, #e2e8f0)", fontSize: 13, background: "var(--surface, #fff)", color: "var(--text, #1e293b)" }} />
              </div>
            ))}
          </div>
          <button onClick={handleSubmit} disabled={loading}
            style={{ marginTop: 20, padding: "12px 24px", borderRadius: 10, border: "none", background: loading ? "rgba(59,130,246,0.5)" : "#3b82f6", color: "white", fontSize: 14, fontWeight: 600 }}>
            {loading ? "Submitting..." : "Submit Tariff for ITVM Validation"}
          </button>
        </div>
      )}

      {result && activeStep === "results" && (
        <div style={{ background: "var(--surface, #ffffff)", borderRadius: 16, padding: 24, border: "1px solid var(--border, #e2e8f0)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 16px 0", color: "var(--text, #1e293b)" }}>
            Validation Results {result.validation?.nersa_prevention_held ? "⚠ Submission Held" : "✓ All Checks Passed"}
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary, #64748b)", marginBottom: 16 }}>
            Computed Tariff: <strong style={{ color: "var(--text, #1e293b)" }}>R{result.computed_tariff?.toFixed(4)}/kWh</strong>
            {" | "}Status: <strong>{result.status}</strong>
            {" | "}ID: <code>{result.id}</code>
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--border, #e2e8f0)", color: "var(--text-secondary, #64748b)" }}>Check</th>
                <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--border, #e2e8f0)", color: "var(--text-secondary, #64748b)" }}>Result</th>
                <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--border, #e2e8f0)", color: "var(--text-secondary, #64748b)" }}>Value</th>
                <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--border, #e2e8f0)", color: "var(--text-secondary, #64748b)" }}>Severity</th>
              </tr>
            </thead>
            <tbody>
              {result.validation?.checks?.map((check, i) => (
                <tr key={i}>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border, #e2e8f0)", fontWeight: 600, color: "var(--text, #1e293b)" }}>
                    {i + 1}. {check.name}
                  </td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border, #e2e8f0)" }}>
                    <span style={{ color: check.passed ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                      {check.passed ? "✓ PASS" : "✗ FAIL"}
                    </span>
                  </td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border, #e2e8f0)", color: "var(--text-secondary, #64748b)" }}>{check.value}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border, #e2e8f0)" }}>
                    <span style={{
                      display: "inline-block", padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                      background: check.severity === "critical" ? "rgba(239,68,68,0.15)" : check.severity === "medium" ? "rgba(234,179,8,0.15)" : "rgba(16,185,129,0.15)",
                      color: check.severity === "critical" ? "#ef4444" : check.severity === "medium" ? "#eab308" : "#10b981"
                    }}>{check.severity}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
            <button onClick={() => handleSign("utility")} disabled={loading}
              style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: loading ? "rgba(59,130,246,0.5)" : "#3b82f6", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Sign as Utility
            </button>
            <button onClick={() => handleSign("regulator")} disabled={loading}
              style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: loading ? "rgba(139,92,246,0.5)" : "#8b5cf6", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Sign as Regulator (NERSA)
            </button>
            <button onClick={() => setActiveStep("form")}
              style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid var(--border, #e2e8f0)", background: "transparent", color: "var(--text-secondary, #64748b)", fontSize: 13, cursor: "pointer" }}>
              New Submission
            </button>
          </div>
          {result.status === "finalized" && (
            <div style={{ marginTop: 16, padding: 16, background: "rgba(16,185,129,0.1)", borderRadius: 12, textAlign: "center" }}>
              <strong style={{ color: "#10b981", fontSize: 15 }}>✓ TARIFF FINALIZED</strong>
              <p style={{ fontSize: 12, color: "var(--text-secondary, #64748b)", margin: "4px 0 0" }}>
                Multi-party consensus achieved. ZKP proof published for public verification.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
