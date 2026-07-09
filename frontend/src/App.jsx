import React, { useState, useEffect } from "react"
import Dashboard from "./components/Dashboard"
import TariffVerifier from "./components/TariffVerifier"
import MapView from "./components/MapView"
import AlertPanel from "./components/AlertPanel"
import InspectorDispatch from "./components/InspectorDispatch"
import ChannelMonitor from "./components/ChannelMonitor"
import PurchaseForm from "./components/PurchaseForm"
import TransferForm from "./components/TransferForm"
import PatentPDF from "./components/PatentPDF"
import LoginForm from "./components/LoginForm"
import ITVMDashboard from "./components/ITVMDashboard"
import TariffSubmission from "./components/TariffSubmission"

const THEME_KEY = "stanfliet-theme-preference"
const AUTH_TOKEN_KEY = "stanfliet_auth_token"
const AUTH_USER_KEY = "stanfliet_auth_user"

export default function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [activeView, setActiveView] = useState("dashboard")
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY)
    return saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "system" : "light")
  })

  // Check for existing auth on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(AUTH_TOKEN_KEY)
    const savedUser = localStorage.getItem(AUTH_USER_KEY)
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
      setAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      root.setAttribute("data-theme", prefersDark ? "dark" : "light")
    } else {
      root.setAttribute("data-theme", theme)
    }
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      if (theme === "system") {
        document.documentElement.setAttribute("data-theme", mq.matches ? "dark" : "light")
      }
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [theme])

  const cycleTheme = () => {
    const order = ["light", "dark", "system"]
    const idx = order.indexOf(theme)
    setTheme(order[(idx + 1) % order.length])
  }

  const themeIcon = theme === "light" ? "☀️" : theme === "dark" ? "🌙" : "🖥️"
  const themeLabel = theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System"

  const handleLogin = (newToken, newUser) => {
    setToken(newToken)
    setUser(newUser)
    setAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
    setToken(null)
    setUser(null)
    setAuthenticated(false)
  }

  if (!authenticated) {
    return <LoginForm onLogin={handleLogin} />
  }

  const navItems = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "tariff", icon: "✅", label: "Tariff Verifier" },
    { id: "itvm", icon: "🔒", label: "ITVM" },
    { id: "tariff-submit", icon: "📝", label: "Submit Tariff" },
    { id: "map", icon: "🗺️", label: "Map View" },
    { id: "alerts", icon: "🔔", label: "Alerts" },
    { id: "dispatch", icon: "🚐", label: "Dispatch" },
    { id: "channels", icon: "📡", label: "Channels" },
    { id: "purchase", icon: "💳", label: "Purchase" },
    { id: "transfer", icon: "🔄", label: "Transfer" },
    { id: "patent", icon: "📄", label: "Patent" }
  ]

  const renderView = () => {
    switch (activeView) {
      case "dashboard": return <Dashboard token={token} user={user} />
      case "tariff": return <TariffVerifier token={token} />
      case "itvm": return <ITVMDashboard token={token} />
      case "tariff-submit": return <TariffSubmission token={token} user={user} />
      case "map": return <MapView token={token} />
      case "alerts": return <AlertPanel token={token} />
      case "dispatch": return <InspectorDispatch token={token} />
      case "channels": return <ChannelMonitor token={token} />
      case "purchase": return <PurchaseForm token={token} />
      case "transfer": return <TransferForm token={token} />
      case "patent": return <PatentPDF />
      default: return <Dashboard token={token} user={user} />
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg, #f8fafc)",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <style>{
        :root { --bg: #f8fafc; --surface: #ffffff; --text: #1e293b; --text-secondary: #64748b; --border: #e2e8f0; --nav-bg: #0f172a; --nav-text: rgba(255,255,255,0.7); --nav-active: #3b82f6; --card-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        [data-theme="dark"] { --bg: #0f172a; --surface: #1e293b; --text: #f1f5f9; --text-secondary: #94a3b8; --border: #334155; --card-shadow: 0 1px 3px rgba(0,0,0,0.3); }
        body { margin: 0; background: var(--bg); color: var(--text); }
        * { transition: background-color 0.3s, color 0.3s, border-color 0.3s; }
      }</style>

      {/* Sidebar Navigation */}
      <div style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: 220,
        background: "var(--nav-bg, #0f172a)",
        padding: "20px 0",
        overflowY: "auto",
        zIndex: 100
      }}>
        <div style={{ padding: "0 16px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: 12 }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>⚡</div>
          <div style={{ color: "white", fontSize: 14, fontWeight: 700 }}>Stanfliet OTA</div>
        </div>

        {navItems.map(item => (
          <div
            key={item.id}
            onClick={() => setActiveView(item.id)}
            style={{
              padding: "10px 16px",
              margin: "2px 8px",
              borderRadius: 8,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 13,
              fontWeight: activeView === item.id ? 600 : 400,
              color: activeView === item.id ? "white" : "var(--nav-text, rgba(255,255,255,0.7))",
              background: activeView === item.id ? "var(--nav-active, #3b82f6)" : "transparent"
            }}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}

        <div style={{ padding: "16px", borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: 12 }}>
          <div
            onClick={cycleTheme}
            style={{
              cursor: "pointer",
              color: "var(--nav-text, rgba(255,255,255,0.7))",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 12
            }}
          >
            <span>{themeIcon}</span>
            <span>{themeLabel} Mode</span>
          </div>
          <div
            onClick={handleLogout}
            style={{
              cursor: "pointer",
              color: "rgba(255,255,255,0.5)",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <span>🚪</span>
            <span>Logout</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ marginLeft: 220, padding: 24 }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24
        }}>
          <h1 style={{
            fontSize: 24,
            fontWeight: 700,
            color: "var(--text, #1e293b)",
            margin: 0
          }}>
            {navItems.find(n => n.id === activeView)?.label || "Dashboard"}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text-secondary, #64748b)" }}>
              {user?.email || "admin@stanfliet-ota.com"}
            </span>
            <span style={{
              background: user?.role === "admin" ? "#3b82f6" : user?.role === "regulator" ? "#8b5cf6" : "#10b981",
              color: "white",
              padding: "2px 10px",
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 600
            }}>
              {user?.role || "Admin"}
            </span>
          </div>
        </div>

        {renderView()}
      </div>
    </div>
  )
}
