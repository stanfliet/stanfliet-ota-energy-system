import React, { useState, useEffect } from "react"

const API_BASE = "https://stanfliet-ota-api.onrender.com"
const AUTH_TOKEN_KEY = "stanfliet_auth_token"

export default function MeterDashboard() {
  const [meters, setMeters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedMeter, setSelectedMeter] = useState(null)
  const [liveData, setLiveData] = useState(null)

  const getToken = function() { return localStorage.getItem(AUTH_TOKEN_KEY); }

  useEffect(function() {
    loadMeters()
  }, [])

  const loadMeters = async function() {
    setLoading(true)
    try {
      var token = getToken()
      var res = await fetch(API_BASE + "/api/v1/meters", {
        headers: { Authorization: "Bearer " + token }
      })
      if (res.ok) { var d = await res.json(); setMeters(d.meters || []); }
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  const viewMeter = async function(id) {
    setSelectedMeter(id)
    setLiveData(null)
    try {
      var token = getToken()
      var res = await fetch(API_BASE + "/api/v1/ota/status/" + id, {
        headers: { Authorization: "Bearer " + token }
      })
      if (res.ok) { var d = await res.json(); setLiveData(d); }
    } catch (e) {}
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: "var(--text, #1e293b)" }}>Meter Management Dashboard</h2>
      {error && <div style={{ background: "rgba(239,68,68,0.1)", borderRadius: 12, padding: 12, marginBottom: 20, color: "#ef4444", fontSize: 13 }}>{error}</div>}

      {loading ? <p style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }}>Loading meters...</p> : (
        <div style={{ display: "grid", gap: 16 }}>
          {meters.map(function(m) {
            var isSelected = selectedMeter === m.meter_id || selectedMeter === m.id
            return (
              <div key={m.meter_id || m.id} onClick={function() { viewMeter(m.meter_id || m.id); }} style={{
                background: isSelected ? "rgba(59,130,246,0.05)" : "var(--surface, #fff)",
                borderRadius: 16, padding: 20, border: isSelected ? "2px solid #3b82f6" : "1px solid var(--border, #e2e8f0)",
                cursor: "pointer", transition: "all 0.2s"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text, #1e293b)" }}>{m.meter_id || m.id || m.meter_number}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary, #64748b)", marginTop: 4 }}>{m.location || m.address || "Location not set"}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#10b981" }}>{m.credit_balance || m.balance || "0"} kWh</div>
                    <div style={{ fontSize: 11, marginTop: 2, padding: "2px 8px", borderRadius: 8, display: "inline-block", background: m.status === "online" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", color: m.status === "online" ? "#10b981" : "#ef4444" }}>{m.status || "unknown"}</div>
                  </div>
                </div>
                {isSelected && liveData && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border, #e2e8f0)" }}>
                    <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: "var(--text, #1e293b)" }}>Real-Time Status</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                      <div style={{ padding: 12, background: "rgba(59,130,246,0.05)", borderRadius: 10 }}>
                        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>Pending Commands</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: "#3b82f6" }}>{liveData.pending_commands || 0}</div>
                      </div>
                      <div style={{ padding: 12, background: "rgba(16,185,129,0.05)", borderRadius: 10 }}>
                        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>Last Token</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#10b981" }}>{m.last_token_date || "N/A"}</div>
                      </div>
                      <div style={{ padding: 12, background: "rgba(139,92,246,0.05)", borderRadius: 10 }}>
                        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>Firmware</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#8b5cf6" }}>{m.firmware_version || "v1.0.0"}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {meters.length === 0 && <p style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: 13, padding: 40 }}>No meters registered. Add a meter to get started.</p>}
        </div>
      )}
    </div>
  )
}
