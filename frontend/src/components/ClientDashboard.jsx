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

      const profileRes = await fetch(API_BASE + "/api/v1/auth/profile", {
        headers: { Authorization: "Bearer " + tokenVal }
      })
      if (profileRes.ok) {
        const profileData = await profileRes.json()
        setMeters(profileData.meters || [])
      }

      const txRes = await fetch(API_BASE + "/api/v1/transactions?limit=10", {
        headers: { Authorization: "Bearer " + tokenVal }
      })
      if (txRes.ok) {
        const txData = await txRes.json()
        setRecentTx(txData.transactions || [])
      }

      setAiSession("session_" + (user?.id || Date.now()) + "_" + Date.now())
    } catch (e) {
      console.error("Dashboard load error:", e)
    }
    setLoading(false)
  }

  const askAI = async function() {
    if (!aiMessage.trim() || aiLoading) return
    setAiLoading(true)
    const userMessage = aiMessage
    setAiMessage("")
    setAiChat(function(prev) { return prev.concat([{ role: "user", content: userMessage }]) })
    try {
      const tokenVal = token || localStorage.getItem(AUTH_TOKEN_KEY)
      const res = await fetch(API_BASE + "/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + tokenVal },
        body: JSON.stringify({ message: userMessage, session_id: aiSession })
      })
      if (res.ok) {
        const data = await res.json()
        setAiChat(function(prev) { return prev.concat([{ role: "assistant", content: data.response || data.message || "No response" }]) })
      } else {
        setAiChat(function(prev) { return prev.concat([{ role: "assistant", content: "Sorry, I could not process your request." }]) })
      }
    } catch (e) {
      setAiChat(function(prev) { return prev.concat([{ role: "assistant", content: "Connection error. Please try again." }]) })
    }
    setAiLoading(false)
  }

  const totalCredits = meters.reduce(function(sum, m) { return sum + (m.credit_balance || 0) }, 0)
  const activeMeters = meters.filter(function(m) { return m.status === "active" || m.status === "online" }).length

  if (loading) {
    return React.createElement("div", { style: { display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" } },
      React.createElement("div", { style: { textAlign: "center" } },
        React.createElement("div", { style: { width: 40, height: 40, border: "3px solid #e2e8f0", borderTop: "3px solid #3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" } }),
        React.createElement("p", { style: { color: "var(--text-secondary)", fontSize: 14 } }, "Loading dashboard...")
      )
    )
  }

  return React.createElement("div", { style: { padding: "24px 32px", maxWidth: 1200, margin: "0 auto" } },
    React.createElement("h1", { style: { fontSize: 24, fontWeight: 700, color: "var(--text, #1e293b)", margin: "0 0 8px 0" } }, "Hello, " + (user?.name || "Customer")),
    React.createElement("p", { style: { fontSize: 14, color: "var(--text-secondary)", margin: "0 0 24px 0" } }, "Welcome to your energy dashboard. Here is your account overview."),

    // Stats Cards
    React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 } },
      React.createElement("div", { style: { background: "var(--surface, #fff)", borderRadius: 12, padding: 20, border: "1px solid var(--border, #e2e8f0)" } },
        React.createElement("div", { style: { fontSize: 12, color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 } }, "Total Credit Balance"),
        React.createElement("div", { style: { fontSize: 28, fontWeight: 700, color: "#10b981" } }, "R " + totalCredits.toFixed(2))
      ),
      React.createElement("div", { style: { background: "var(--surface, #fff)", borderRadius: 12, padding: 20, border: "1px solid var(--border, #e2e8f0)" } },
        React.createElement("div", { style: { fontSize: 12, color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 } }, "Active Meters"),
        React.createElement("div", { style: { fontSize: 28, fontWeight: 700, color: "#3b82f6" } }, activeMeters + " / " + meters.length)
      ),
      React.createElement("div", { style: { background: "var(--surface, #fff)", borderRadius: 12, padding: 20, border: "1px solid var(--border, #e2e8f0)" } },
        React.createElement("div", { style: { fontSize: 12, color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 } }, "Account Type"),
        React.createElement("div", { style: { fontSize: 28, fontWeight: 700, color: "#8b5cf6", textTransform: "capitalize" } }, user?.role || "Customer")
      )
    ),

    // Recent Transactions
    React.createElement("div", { style: { background: "var(--surface, #fff)", borderRadius: 12, border: "1px solid var(--border, #e2e8f0)", overflow: "hidden" } },
      React.createElement("div", { style: { padding: "16px 20px", borderBottom: "1px solid var(--border, #e2e8f0)" } },
        React.createElement("h3", { style: { fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text, #1e293b)" } }, "Recent Transactions")
      ),
      recentTx.length === 0
        ? React.createElement("div", { style: { padding: 40, textAlign: "center", color: "var(--text-secondary)", fontSize: 13 } }, "No transactions yet. Purchase electricity to get started.")
        : React.createElement("table", { style: { width: "100%", borderCollapse: "collapse" } },
            React.createElement("thead", null,
              React.createElement("tr", null,
                React.createElement("th", { style: { textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--border, #e2e8f0)", color: "var(--text-secondary)", fontWeight: 600, fontSize: 11 } }, "Date"),
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
    ),

    // AI Assistant Floating Button
    React.createElement("div", { style: { position: "fixed", bottom: 24, right: 24, zIndex: 1000 } },
      showAI && React.createElement("div", { style: { width: 360, background: "var(--surface, #fff)", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", border: "1px solid var(--border, #e2e8f0)", marginBottom: 12, overflow: "hidden" } },
        React.createElement("div", { style: { background: "#1e3a5f", color: "white", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" } },
          React.createElement("span", { style: { fontWeight: 600, fontSize: 14 } }, "AI Assistant"),
          React.createElement("button", { onClick: function() { setShowAI(false) }, style: { background: "none", border: "none", color: "white", cursor: "pointer", fontSize: 18 } }, "\u00d7")
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
          React.createElement("input", { value: aiMessage, onChange: function(e) { setAiMessage(e.target.value) }, onKeyDown: function(e) { if (e.key === "Enter") askAI() }, placeholder: "Ask a question...", style: { flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border, #e2e8f0)", fontSize: 13, outline: "none" } }),
          React.createElement("button", { onClick: askAI, disabled: aiLoading, style: { padding: "8px 16px", borderRadius: 8, border: "none", background: aiLoading ? "rgba(59,130,246,0.5)" : "#3b82f6", color: "white", fontSize: 13, cursor: "pointer" } }, "Send")
        )
      ),
      React.createElement("button", { onClick: function() { setShowAI(!showAI) }, style: { width: 56, height: 56, borderRadius: "50%", border: "none", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "white", fontSize: 24, cursor: "pointer", boxShadow: "0 4px 16px rgba(59,130,246,0.4)" } }, "\ud83e\udd16")
    )
  )
}

export default ClientDashboard
