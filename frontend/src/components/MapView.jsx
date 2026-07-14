import React, { useState } from "react"

export default function MapView() {
  const [meters] = useState([
    { serial:"SM-2026-0001", lat:-26.2041, lng:28.0473, status:"online", customer:"John Dube", balance:245.50 },
    { serial:"SM-2026-0002", lat:-26.1076, lng:28.0567, status:"online", customer:"Mary Molefe", balance:510.00 },
    { serial:"SM-2026-0003", lat:-26.1923, lng:28.0324, status:"online", customer:"Peter Nkosi", balance:1220.75 },
    { serial:"SM-2026-0004", lat:-26.2345, lng:28.1123, status:"warning", customer:"Sarah Botha", balance:89.20 },
    { serial:"SM-2026-0005", lat:-26.1512, lng:28.0891, status:"online", customer:"Eskom Industrial Park", balance:45000.00 }
  ])

  const [selected, setSelected] = useState(null)
  const [mapStyle, setMapStyle] = useState("standard")

  // SVG map simulation (since we need Leaflet CSS loaded separately)
  const centerLat = -26.17
  const centerLng = 28.07
  const scale = 2800

  const toX = (lng) => 400 + (lng - centerLng) * scale
  const toY = (lat) => 300 - (lat - centerLat) * scale

  const statusColors = { online: "#48bb78", offline: "#fc8181", warning: "#ecc94b", alert: "#fc8181" }

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card success"><div className="stat-value">{meters.length}</div><div className="stat-label">Total Meters</div></div>
        <div className="stat-card"><div className="stat-value">{meters.filter(m => m.status === "online").length}</div><div className="stat-label">Online</div></div>
        <div className="stat-card warning"><div className="stat-value">{meters.filter(m => m.status !== "online").length}</div><div className="stat-label">Attention Needed</div></div>
        <div className="stat-card"><div className="stat-value">R{Math.round(meters.reduce((s,m) => s + m.balance, 0))}</div><div className="stat-label">Total Balance (ZAR)</div></div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <h3 className="card-title">??? Meter Locations — Johannesburg Metro</h3>
              <select value={mapStyle} onChange={e => setMapStyle(e.target.value)} style={{padding:"6px 12px",borderRadius:8,border:"1px solid var(--border-color)",fontSize:12,background:"var(--bg-secondary)",color:"var(--text-primary)"}}>
                <option value="standard">Standard</option>
                <option value="satellite">Satellite</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>
          <div style={{
            width:"100%",height:400,borderRadius:12,overflow:"hidden",
            background: mapStyle === "dark" ? "#1a202c" : mapStyle === "satellite" ? "#2d3748" : "#e2e8f0",
            position:"relative"
          }}>
            {/* Grid lines */}
            {[-3,-2,-1,0,1,2,3].map(i => (
              <div key={`v${i}`} style={{position:"absolute",left:200 + i * 80,top:0,width:1,height:"100%",background:"rgba(255,255,255,0.06)"}} />
            ))}
            {[-3,-2,-1,0,1,2,3].map(i => (
              <div key={`h${i}`} style={{position:"absolute",top:150 + i * 60,left:0,height:1,width:"100%",background:"rgba(255,255,255,0.06)"}} />
            ))}
            {/* Meter markers */}
            {meters.map(m => (
              <div
                key={m.serial}
                onClick={() => setSelected(m)}
                style={{
                  position:"absolute",
                  left: toX(m.lng) - 16,
                  top: toY(m.lat) - 16,
                  width:32,height:32,
                  borderRadius:"50%",
                  background: statusColors[m.status] || "#48bb78",
                  border:"3px solid white",
                  boxShadow:"0 2px 10px rgba(0,0,0,0.3)",
                  cursor:"pointer",
                  display:"flex",
                  alignItems:"center",
                  justifyContent:"center",
                  fontSize:14,
                  fontWeight:800,
                  color:"white",
                  zIndex: selected?.serial === m.serial ? 10 : 5,
                  transform: selected?.serial === m.serial ? "scale(1.3)" : "scale(1)",
                  transition:"all 0.3s cubic-bezier(0.16,1,0.3,1)"
                }}
                title={`${m.serial} - ${m.customer}`}
              >
                ?
              </div>
            ))}
            {/* Map labels */}
            <div style={{position:"absolute",bottom:12,left:12,fontSize:11,color:"rgba(255,255,255,0.5)",background:"rgba(0,0,0,0.5)",padding:"4px 10px",borderRadius:6}}>
              Johannesburg Metro • {meters.length} meters
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">{selected ? `?? ${selected.serial}` : "?? Meter Details"}</h3></div>
          {selected ? (
            <div>
              <div className="form-group"><label>Serial</label><input readOnly value={selected.serial} /></div>
              <div className="form-group"><label>Customer</label><input readOnly value={selected.customer} /></div>
              <div className="form-group"><label>Status</label><input readOnly value={selected.status} /></div>
              <div className="form-group"><label>Balance</label><input readOnly value={`R${selected.balance.toFixed(2)}`} /></div>
              <div className="form-group"><label>Location</label><input readOnly value={`${selected.lat.toFixed(4)}, ${selected.lng.toFixed(4)}`} /></div>
              <div style={{display:"flex",gap:8,marginTop:16}}>
                <button className="btn btn-sm">?? View Readings</button>
                <button className="btn btn-sm btn-primary">?? Dispatch Inspector</button>
              </div>
            </div>
          ) : (
            <div style={{textAlign:"center",padding:40,color:"var(--text-light)"}}>
              <div style={{fontSize:48,marginBottom:16}}>???</div>
              <p>Click a meter marker on the map to view its details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
