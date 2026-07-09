import React, { useState } from "react"

export default function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("https://stanfliet-ota-api.onrender.com/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })
      if (!res.ok) throw new Error("Invalid credentials")
      onLogin()
    } catch (err) {
      setError(err.message || "Login failed. Try: admin@stanfliet-ota.com / admin123")
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)"
    }}>
      <div style={{
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(30px) saturate(180%)",
        WebkitBackdropFilter: "blur(30px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 24,
        padding: 48,
        width: 420,
        maxWidth: "90vw",
        boxShadow: "0 25px 60px rgba(0,0,0,0.5)"
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
          <h1 style={{ color: "white", fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em" }}>Stanfliet OTA</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginTop: 4 }}>Over-The-Air Energy Management System</p>
        </div>
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              padding: 12, background: "rgba(252,129,129,0.1)",
              border: "1px solid rgba(252,129,129,0.2)",
              borderRadius: 12, color: "#fc8181",
              fontSize: 13, marginBottom: 16
            }}>
              {error}
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, display: "block", marginBottom: 6 }}>Email</label>
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
                outline: "none"
              }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, display: "block", marginBottom: 6 }}>Password</label>
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
                outline: "none"
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 12,
              border: "none",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
              color: "white",
              transition: "all 0.3s ease"
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div style={{ textAlign: "center", marginTop: 24, color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
          <p>Demo: admin@stanfliet-ota.com / admin123</p>
          <p style={{ marginTop: 4 }}>NERSA MYPD6 Tariff Prevention System</p>
        </div>
      </div>
    </div>
  )
}
