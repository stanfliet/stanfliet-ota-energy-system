import React, { useState, useEffect } from "react"

export default function Dashboard() {
  const [metrics] = useState({ meters: 5, online: 4, alerts: 3, tariffs: 2, revenue: 47165 })
  const [readings, setReadings] = useState([])

  useEffect(() => {
    const data = Array.from({ length: 24 }, (_, i) => ({
      time: String(i).padStart(2, "0") + ":00",
      consumption: Math.round((800 + Math.random() * 400 + (i >= 6 && i <= 9 ? 300 : 0) + (i >= 17 && i <= 21 ? 400 : 0)) * 10) / 10,
      generation: Math.round((i >= 6 && i <= 18 ? 200 + Math.sin((i - 6) / 12 * Math.PI) * 150 + Math.random() * 50 : 0) * 10) / 10
    }))
    setReadings(data)
  }, [])

  const maxConsumption = Math.max(...readings.map(r => r.consumption), 1)

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card success">
          <div className="stat-value">{metrics.meters}</div>
          <div className="stat-label">Total Meters</div>
          <div style={{fontSize:12,color:"var(--success)",marginTop:4}}>{metrics.online} online</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-value">{metrics.alerts}</div>
          <div className="stat-label">Active Alerts</div>
          <div style={{fontSize:12,color:"var(--warning)",marginTop:4}}>2 critical</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">R{Math.round(metrics.revenue/1000)}K</div>
          <div className="stat-label">Monthly Revenue</div>
          <div style={{fontSize:12,color:"var(--text-light)",marginTop:4}}>+12.3% vs last month</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">R2.1437</div>
          <div className="stat-label">Current Tariff (ZAR/kWh)</div>
          <div style={{fontSize:12,color:"var(--success)",marginTop:4}}>NERSA Verified</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h3 className="card-title">24-Hour Consumption</h3></div>
          <div style={{display:"flex",alignItems:"flex-end",height:200,gap:4,padding:"12px 0"}}>
            {readings.map((r,i) => (
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                <div style={{
                  width:"100%",
                  height: String((r.consumption / maxConsumption) * 180) + "px",
                  background:"linear-gradient(180deg,#3b82f6 0%,#1d4ed8 100%)",
                  borderRadius:"4px 4px 0 0",
                  transition:"height 0.3s ease",
                  minHeight:4
                }} />
                {i % 4 === 0 && <span style={{fontSize:9,color:"var(--text-light)"}}>{r.time}</span>}
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Recent Alerts</h3></div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:12,background:"rgba(252,129,129,0.08)",borderRadius:12}}>
              <div><strong style={{fontSize:14}}>Magnetic Tamper</strong><div style={{fontSize:12,color:"var(--text-light)"}}>SM-2026-0004</div></div>
              <span className="badge critical">Critical</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:12,background:"rgba(252,129,129,0.08)",borderRadius:12}}>
              <div><strong style={{fontSize:14}}>Voltage Sag</strong><div style={{fontSize:12,color:"var(--text-light)"}}>SM-2026-0002</div></div>
              <span className="badge high">High</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:12,background:"rgba(236,201,75,0.08)",borderRadius:12}}>
              <div><strong style={{fontSize:14}}>Heartbeat Missed</strong><div style={{fontSize:12,color:"var(--text-light)"}}>SM-2026-0003</div></div>
              <span className="badge medium">Medium</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{marginTop:20}}>
        <div className="card-header"><h3 className="card-title">NERSA Prevention Status</h3></div>
        <div className="grid-4">
          <div style={{textAlign:"center",padding:16}}>
            <div style={{fontSize:32,fontWeight:800,color:"var(--success)"}}>10/10</div>
            <div style={{fontSize:12,color:"var(--text-light)",marginTop:4}}>Checks Passed</div>
          </div>
          <div style={{textAlign:"center",padding:16}}>
            <div style={{fontSize:32,fontWeight:800,color:"var(--success)"}}>100%</div>
            <div style={{fontSize:12,color:"var(--text-light)",marginTop:4}}>Validation Score</div>
          </div>
          <div style={{textAlign:"center",padding:16}}>
            <div style={{fontSize:32,fontWeight:800,color:"var(--accent)"}}>2</div>
            <div style={{fontSize:12,color:"var(--text-light)",marginTop:4}}>Tariffs Verified</div>
          </div>
          <div style={{textAlign:"center",padding:16}}>
            <div style={{fontSize:32,fontWeight:800,color:"var(--info)"}}>R0</div>
            <div style={{fontSize:12,color:"var(--text-light)",marginTop:4}}>Errors Prevented</div>
          </div>
        </div>
      </div>
    </div>
  )
}
