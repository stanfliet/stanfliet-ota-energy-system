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
  checkCritical: { color: "#ef4444", fontWeight: 700, textTransform: "uppercase" as const },
  severityBadge: { display: "inline-block", padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 600, marginLeft: 8 },
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 },
  th: { textAlign: "left" as const, padding: "10px 12px", borderBottom: "1px solid var(--border, #e2e8f0)", color: "var(--text-secondary, #64748b)", fontWeight: 600 },
  td: { padding: "10px 12px", borderBottom: "1px solid var(--border, #e2e8f0)", color: "var(--text, #1e293b)" }
}

export default function ITVMDashboard({ token }) {
  const [submissions, setSubmissions] = useState([])
  const [blockchain, setBlockchain] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [simResult, setSimResult] = useState(null)

  useEffect(() => {
    if (token) fetchData()
  }, [token])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [subRes, chainRes] = await Promise.all([
        fetch(API_BASE + "/api/v1/itvm", {
          headers: { Authorization: Bearer  }
        }),
        fetch(API_BASE + "/api/v1/itvm/blockchain", {
          headers: { Authorization: Bearer  }
        })
      ])

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

  const runSimulation = async () => {
    setLoading(true)
    setSimResult(null)
    try {
      const res = await fetch(API_BASE + "/api/v1/itvm/simulate-mypd6", {
        method: "POST",
        headers: {
          Authorization: Bearer ,
          "Content-Type": "application/json"
        }
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
    return <div style={styles.container}>
      <div style={{ textAlign: "center", padding: 60, color: "var(--text-secondary, #64748b)" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
        <h2>Loading ITVM Dashboard...</h2>
        <p>Checking backend connection and tariff data</p>
      </div>
    </div>
  }

  const totalSubmissions = submissions.length
  const finalizedSubmissions = submissions.filter(s => s.status === "finalized").length
  const heldSubmissions = submissions.filter(s => s.status === "held").length
  const totalChecks = submissions.reduce((acc, s) => acc + (s.validation?.checks?.length || 0), 0)
  const passedChecks = submissions.reduce((acc, s) => acc + (s.validation?.checks?.filter(c => c.passed)?.length || 0), 0)

  return (
    <div style={styles.container}>
      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: 12, marginBottom: 20, color: "#ef4444", fontSize: 13 }}>
          {error}
          <button onClick={() => setError("")} style={{ marginLeft: 12, background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>Dismiss</button>
        </div>
      )}

      {/* Metrics */}
      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.metricValue}>{totalSubmissions}</div>
          <div style={styles.metricLabel}>Total Tariff Submissions</div>
        </div>
        <div style={styles.card}>
          <div style={{ ...styles.metricValue, color: "#10b981" }}>{finalizedSubmissions}</div>
          <div style={styles.metricLabel}>Finalized (Multi-Party Signed)</div>
        </div>
        <div style={styles.card}>
          <div style={{ ...styles.metricValue, color: heldSubmissions > 0 ? "#ef4444" : "#10b981" }}>{heldSubmissions}</div>
          <div style={styles.metricLabel}>Prevention Held (Critical Check Failures)</div>
        </div>
        <div style={styles.card}>
          <div style={styles.metricValue}>{passedChecks}/{totalChecks || 1}</div>
          <div style={styles.metricLabel}>Validation Checks Passed</div>
        </div>
      </div>

      {/* NERSA MYPD6 Case Study Simulation */}
      <div style={{ ...styles.card, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text, #1e293b)", margin: "0 0 12px 0" }}>
          NERSA MYPD6 Case Study Simulation
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-secondary, #64748b)", margin: "0 0 16px 0", lineHeight: 1.5 }}>
          Click below to simulate the MYPD6 error that cost SA consumers R76 billion.
          The ITVM 10-point pipeline will detect and prevent the 3.5-sigma depreciation anomaly.
        </p>
        <button
          onClick={runSimulation}
          disabled={loading}
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            border: "none",
            background: loading ? "rgba(239,68,68,0.5)" : "#ef4444",
            color: "white",
            fontSize: 13,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Running Simulation..." : "▶ Run MYPD6 Simulation"}
        </button>

        {simResult && (
          <div style={{ marginTop: 20, padding: 16, background: "rgba(239,68,68,0.05)", borderRadius: 12, border: "1px solid rgba(239,68,68,0.2)" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#ef4444", margin: "0 0 8px 0" }}>
              ⚠ MYPD6 Error Detected and Prevented!
            </h3>
            <p style={{ fontSize: 13, margin: "0 0 12px 0", color: "var(--text, #1e293b)", lineHeight: 1.5 }}>
              <strong>What went wrong:</strong> {simResult.analysis.what_went_wrong}
              <br />
              <strong>Sigma anomaly:</strong> {simResult.analysis.sigma_anomaly}σ
              <br />
              <strong>Incorrect tariff:</strong> R{simResult.analysis.incorrect_tariff?.toFixed(4)}/kWh
              <br />
              <strong>Correct tariff:</strong> R{simResult.analysis.correct_tariff?.toFixed(4)}/kWh
              <br />
              <strong>Annual overcharge:</strong> R{parseInt(simResult.analysis.annual_overcharge).toLocaleString()}
            </p>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: "var(--text, #1e293b)", margin: "0 0 8px 0" }}>
              Checks that would have prevented it:
            </h4>
            <ul style={{ fontSize: 13, color: "var(--text-secondary, #64748b)", lineHeight: 1.6, margin: 0, paddingLeft: 20 }}>
              {(simResult.analysis.prevented_by_checks || []).map((check, i) => (
                <li key={i} style={{ color: "#10b981" }}><strong>{check}</strong></li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Submissions Table */}
      <div style={styles.card}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text, #1e293b)", margin: "0 0 16px 0" }}>
          Tariff Submissions
        </h2>
        {submissions.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--text-secondary, #64748b)", textAlign: "center", padding: 20 }}>
            No tariff submissions yet. Go to "Submit Tariff" to create one.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
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
                {submissions.map(sub => (
                  <tr key={sub.id}>
                    <td style={styles.td}><code style={{ fontSize: 11 }}>{sub.id?.slice(0, 20)}...</code></td>
                    <td style={styles.td}>R{sub.computed_tariff?.toFixed(4)}</td>
                    <td style={styles.td}>
                      <span style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 600,
                        background: sub.status === "finalized" ? "rgba(16,185,129,0.15)" : sub.status === "held" ? "rgba(239,68,68,0.15)" : "rgba(234,179,8,0.15)",
                        color: sub.status === "finalized" ? "#10b981" : sub.status === "held" ? "#ef4444" : "#eab308"
                      }}>
                        {sub.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ color: sub.validation?.critical_failures > 0 ? "#ef4444" : "#10b981", fontWeight: 600 }}>
                        {sub.validation?.critical_failures || 0}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {sub.validation?.checks?.filter(c => c.passed).length || 0}/{sub.validation?.checks?.length || 10}
                    </td>
                    <td style={styles.td}>{new Date(sub.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Blockchain Status */}
      {blockchain && (
        <div style={{ ...styles.card, marginTop: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text, #1e293b)", margin: "0 0 16px 0" }}>
            Blockchain Audit Trail
          </h2>
          <div style={styles.grid}>
            <div>
              <div style={styles.metricValue}>{blockchain.blocks?.length || 0}</div>
              <div style={styles.metricLabel}>Audit Blocks</div>
            </div>
            <div>
              <div style={{ ...styles.metricValue, color: blockchain.status?.valid ? "#10b981" : "#ef4444" }}>
                {blockchain.status?.valid ? "✓ Valid" : "✗ Tampered"}
              </div>
              <div style={styles.metricLabel}>Chain Integrity</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
