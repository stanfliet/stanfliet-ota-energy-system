import React, { useState, useEffect } from "react"

const API_BASE = "https://stanfliet-ota-api.onrender.com"
const AUTH_TOKEN_KEY = "stanfliet_auth_token"

export default function ClientDashboard({ user, token }) {
  const [meters, setMeters] = useState([])
  const [recentTx, setRecentTx] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAI, setShowAI] = useState(false)
  const [aiMessage, setAiMessage] = useState("")
  const [aiChat, setAiChat] = useState([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSession, setAiSession] = useState("")

  const getAuthHeaders = function() {
    return {
      "Content-Type": "application/json",
      Authorization: "Bearer " + (token || localStorage.getItem(AUTH_TOKEN_KEY))
    }
  }

  useEffect(function() {
    loadDashboardData()
  }, [])

  const loadDashboardData = async function() {
    setLoading(true)
    try {
      const tokenVal = token || localStorage.getItem(AUTH_TOKEN_KEY)
      if (!tokenVal) return

      // Load profile with meters
      const profileRes = await fetch(API_BASE + "/api/v1/auth/profile", {
        headers: { Authorization: "Bearer " + tokenVal }
      })
      if (profileRes.ok) {
        const profileData = await profileRes.json()
        setMeters(profileData.meters || [])
      }

      // Load recent transactions
      const txRes = await fetch(API_BASE + "/api/v1/transactions?limit=10", {
        headers: { Authorization: "Bearer " + tokenVal }
      })
      if (txRes.ok) {
        const txData = await txRes.json()
        setRecentTx(txData.transactions || [])
      }

      // Initialize AI session
      setAiSession("session_" + (user?.id || Date.now()) + "_" + Date.now())
    } catch (e) {
      console.error("Dashboard load error:", e)
    }
    setLoading(false)
  }

  const askAI = async function() {
    if (!aiMessage.trim()) return
    setAiLoading(true)

    const userMsg = aiMessage
    setAiChat(function(prev) { return prev.concat([{ role: "user", content: userMsg }]); })
    setAiMessage("")

    try {
      const res = await fetch(API_BASE + "/api/v1/ai/chat", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ message: userMsg, sessionId: aiSession })
      })

      if (res.ok) {
        const data = await res.json()
        setAiChat(function(prev) { return prev.concat([{ role: "assistant", content: data.response }]); })
      } else {
        setAiChat(function(prev) { return prev.concat([{ role: "assistant", content: "Sorry, I could not process that. Please try again." }]); })
      }
    } catch (e) {
      setAiChat(function(prev) { return prev.concat([{ role: "assistant", content: "Network error. Please check your connection." }]); })
    }
    setAiLoading(false)
  }

  const totalBalance = meters.reduce(function(sum, m) {
    return sum + parseFloat(m.credit_balance || 0)
  }, 0)

  const onlineMeters = meters.filter(function(m) {
    return m.status === "online"
  }).length

  // Stats cards
  const StatsCard = function({ icon, label, value, color }) {
    return (
      <div style={{
        background: "var(--surface, #fff)", borderRadius: 16, padding: 20,
        border: "1px solid var(--border, #e2e8f0)", flex: 1, minWidth: 160
      }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
        <div style={{ fontSize: 12, color: "var(--text-secondary, #64748b)", marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: color || "var(--text, #1e293b)" }}>{value}</div>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      {/* Welcome Banner */}
      <div style={{
        background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #3b82f6 100%)",
        borderRadius: 20, padding: 28, marginBottom: 24, color: "white",
        position: "relative", overflow: "hidden"
      }}>
        <div style={{ position: "absolute", right: -20, top: -20, fontSize: 120, opacity: 0.1 }}>⚡</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
          Welcome back, {user?.name || user?.email || "Customer"}!
        </h2>
        <p style={{ fontSize: 14, opacity: 0.8, marginTop: 8, maxWidth: 500, lineHeight: 1.5 }}>
          Manage your prepaid electricity accounts, purchase credits via OTA,
          transfer between meters, and access your transaction history.
        </p>
      </div>

      {/* Stats Row */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <StatsCard icon="⚡" label="Total Credit Balance" value={totalBalance.toFixed(2) + " kWh"} color="#3b82f6" />
        <StatsCard icon="📟" label="Registered Meters" value={meters.length.toString()} color="#10b981" />
        <StatsCard icon="🟢" label="Meters Online" value={onlineMeters.toString() + "/" + meters.length} color={onlineMeters > 0 ? "#10b981" : "#ef4444"} />
        <StatsCard icon="📊" label="Recent Transactions" value={recentTx.length.toString()} color="#8b5cf6" />
      </div>

      {/* Main Content Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Left Column: Meters */}
        <div style={{ background: "var(--surface, #fff)", borderRadius: 16, padding: 24, border: "1px solid var(--border, #e2e8f0)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px 0", color: "var(--text, #1e293b)", display: "flex", alignItems: "center", gap: 8 }}>
            <span>📟</span> Your Meters
          </h3>
          {loading ? <p style={{ fontSize: 13, color: "var(--text-secondary)", textAlign: "center", padding: 20 }}>Loading...</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {meters.length === 0 && (
                <div style={{ textAlign: "center", padding: 30 }}>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8 }}>No meters registered yet.</p>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>Contact your utility provider to register a meter.</p>
                </div>
              )}
              {meters.map(function(m, i) {
                return (
                  <div key={i} style={{
                    padding: 16, borderRadius: 12, border: "1px solid var(--border, #e2e8f0)",
                    background: m.status === "online" ? "rgba(16,185,129,0.03)" : "rgba(100,116,139,0.03)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text, #1e293b)", fontFamily: "monospace" }}>
                          {m.meter_number}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary, #64748b)", marginTop: 2 }}>
                          {m.location || "Location not set"}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#3b82f6" }}>
                          {parseFloat(m.credit_balance || 0).toFixed(2)} kWh
                        </div>
                        <div style={{
                          display: "inline-block", padding: "2px 10px", borderRadius: 8, fontSize: 11,
                          fontWeight: 600, marginTop: 4,
                          background: m.status === "online" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.1)",
                          color: m.status === "online" ? "#10b981" : "#ef4444"
                        }}>
                          {m.status === "online" ? "Online" : m.status === "offline" ? "Offline" : m.status}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Column: Recent Transactions */}
        <div style={{ background: "var(--surface, #fff)", borderRadius: 16, padding: 24, border: "1px solid var(--border, #e2e8f0)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px 0", color: "var(--text, #1e293b)", display

cd C:\Users\k2020\Desktop\stanfliet-ota-energy-system

$clientDashboard = @'
import React, { useState, useEffect } from "react"

const API_BASE = "https://stanfliet-ota-api.onrender.com"
const AUTH_TOKEN_KEY = "stanfliet_auth_token"

export default function ClientDashboard({ user, token }) {
  const [meters, setMeters] = useState([])
  const [recentTx, setRecentTx] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAI, setShowAI] = useState(false)
  const [aiMessage, setAiMessage] = useState("")
  const [aiChat, setAiChat] = useState([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSession, setAiSession] = useState("")

  const getAuthHeaders = function() {
    return {
      "Content-Type": "application/json",
      Authorization: "Bearer " + (token || localStorage.getItem(AUTH_TOKEN_KEY))
    }
  }

  useEffect(function() { loadDashboardData() }, [])

  const loadDashboardData = async function() {
    setLoading(true)
    try {
      var t = token || localStorage.getItem(AUTH_TOKEN_KEY)
      if (!t) return

      var profileRes = await fetch(API_BASE + "/api/v1/auth/profile", {
        headers: { Authorization: "Bearer " + t }
      })
      if (profileRes.ok) {
        var pd = await profileRes.json()
        setMeters(pd.meters || [])
      }

      var txRes = await fetch(API_BASE + "/api/v1/transactions?limit=10", {
        headers: { Authorization: "Bearer " + t }
      })
      if (txRes.ok) {
        var txData = await txRes.json()
        setRecentTx(txData.transactions || [])
      }

      setAiSession("session_" + (user?.id || Date.now()) + "_" + Date.now())
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const askAI = async function() {
    if (!aiMessage.trim()) return
    setAiLoading(true)
    var userMsg = aiMessage
    setAiChat(function(p) { return p.concat([{ role: "user", content: userMsg }]); })
    setAiMessage("")

    try {
      var res = await fetch(API_BASE + "/api/v1/ai/chat", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ message: userMsg, sessionId: aiSession })
      })
      if (res.ok) {
        var d = await res.json()
        setAiChat(function(p) { return p.concat([{ role: "assistant", content: d.response }]); })
      } else {
        setAiChat(function(p) { return p.concat([{ role: "assistant", content: "Sorry, I could not process that." }]); })
      }
    } catch (e) {
      setAiChat(function(p) { return p.concat([{ role: "assistant", content: "Network error." }]); })
    }
    setAiLoading(false)
  }

  var totalBalance = meters.reduce(function(s, m) { return s + parseFloat(m.credit_balance || 0); }, 0)
  var onlineMeters = meters.filter(function(m) { return m.status === "online"; }).length

  function StatsCard(icon, label, value, color) {
    return (
      React.createElement("div", { style: { background: "var(--surface, #fff)", borderRadius: 16, padding: 20, border: "1px solid var(--border, #e2e8f0)", flex: 1, minWidth: 160 } },
        React.createElement("div", { style: { fontSize: 24, marginBottom: 8 } }, icon),
        React.createElement("div", { style: { fontSize: 12, color: "var(--text-secondary, #64748b)", marginBottom: 4 } }, label),
        React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color: color || "var(--text, #1e293b)" } }, value)
      )
    )
  }

  return (
    React.createElement("div", { style: { padding: 24, maxWidth: 1100, margin: "0 auto" } },

      // Welcome Banner
      React.createElement("div", { style: { background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #3b82f6 100%)", borderRadius: 20, padding: 28, marginBottom: 24, color: "white", position: "relative", overflow: "hidden" } },
        React.createElement("div", { style: { position: "absolute", right: -20, top: -20, fontSize: 120, opacity: 0.1 } }, "⚡"),
        React.createElement("h2", { style: { fontSize: 22, fontWeight: 700, margin: 0 } }, "Welcome back, " + (user?.name || user?.email || "Customer") + "!"),
        React.createElement("p", { style: { fontSize: 14, opacity: 0.8, marginTop: 8, maxWidth: 500, lineHeight: 1.5 } },
          "Manage your prepaid electricity accounts, purchase credits via OTA, transfer between meters, and access your transaction history."
        )
      ),

      // Stats Row
      React.createElement("div", { style: { display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" } },
        StatsCard("⚡", "Total Credit", totalBalance.toFixed(2) + " kWh", "#3b82f6"),
        StatsCard("📟", "Registered Meters", meters.length.toString(), "#10b981"),
        StatsCard("🟢", "Online", onlineMeters + "/" + meters.length, onlineMeters > 0 ? "#10b981" : "#ef4444"),
        StatsCard("📊", "Recent Txns", recentTx.length.toString(), "#8b5cf6")
      ),

      // Two-column layout
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 } },

        // Left: Meters
        React.createElement("div", { style: { background: "var(--surface, #fff)", borderRadius: 16, padding: 24, border: "1px solid var(--border, #e2e8f0)" } },
          React.createElement("h3", { style: { fontSize: 16, fontWeight: 700, margin: "0 0 16px 0", color: "var(--text, #1e293b)" } }, "Your Meters"),
          loading ? React.createElement("p", { style: { textAlign: "center", padding: 20, fontSize: 13, color: "var(--text-secondary)" } }, "Loading...") :
          meters.length === 0 ? React.createElement("p", { style: { textAlign: "center", padding: 30, fontSize: 13, color: "var(--text-secondary)" } }, "No meters registered. Contact your utility provider.") :
          meters.map(function(m, i) {
            return React.createElement("div", { key: i, style: { padding: 16, borderRadius: 12, border: "1px solid var(--border, #e2e8f0)", marginBottom: 12, background: m.status === "online" ? "rgba(16,185,129,0.03)" : "rgba(100,116,139,0.03)" } },
              React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
                React.createElement("div", null,
                  React.createElement("div", { style: { fontSize: 15, fontWeight: 700, color: "var(--text, #1e293b)", fontFamily: "monospace" } }, m.meter_number),
                  React.createElement("div", { style: { fontSize: 12, color: "var(--text-secondary)", marginTop: 2 } }, m.location || "Location not set")
                ),
                React.createElement("div", { style: { textAlign: "right" } },
                  React.createElement("div", { style: { fontSize: 18, fontWeight: 700, color: "#3b82f6" } }, parseFloat(m.credit_balance || 0).toFixed(2) + " kWh"),
                  React.createElement("div", { style: { display: "inline-block", padding: "2px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, marginTop: 4, background: m.status === "online" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.1)", color: m.status === "online" ? "#10b981" : "#ef4444" } },
                    m.status === "online" ? "Online" : m.status === "offline" ? "Offline" : m.status
                  )
                )
              )
            )
          })
        ),

        // Right: Recent Transactions
        React.createElement("div", { style: { background: "var(--surface, #fff)", borderRadius: 16, padding: 24, border: "1px solid var(--border, #e2e8f0)" } },
          React.createElement("h3", { style: { fontSize: 16, fontWeight: 700, margin: "0 0 16px 0", color: "var(--text, #1e293b)" } }, "Recent Transactions"),
          loading ? React.createElement("p", { style: { textAlign: "center", padding: 20, fontSize: 13, color: "var(--text-secondary)" } }, "Loading...") :
          recentTx.length === 0 ? React.createElement("p", { style: { textAlign: "center", padding: 30, fontSize: 13, color: "var(--text-secondary)" } }, "No recent transactions. Buy electricity to see your history.") :
          React.createElement("div", { style: { overflowX: "auto" } },
            React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 12 } },
              React.createElement("thead", null,
                React.createElement("tr", null,
                  React.createElement("th", { style: { textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--border, #e2e8f0)", color: "var(--text-secondary)", fontWeight: 600 } }, "Date"),
                  React.createElement("th", { style: { textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--border, #e2e8f0)", color: "var(--text-secondary)", fontWeight: 600 } }, "Type"),
                  React.createElement("th", { style: { textAlign: "right", padding: "8px 12px", borderBottom: "1px solid var(--border, #e2e8f0)", color: "var(--text-secondary)", fontWeight: 600 } }, "kWh"),
                  React.createElement("th", { style: { textAlign: "center", padding: "8px 12px", borderBottom: "1px solid var(--border, #e2e8f0)", color: "var(--text-secondary)", fontWeight: 600 } }, "Status")
                )
              ),
              React.createElement("tbody", null,
                recentTx.map(function(t, i) {
                  return React.createElement("tr", { key: i },
                    React.createElement("td", { style: { padding: "8px 12px", borderBottom: "1px solid var(--border, #e2e8f0)", color: "var(--text, #1e293b)", fontSize: 11 } }, new Date(t.created_at).toLocaleDateString()),
                    React.createElement("td", { style: { padding: "8px 12px", borderBottom: "1px solid var(--border, #e2e8f0)", color: "var(--text, #1e293b)" } }, t.type),
                    React.createElement("td", { style: { padding: "8px 12px", borderBottom: "1px solid var(--border, #e2e8f0)", textAlign: "right", color: "var(--text, #1e293b)" } }, (t.amount_kwh || 0).toFixed(2)),
                    React.createElement("td", { style: { padding: "8px 12px", borderBottom: "1px solid var(--border, #e2e8f0)", textAlign: "center" } },
                      React.createElement("span", { style: { display: "inline-block", padding: "2px 8px", borderRadius: 8, fontSize: 10, fontWeight: 600, background: t.status === "completed" ? "rgba(16,185,129,0.15)" : t.status === "reversed" ? "rgba(239,68,68,0.15)" : "rgba(234,179,8,0.15)", color: t.status === "completed" ? "#10b981" : t.status === "reversed" ? "#ef4444" : "#eab308" } }, t.status)
                    )
                  )
                })
              )
            )
          )
        )
      ),

      // AI Assistant Floating Button
      React.createElement("div", { style: { position: "fixed", bottom: 24, right: 24, zIndex: 1000 } },
        showAI && React.createElement("div", { style: { width: 360, background: "var(--surface, #fff)", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", border: "1px solid var(--border, #e2e8f0)", marginBottom: 12, overflow: "hidden" } },
          React.createElement("div", { style: { background: "#1e3a5f", color: "white", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" } },
            React.createElement("span", { style: { fontWeight: 600, fontSize: 14 } }, "AI Assistant"),
            React.createElement("button", { onClick: function() { setShowAI(false); }, style: { background: "none", border: "none", color: "white", cursor: "pointer", fontSize: 18 } }, "×")
          ),
          React.createElement("div", { style: { height: 300, overflowY: "auto", padding: 12, fontSize: 13, lineHeight: 1.5 } },
            aiChat.length === 0 && React.createElement("p", { style: { color: "var(--text-secondary)", textAlign: "center", padding: 20 } }, "Ask me anything about your energy system!"),
            aiChat.map(function(msg, i) {
              return React.createElement("div", { key: i, style: { marginBottom: 12, padding: 10, borderRadius: 10, background: msg.role === "user" ? "rgba(59,130,246,0.08)" : "rgba(100,116,139,0.05)", whiteSpace: "pre-wrap" } },
                React.createElement("div", { style: { fontWeight: 600, fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 } }, msg.role === "user" ? "You" : "AI Assistant"),
                msg.content
              )
            }),
            aiLoading && React.createElement("p", { style: { textAlign: "center", color: "var(--text-secondary)", fontSize: 12 } }, "Thinking...")
          ),
          React.createElement("div", { style: { padding: 12, borderTop: "1px solid var(--border, #e2e8f0)", display: "flex", gap: 8 } },
            React.createElement("input", { value: aiMessage, onChange: function(e) { setAiMessage(e.target.value); }, onKeyDown: function(e) { if (e.key === "Enter") askAI(); }, placeholder: "Ask a question...", style: { flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border, #e2e8f0)", fontSize: 13, outline: "none" } }),
            React.createElement("button", { onClick: askAI, disabled: aiLoading, style: { padding: "8px 16px", borderRadius: 8, border: "none", background: aiLoading ? "rgba(59,130,246,0.5)" : "#3b82f6", color: "white", fontSize: 13, cursor: "pointer" } }, "Send")
          )
        ),
        React.createElement("button", { onClick: function() { setShowAI(!showAI); }, style: { width: 56, height: 56, borderRadius: "50%", border: "none", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "white", fontSize: 24, cursor: "pointer", boxShadow: "0 4px 16px rgba(59,130,246,0.4)" } }, "🤖")
      )
    )
  )
}

export default ClientDashboard
