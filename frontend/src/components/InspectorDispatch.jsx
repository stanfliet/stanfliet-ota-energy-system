import React, { useState } from "react"

export default function InspectorDispatch() {
  const [tasks, setTasks] = useState([
    { id: "DSP-001", alertType: "tamper_magnetic", meter: "SM-2026-0004", location: "-26.2345, 28.1123", status: "assigned", priority: "high", inspector: "Thabo Mokoena", eta: "15 min" },
    { id: "DSP-002", alertType: "voltage_sag", meter: "SM-2026-0002", location: "-26.1076, 28.0567", status: "en_route", priority: "high", inspector: "Zanele Nkosi", eta: "8 min" },
    { id: "DSP-003", alertType: "heartbeat_missed", meter: "SM-2026-0003", location: "-26.1923, 28.0324", status: "pending", priority: "normal", inspector: "Unassigned", eta: "--" }
  ])

  return (
    <div className="grid-2">
      <div className="card">
        <div className="card-header"><h3 className="card-title">Dispatch Tasks</h3></div>
        <div className="table-container">
          <table>
            <thead><tr><th>Task</th><th>Alert</th><th>Meter</th><th>Priority</th><th>Inspector</th><th>ETA</th><th>Status</th></tr></thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id}>
                  <td style={{fontFamily:"monospace",fontSize:12}}>{t.id}</td>
                  <td>{t.alertType.replace(/_/g, " ")}</td>
                  <td style={{fontFamily:"monospace",fontSize:12}}>{t.meter}</td>
                  <td><span className={"badge " + t.priority}>{t.priority}</span></td>
                  <td>{t.inspector}</td>
                  <td>{t.eta}</td>
                  <td><span className={"badge " + t.status}>{t.status.replace(/_/g, " ")}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><h3 className="card-title">Inspectors On Duty</h3></div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{padding:16,background:"#f7fafc",borderRadius:8}}>
            <div style={{display:"flex",justifyContent:"space-between"}}><strong>Thabo Mokoena</strong><span className="badge online">Available</span></div>
            <div style={{fontSize:13,color:"var(--text-light)",marginTop:4}}>Active tasks: 1</div>
          </div>
          <div style={{padding:16,background:"#f7fafc",borderRadius:8}}>
            <div style={{display:"flex",justifyContent:"space-between"}}><strong>Zanele Nkosi</strong><span className="badge warning">En Route</span></div>
            <div style={{fontSize:13,color:"var(--text-light)",marginTop:4}}>Active tasks: 1</div>
          </div>
          <div style={{padding:16,background:"#f7fafc",borderRadius:8}}>
            <div style={{display:"flex",justifyContent:"space-between"}}><strong>Pieter van der Merwe</strong><span className="badge online">Available</span></div>
            <div style={{fontSize:13,color:"var(--text-light)",marginTop:4}}>Active tasks: 0</div>
          </div>
        </div>
      </div>
    </div>
  )
}
