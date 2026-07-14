import React, { useState, useEffect } from "react"

const API_BASE = "https://stanfliet-ota-api.onrender.com"

const styles = {
  container: { padding: 24 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 24 },
  card: { background: "var(--surface, #ffffff)", borderRadius: 16, padding: 24, boxShadow: "var(--card-shadow, 0 1px 3px rgba(0,0,0,0.1))", border: "1px solid var(--border, #e2e8f0)" },
  metricValue: { fontSize: 32, fontWeight: 700, color: "var(--text, #1e293b)", marginBottom: 4 },
  metricLabel: { fontSize: 13, color: "var(--text-secondary, #64748b)" },
  checkPassed: { color: "#10b981", fontWeight: 600 },
  checkFailed: { color: "#ef4444", fontWeight: 600 },
  checkCritical: { color: "#ef4444", fontWeight: 700, textTransform: "uppercase" },
  severityBadge: { display: "inline-block", padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 600, marginLeft: 8 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { textAlign: "left", padding: "10px 12px", borderBottom: "1px solid var(--border, #e2e8f0)", color: "var(--text-secondary, #64748b)", fontWeight: 600 },
  td: { padding: "10px 12px", borderBottom: "1px solid var(--border, #e2e8f0)", color: "var(--text, #1e293b)" }
}

export default function ITVMDashboard({ token }) {
  const [submissions, setSubmissions] = useState([])
  const [blockchain, setBlockchain] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [simResult, setSimResult] = useState(null)

  useEffect(function() {
    if (token) fetchData()
  }, [token])

  function getAuthHeaders() {
    return {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json"
    }
  }

  const fetchData = async function() {
    setLoading(true)
    try {
      const headers = getAuthHeaders()
      const subRes = await fetch(API_BASE + "/api/v1/itvm", { headers: headers })
      const chainRes = await fetch(API_BASE + "/api/v1/itvm/blockchain", { headers: headers })

      if (subRes.ok) {
        const data = await subRes.json()
        setSubmissions(data.submissions || [])
      }
      if (chainRes.ok) {
        const data = await chainRes.json()
        setBlockchain(data)
      }
    } catch (err) {
      setError("Failed to load ITVM data. Backend may be starting up.")
    }
    setLoading(false)
  }

  const runSimulation = async function() {
    setLoading(true)
    setSimResult(null)
    try {
      const headers = getAuthHeaders()
      const res = await fetch(API_BASE + "/api/v1/itvm/simulate-mypd6", {
        method: "POST",
        headers: headers
      })
      if (res.ok) {
        const data = await res.json()
        setSimResult(data)
      } else {
        setError("Simulation failed. Backend may be starting up.")
      }
    } catch (err) {
      setError("Failed to run simulation.")
    }
    setLoading(false)
  }

  if (loading && submissions.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>??</div>
          <h2>Loading ITVM Dashboard...</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Checking backend connection and tariff data</p>
          <div style={{ width: 40, height: 40, border: "3px solid #e2e8f0", borderTop: "3px solid #3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "16px auto" }}></div>
        </div>
      </div>
    )
  }

  const totalSubmissions = submissions.length
  const finalizedSubmissions = submissions.filter(function(s) { return s.status === "finalized" }).length
  const heldSubmissions = submissions.filter(function(s) { return s.status === "held" }).length
  const totalChecks = submissions.reduce(function(acc, s) { return acc + (s.validation && s.validation.checks ? s.validation.checks.length : 0) }, 0)
  const passedChecks = submissions.reduce(function(acc, s) {
    if (!s.validation || !s.validation.checks) return acc
    return acc + s.validation.checks.filter(function(c) { return c.passed }).length
  }, 0)

  return (
    <div style={styles.container}>
      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", padding: "12px 16px", borderRadius: 8, marginBottom: 16, fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{error}</span>
          <button onClick={function() { setError("") }} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", marginLeft: 12 }}>Dismiss</button>
        </div>
      )}

      {/* Metrics */}
      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.metricValue}>{totalSubmissions}</div>
          <div style={styles.metricLabel}>Total Tariff Submissions</div>
        </div>
        <div style={styles.card}>
          <div style={Object.assign({}, styles.metricValue, { color: "#10b981" })}>{finalizedSubmissions}</div>
          <div style={styles.metricLabel}>Finalized (Multi-Party Signed)</div>
        </div>
        <div style={styles.card}>
          <div style={Object.assign({}, styles.metricValue, { color: heldSubmissions > 0 ? "#ef4444" : "#10b981" })}>{heldSubmissions}</div>
          <div style={styles.metricLabel}>Prevention Held (Critical Check Failures)</div>
        </div>
        <div style={styles.card}>
          <div style={Object.assign({}, styles.metricValue, { color: "#8b5cf6" })}>{passedChecks}/{totalChecks || 1}</div>
          <div style={styles.metricLabel}>Validation Checks Passed</div>
        </div>
      </div>

      {/* NERSA MYPD6 Case Study Simulation */}
      <div style={Object.assign({}, styles.card, { marginBottom: 24 })}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px 0", color: "var(--text, #1e293b)" }}>NERSA MYPD6 Case Study Simulation</h2>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 16px 0" }}>Click below to simulate the MYPD6 error that cost SA consumers R76 billion. The ITVM 10-point pipeline will detect and prevent the 3.5-sigma depreciation anomaly.</p>
        <button onClick={runSimulation} disabled={loading} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: loading ? "rgba(59,130,246,0.5)" : "#3b82f6", color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          {loading ? "Running Simulation..." : "? Run MYPD6 Simulation"}
        </button>

        {simResult && (
          <div style={{ marginTop: 16, padding: 16, background: "rgba(239,68,68,0.05)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)" }}>
            <h3 style={{ color: "#ef4444", fontSize: 15, margin: "0 0 12px 0" }}>? MYPD6 Error Detected and Prevented!</h3>
            <p style={{ fontSize: 13, margin: "0 0 8px 0" }}><strong>What went wrong:</strong> {simResult.analysis && simResult.analysis.what_went_wrong}</p>
            <p style={{ fontSize: 13, margin: "0 0 8px 0" }}><strong>Sigma anomaly:</strong> {simResult.analysis && simResult.analysis.sigma_anomaly}s</p>
            <p style={{ fontSize: 13, margin: "0 0 8px 0" }}><strong>Incorrect tariff:</strong> R{simResult.analysis && simResult.analysis.incorrect_tariff ? simResult.analysis.incorrect_tariff.toFixed(4) : "0"}/kWh</p>
            <p style={{ fontSize: 13, margin: "0 0 8px 0" }}><strong>Correct tariff:</strong> R{simResult.analysis && simResult.analysis.correct_tariff ? simResult.analysis.correct_tariff.toFixed(4) : "0"}/kWh</p>
            <p style={{ fontSize: 13, margin: "0 0 12px 0" }}><strong>Annual overcharge:</strong> R{simResult.analysis && simResult.analysis.annual_overcharge ? parseInt(simResult.analysis.annual_overcharge).toLocaleString() : "0"}</p>
            {simResult.analysis && simResult.analysis.prevented_by_checks && (
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 8px 0" }}>Checks that would have prevented it:</p>
                <ul style={{ fontSize: 12, margin: 0, paddingLeft: 20 }}>
                  {simResult.analysis.prevented_by_checks.map(function(check, i) {
                    return <li key={i} style={{ marginBottom: 4 }}><strong>{check}</strong></li>
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submissions Table */}
      <div style={Object.assign({}, styles.card, { marginBottom: 24 })}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 16px 0", color: "var(--text, #1e293b)" }}>Tariff Submissions</h2>
        {submissions.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>No tariff submissions yet. Go to "Submit Tariff" to create one.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Tariff (ZAR/kWh)</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Critical Failures</th>
                <th style={styles.th}>Checks Passed</th>
                <th style={styles.th}>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(function(sub) {
                return (
                  <tr key={sub.id}>
                    <td style={styles.td}>{sub.id ? sub.id.slice(0, 20) + "..." : "N/A"}</td>
                    <td style={styles.td}>R{sub.computed_tariff ? sub.computed_tariff.toFixed(4) : "0.0000"}</td>
                    <td style={styles.td}>
                      <span style={{ fontWeight: 600, color: sub.status === "finalized" ? "#10b981" : sub.status === "held" ? "#ef4444" : "#eab308" }}>{sub.status}</span>
                    </td>
                    <td style={Object.assign({}, styles.td, { color: (sub.validation && sub.validation.critical_failures || 0) > 0 ? "#ef4444" : "#10b981", fontWeight: 600 })}>
                      {sub.validation ? sub.validation.critical_failures || 0 : 0}
                    </td>
                    <td style={styles.td}>
                      {sub.validation && sub.validation.checks ? sub.validation.checks.filter(function(c) { return c.passed }).length : 0}/{sub.validation && sub.validation.checks ? sub.validation.checks.length : 10}
                    </td>
                    <td style={styles.td}>{sub.created_at ? new Date(sub.created_at).toLocaleDateString() : "N/A"}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Blockchain Status */}
      {blockchain && (
        <div style={styles.card}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 16px 0", color: "var(--text, #1e293b)" }}>Blockchain Audit Trail</h2>
          <div style={{ display: "flex", gap: 24 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text, #1e293b)" }}>{blockchain.blocks ? blockchain.blocks.length : 0}</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Audit Blocks</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: blockchain.status && blockchain.status.valid ? "#10b981" : "#ef4444" }}>
                {blockchain.status && blockchain.status.valid ? "? Valid" : "? Tampered"}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Chain Integrity</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
