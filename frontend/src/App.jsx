import React, { useState, useEffect } from "react"
import LoginForm from "./components/LoginForm"
import Dashboard from "./components/Dashboard"
import ITVMDashboard from "./components/ITVMDashboard"
import TariffSubmission from "./components/TariffSubmission"
import PurchaseForm from "./components/PurchaseForm"
import TransferForm from "./components/TransferForm"
import MeterDashboard from "./components/MeterDashboard"

const AUTH_TOKEN_KEY = "stanfliet_auth_token"
const AUTH_USER_KEY = "stanfliet_user_data"

function App() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [loading, setLoading] = useState(true)

  useEffect(function() {
    var savedToken = localStorage.getItem(AUTH_TOKEN_KEY)
    var savedUser = localStorage.getItem(AUTH_USER_KEY)
    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
      } catch (e) {}
    }
    setLoading(false)
  }, [])

  const handleLogin = function(userData, authToken) {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem(AUTH_TOKEN_KEY, authToken)
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData))
  }

  const handleLogout = function() {
    setUser(null)
    setToken(null)
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
    setActiveTab("dashboard")
  }

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center",
        background: "var(--bg, #f8fafc)", color: "var(--text, #1e293b)", fontSize: 14
      }}>
        Loading...
      </div>
    )
  }

  if (!user || !token) {
    return (
      <div style={{
        minHeight: "100vh", background: "var(--bg, #f8fafc)",
        display: "flex", justifyContent: "center", alignItems: "center",
        padding: 24
      }}>
        <LoginForm onLogin={handleLogin} />
      </div>
    )
  }

  var tabs = [
    { key: "dashboard", label: "Dashboard", icon: "📊" },
    { key: "purchase", label: "Buy Electricity", icon: "⚡" },
    { key: "transfer", label: "Send Credits", icon: "🔄" },
    { key: "meters", label: "Meters", icon: "🔌" },
    { key: "itvm", label: "Tariff ITVM", icon: "🔐" },
    { key: "submit-tariff", label: "New Tariff", icon: "📝" }
  ]

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg, #f8fafc)" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)",
        padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "sticky", top: 0, zIndex: 100
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>⚡</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "white" }}>Stanfliet OTA Energy</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: 1 }}>PREPAID ELECTRICITY SYSTEM</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{user.email || user.name}</span>
          <button onClick={handleLogout} style={{
            padding: "6px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.3)",
            background: "transparent", color: "white", fontSize: 12, cursor: "pointer"
          }}>Sign Out</button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: "flex", gap: 4, padding: "12px 24px", overflowX: "auto",
        background: "var(--surface, #fff)", borderBottom: "1px solid var(--border, #e2e8f0)"
      }}>
        {tabs.map(function(tab) {
          var isActive = activeTab === tab.key
          return (
            <div key={tab.key} onClick={function() { setActiveTab(tab.key); }} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10,
              fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", cursor: "pointer",
              background: isActive ? "#3b82f6" : "transparent",
              color: isActive ? "white" : "var(--text-secondary, #64748b)",
              transition: "all 0.2s"
            }}>
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </div>
          )
        })}
      </div>

      {/* Page Content */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 8px" }}>
        {activeTab === "dashboard" && <Dashboard user={user} token={token} />}
        {activeTab === "purchase" && <PurchaseForm />}
        {activeTab === "transfer" && <TransferForm />}
        {activeTab === "meters" && <MeterDashboard />}
        {activeTab === "itvm" && <ITVMDashboard />}
        {activeTab === "submit-tariff" && <TariffSubmission />}
      </div>
    </div>
  )
}

export default App
