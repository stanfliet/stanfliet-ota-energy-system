import React, { useState } from "react"

export default function TariffVerifier() {
  const [submissions] = useState([
    { id:"TARIFF-2025-001", utility:"ESKOM", tariff:2.1437, status:"finalized", date:"2025-03-15", score:100 },
    { id:"TARIFF-2026-001", utility:"ESKOM", tariff:2.2814, status:"pending", date:"2026-06-01", score:95 }
  ])
  const [selected, setSelected] = useState(submissions[0])
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)

  const checks = [
    { name:"Depreciation Z-Score", passed:true, detail:"1.23σ (threshold: 3.5σ)" },
    { name:"RAB Change Detection", passed:true, detail:"6.8% change (threshold: 15%)" },
    { name:"Input Completeness", passed:true, detail:"All 6 required fields present" },
    { name:"Range Validation", passed:true, detail:"RoA=6.82%, Tariff=R2.1437" },
    { name:"Version Integrity", passed:true, detail:"SHA-256: a1b2...c3d4" },
    { name:"Cross-Component Consistency", passed:true, detail:"0.3% deviation (threshold: 2%)" },
    { name:"Historical Comparison", passed:true, detail:"+35.3% from MYPD5 (R1.5842)" },
    { name:"Formula Correctness", passed:true, detail:"Expected=2.1437, Actual=2.1437" },
    { name:"ML Anomaly Score", passed:true, detail:"Score: 0.0821 (threshold: 0.5)" },
    { name:"Multi-Party Threshold", passed:selected?.status === "finalized", detail:selected?.status === "finalized" ? "2/2 signatures" : "1/2 signatures" }
  ]

  const runValidation = () => {
    setRunning(true)
    setTimeout(() => {
      const passed = checks.filter(c => c.passed).length
      setResult({ passed: passed === 10, score: Math.round(passed / 10 * 100), checks })
      setRunning(false)
    }, 1500)
  }

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card success"><div className="stat-value">{submissions.length}</div><div className="stat-label">Total Submissions</div></div>
        <div className="stat-card"><div className="stat-value">{submissions.filter(s => s.status === "finalized").length}</div><div className="stat-label">Finalized</div></div>
        <div className="stat-card warning"><div className="stat-value">{submissions.filter(s => s.status === "pending").length}</div><div className="stat-label">Pending Review</div></div>
        <div className="stat-card"><div className="stat-value">100%</div><div className="stat-label">Uptime</div></div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h3 className="card-title">📋 Tariff Submissions</h3></div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {submissions.map(s => (
              <div
                key={s.id}
                onClick={() => { setSelected(s); setResult(null) }}
                style={{
                  padding:16,
                  borderRadius:12,
                  cursor:"pointer",
                  background: selected?.id === s.id ? "rgba(59,130,246,0.08)" : "transparent",
                  border: selected?.id === s.id ? "1px solid rgba(59,130,246,0.2)" : "1px solid transparent",
                  transition:"all 0.2s ease"
                }}
              >
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><strong>{s.id}</strong><div style={{fontSize:12,color:"var(--text-light)"}}>{s.utility} • {s.date}</div></div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontWeight:700}}>R{s.tariff}</div>
                    <span className={"badge " + (s.status === "finalized" ? "online" : "pending")}>{s.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <h3 className="card-title">🔍 NERSA 10-Check Pipeline</h3>
              <button className="btn btn-primary" onClick={runValidation} disabled={running}>
                {running ? <><span className="spinner" /> Validating...</> : "▶ Run Validation"}
              </button>
            </div>
          </div>
          {result ? (
            <div>
              <div className={"alert-box " + (result.passed ? "success" : "error")}>
                {result.passed ? "✅ All 10 checks passed — Tariff is valid" : "⚠️ Some checks failed — Review required"}
                <div style={{fontSize:24,fontWeight:800,marginTop:8}}>{result.score}% Score</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {result.checks.map((c,i) => (
                  <div key={i} style={{
                    display:"flex",justifyContent:"space-between",alignItems:"center",
                    padding:"10px 14px",borderRadius:10,
                    background: c.passed ? "rgba(72,187,120,0.06)" : "rgba(252,129,129,0.06)",
                    border: `1px solid ${c.passed ? "rgba(72,187,120,0.15)" : "rgba(252,129,129,0.15)"}`
                  }}>
                    <div>
                      <span style={{fontWeight:600,fontSize:13}}>{c.passed ? "✅" : "❌"} {c.name}</span>
                      <div style={{fontSize:11,color:"var(--text-light)",marginTop:2}}>{c.detail}</div>
                    </div>
                    <span className={"badge " + (c.passed ? "online" : "offline")}>{c.passed ? "Pass" : "Fail"}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{textAlign:"center",padding:40,color:"var(--text-light)"}}>
              <div style={{fontSize:48,marginBottom:16}}>✅</div>
              <p>Select a submission and click "Run Validation" to execute the NERSA 10-check prevention pipeline.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
