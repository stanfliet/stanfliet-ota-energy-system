import React, { useState } from "react"

export default function AlertPanel() {
  const [alerts, setAlerts] = useState([
    { id:"ALT-001", meter:"SM-2026-0004", type:"tamper_magnetic", severity:"critical", status:"active", title:"Magnetic Tamper Detected", time:"2 min ago" },
    { id:"ALT-002", meter:"SM-2026-0002", type:"voltage_sag", severity:"high", status:"active", title:"Voltage Sag Below Threshold", time:"15 min ago" },
    { id:"ALT-003", meter:"SM-2026-0003", type:"heartbeat_missed", severity:"medium", status:"acknowledged", title:"Heartbeat Missed", time:"1 hour ago" },
    { id:"ALT-004", meter:"SM-2026-0001", type:"low_balance", severity:"low", status:"active", title:"Low Balance Warning", time:"2 hours ago" },
    { id:"ALT-005", meter:"SM-2026-0005", type:"phase_imbalance", severity:"high", status:"active", title:"Phase Imbalance Detected", time:"30 min ago" }
  ])

  const severities = ["all","critical","high","medium","low"]
  const [filter, setFilter] = useState("all")
  const [stats] = useState({ total:5, active:4, critical:1, high:2 })

  const filtered = filter === "all" ? alerts : alerts.filter(a => a.severity === filter)

  const acknowledge = (id) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, status:"acknowledged" } : a))
  }

  const simulateAlert = () => {
    const types = ["overcurrent","power_quality","tamper_magnetic","voltage_sag"]
    const severities = ["critical","high","medium","low"]
    const newAlert = {
      id:"ALT-00" + (alerts.length + 1),
      meter:"SM-2026-000" + Math.floor(Math.random()*5+1),
      type: types[Math.floor(Math.random()*types.length)],
      severity: severities[Math.floor(Math.random()*severities.length)],
      status:"active",
      title:"New Simulated Alert",
      time:"Just now"
    }
    setAlerts([newAlert, ...alerts])
  }

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card danger"><div className="stat-value">{stats.total}</div><div className="stat-label">Total Alerts</div></div>
        <div className="stat-card warning"><div className="stat-value">{stats.active}</div><div className="stat-label">Active</div></div>
        <div className="stat-card"><div className="stat-value">{stats.critical}</div><div className="stat-label">Critical</div></div>
        <div className="stat-card" style={{cursor:"pointer"}} onClick={simulateAlert}>
          <div className="stat-value">+</div><div className="stat-label">Simulate Alert</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <h3 className="card-title">🔔 Alert Feed</h3>
            <div style={{display:"flex",gap:6}}>
              {severities.map(s => (
                <button
                  key={s}
                  className={"btn btn-sm " + (filter === s ? "btn-primary" : "")}
                  onClick={() => setFilter(s)}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {filtered.map(a => (
            <div key={a.id} style={{
              display:"flex",justifyContent:"space-between",alignItems:"center",
              padding:"14px 18px",borderRadius:12,
              background: a.status === "active"
                ? a.severity === "critical" ? "rgba(252,129,129,0.06)" : "rgba(255,255,255,0.03)"
                : "rgba(255,255,255,0.02)",
              border: `1px solid ${
                a.severity === "critical" ? "rgba(252,129,129,0.15)" :
                a.severity === "high" ? "rgba(236,201,75,0.15)" :
                "var(--border-color)"
              }`,
              opacity: a.status === "acknowledged" ? 0.6 : 1
            }}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:20}}>
                  {a.type.includes("tamper") ? "🔨" : a.type.includes("volt") ? "⚡" : a.type.includes("heart") ? "💔" : a.type.includes("balance") ? "💰" : a.type.includes("phase") ? "🔀" : "⚠️"}
                </span>
                <div>
                  <div style={{fontWeight:600,fontSize:14}}>{a.title}</div>
                  <div style={{fontSize:12,color:"var(--text-light)"}}>{a.meter} • {a.time}</div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span className={"badge " + (a.severity === "critical" ? "offline" : a.severity === "high" ? "warning" : a.severity === "medium" ? "pending" : "online")}>
                  {a.severity}
                </span>
                {a.status === "active" && (
                  <button className="btn btn-sm" onClick={() => acknowledge(a.id)}>✓ Ack</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
