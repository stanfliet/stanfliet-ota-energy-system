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

const THEME_KEY = "stanfliet-theme-preference"

export default function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [activeView, setActiveView] = useState("dashboard")
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY)
    return saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "system" : "light")
  })

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

  if (!authenticated) return <LoginForm onLogin={() => setAuthenticated(true)} />

  const navItems = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "tariff", icon: "✅", label: "Tariff Verifier" },
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
      case "dashboard": return <Dashboard />
      case "tariff": return <TariffVerifier />
      case "map": return <MapView />
      case "alerts": return <AlertPanel />
      case "dispatch": return <InspectorDispatch />
      case "channels": return <ChannelMonitor />
      case "purchase": return <PurchaseForm />
      case "transfer": return <TransferForm />
      case "patent": return <PatentPDF />
      default: return <Dashboard />
    }
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">⚡ Stanfliet OTA</div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={"nav-item" + (activeView === item.id ? " active" : "")}
              onClick={() => setActiveView(item.id)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <button className="theme-toggle" onClick={cycleTheme}>
          <span>{themeIcon}</span>
          <span>{themeLabel} Mode</span>
        </button>
        <button
          className="nav-item"
          style={{ marginTop: 8 }}
          onClick={() => setAuthenticated(false)}
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </aside>
      <main className="main-content">
        <div className="top-bar">
          <h1>{navItems.find(n => n.id === activeView)?.label || "Dashboard"}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text-light)" }}>admin@stanfliet-ota.com</span>
            <span className="badge online">Admin</span>
          </div>
        </div>
        {renderView()}
      </main>
    </div>
  )
}
