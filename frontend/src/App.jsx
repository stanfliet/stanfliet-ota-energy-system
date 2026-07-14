import React, { useState, useEffect } from "react"
import LoginForm from "./components/LoginForm"
import ClientDashboard from "./components/ClientDashboard"
import ITVMDashboard from "./components/ITVMDashboard"
import TariffSubmission from "./components/TariffSubmission"
import PurchaseForm from "./components/PurchaseForm"
import TransferForm from "./components/TransferForm"
import MeterDashboard from "./components/MeterDashboard"

const AUTH_TOKEN_KEY = "stanfliet_auth_token"
const AUTH_USER_KEY = "stanfliet_user_data"
const AUTH_METERS_KEY = "stanfliet_meters"

function App() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [meters, setMeters] = useState([])
  const [activeTab, setActiveTab] = useState("dashboard")
  const [loading, setLoading] = useState(true)

  useEffect(function() {
    var savedToken = localStorage.getItem(AUTH_TOKEN_KEY)
    var savedUser = localStorage.getItem(AUTH_USER_KEY)
    var savedMeters = localStorage.getItem(AUTH_METERS_KEY)
    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
        if (savedMeters) setMeters(JSON.parse(savedMeters))
      } catch (e) {}
    }
    setLoading(false)
  }, [])

  const handleLogin = function(userData, authToken, metersData) {
    setUser(userData)
    setToken(authToken)
    setMeters(metersData || [])
    localStorage.setItem(AUTH_TOKEN_KEY, authToken)
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData))
    if (metersData) localStorage.setItem(AUTH_METERS_KEY, JSON.stringify(metersData))
  }

  const handleLogout = function() {
    setUser(null)
    setToken(null)
    setMeters([])
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
    localStorage.removeItem(AUTH_METERS_KEY)
    setActiveTab("dashboard")
  }

  if (loading) {
    return React.createElement("div", { style: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "#f59e0b", fontSize: "20px" } }, "Loading...")
  }

  if (!user || !token) {
    return React.createElement(LoginForm, { onLogin: handleLogin })
  }

  var tabs = [
    { key: "dashboard", label: "Dashboard" },
    { key: "purchase", label: "Buy Electricity" },
    { key: "transfer", label: "Send Credits" },
    { key: "meters", label: "My Meters" }
  ]

  if (user.role === "admin" || user.role === "operator" || user.role === "auditor") {
    tabs.push({ key: "itvm", label: "Tariff ITVM" })
    tabs.push({ key: "submit-tariff", label: "New Tariff" })
  }

  return React.createElement("div", { style: { minHeight: "100vh", background: "#0f172a", color: "#f1f5f9" } },
    React.createElement("header", { style: { background: "#1e293b", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #334155" } },
      React.createElement("div", null,
        React.createElement("h1", { style: { margin: 0, fontSize: "20px", color: "#f59e0b" } }, "Stanfliet OTA Energy"),
        React.createElement("small", { style: { color: "#64748b" } }, "PREPAID ELECTRICITY SYSTEM")
      ),
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "12px" } },
        React.createElement("span", { style: { color: "#94a3b8", fontSize: "14px" } }, user.name || user.email),
        React.createElement("span", { style: { background: "#334155", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", textTransform: "uppercase", color: "#f59e0b" } }, user.role || "customer"),
        React.createElement("button", { onClick: handleLogout, style: { background: "transparent", border: "1px solid #ef4444", color: "#ef4444", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" } }, "Sign Out")
      )
    ),
    React.createElement("nav", { style: { display: "flex", gap: "8px", padding: "12px 24px", background: "#1e293b", borderBottom: "1px solid #334155", overflowX: "auto" } },
      tabs.map(function(tab) {
        return React.createElement("button", {
          key: tab.key,
          onClick: function() { setActiveTab(tab.key) },
          style: {
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "600",
            background: activeTab === tab.key ? "#f59e0b" : "transparent",
            color: activeTab === tab.key ? "#0f172a" : "#94a3b8",
            whiteSpace: "nowrap"
          }
        }, tab.label)
      })
    ),
    React.createElement("main", { style: { padding: "24px" } },
      activeTab === "dashboard" ? React.createElement(ClientDashboard, { user: user, token: token }) : null,
      activeTab === "purchase" ? React.createElement(PurchaseForm, { user: user, token: token }) : null,
      activeTab === "transfer" ? React.createElement(TransferForm, { user: user, token: token }) : null,
      activeTab === "meters" ? React.createElement(MeterDashboard, { user: user, token: token }) : null,
      activeTab === "itvm" ? React.createElement(ITVMDashboard, { user: user, token: token }) : null,
      activeTab === "submit-tariff" ? React.createElement(TariffSubmission, { user: user, token: token }) : null
    )
  )
}

export default App
