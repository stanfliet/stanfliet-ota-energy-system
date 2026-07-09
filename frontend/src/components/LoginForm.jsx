import React, { useState } from "react"

const API_BASE = "https://stanfliet-ota-api.onrender.com"
const AUTH_TOKEN_KEY = "stanfliet_auth_token"
const AUTH_USER_KEY = "stanfliet_auth_user"

export default function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Wake up the Render service (cold start mitigation)
  const wakeUpBackend = async () => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)
    try {
      await fetch(API_BASE + "/", { method: "GET", signal: controller.signal, mode: "cors" })
    } catch { /* cold start expected to fail */ }
    finally { clearTimeout(timeoutId) }
    await new Promise(r => setTimeout(r, 2000))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await wakeUpBackend()

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 35000)

      const res = await fetch(API_BASE + "/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
        mode: "cors"
      })
      clearTimeout(timeoutId)

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Invalid credentials")
      }

      const data = await res.json()

      // Store JWT token and user info
      localStorage.setItem(AUTH_TOKEN_KEY, data.token)
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user))

      onLogin(data.token, data.user)
    } catch (err) {
      if (err.name === "AbortError" || err.name === "TimeoutError") {
        setError("Server is waking up. Please wait 30 seconds and try again.")
      } else if (err.message === "Failed to fetch") {
        setError("Cannot reach the server. It may be starting up - try again in a moment.")
      } else {
        setError(err.message || "Login failed. Try: admin@stanfliet-ota.com / admin123")
      }
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <form onSubmit={handleSubmit} style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 24,
        padding: 48,
        width: "100%",
        maxWidth: 400,
        textAlign: "center",
        boxSizing: "border-box"
      }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>⚡</div>
        <h1 style={{ color: "white", fontSize: 28, fontWeight: 700, margin: "0 0 4px 0" }}>
          Stanfliet OTA
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: "0 0 32px 0" }}>
          Over-The-Air Energy Management System
        </p>

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.15)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 20,
            color: "#fca5a5",
            fontSize: 13,
            textAlign: "left"
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 16, textAlign: "left" }}>
          <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="admin@stanfliet-ota.com"
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              color: "white",
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ marginBottom: 24, textAlign: "left" }}>
          <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="admin123"
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              color: "white",
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box"
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px 24px",
            borderRadius: 12,
            border: "none",
            background: loading ? "rgba(59,130,246,0.5)" : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            color: "white",
            fontSize: 16,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.2s"
          }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 24 }}>
          Demo: admin@stanfliet-ota.com / admin123
        </p>
        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>
          NERSA MYPD6 Tariff Prevention System
        </p>
      </form>
    </div>
  )
}
