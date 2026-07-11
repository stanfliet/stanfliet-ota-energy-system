import React, { useState } from "react"

const API_BASE = "https://stanfliet-ota-api.onrender.com"
const AUTH_TOKEN_KEY = "stanfliet_auth_token"
const AUTH_REFRESH_KEY = "stanfliet_refresh_token"
const USER_DATA_KEY = "stanfliet_user_data"

export default function LoginForm({ onLogin }) {
  const [mode, setMode] = useState("signin")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    meter_number: "",
    secret_key: "",
    confirmPassword: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const validateEmail = function(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const validateMeterNumber = function(meter) {
    return /^\d{11}$/.test(meter)
  }

  const checkAdminEmail = function(email) {
    if (!email) return false
    const localPart = email.split('@')[0].toLowerCase()
    return localPart.endsWith('ota')
  }

  const handleSignIn = async function(e) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (!formData.email || !formData.password) {
        throw new Error("Email and password are required")
      }

      let retries = 0
      const maxRetries = 2
      let lastError = null

      while (retries <= maxRetries) {
        try {
          const res = await fetch(API_BASE + "/api/v1/auth/signin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: formData.email, password: formData.password }),
            signal: AbortSignal.timeout(30000)
          })

          if (res.ok) {
            const data = await res.json()
            localStorage.setItem(AUTH_TOKEN_KEY, data.accessToken)
            localStorage.setItem(AUTH_REFRESH_KEY, data.refreshToken)
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user))

            if (data.meters) {
              localStorage.setItem("stanfliet_meters", JSON.stringify(data.meters))
            }

            if (onLogin) {
              onLogin(data.user, data.accessToken, data.meters || [])
            }
            return
          }

          const errData = await res.json()
          lastError = errData.error || "Sign in failed"

          if (res.status === 401) {
            throw new Error(lastError)
          }

          if (res.status === 503 || res.status === 502) {
            retries++
            if (retries <= maxRetries) {
              await new Promise(r => setTimeout(r, 5000))
              continue
            }
          }

          throw new Error(lastError)
        } catch (fetchErr) {
          if (fetchErr.name === "TimeoutError" || fetchErr.name === "AbortError") {
            retries++
            if (retries <= maxRetries) {
              await new Promise(r => setTimeout(r, 5000))
              continue
            }
            throw new Error("Server is starting up. Please try again.")
          }
          throw fetchErr
        }
      }

      throw new Error(lastError || "Unable to connect. Please try again.")
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const handleSignUp = async function(e) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (!formData.email || !formData.password || !formData.name || !formData.meter_number) {
        throw new Error("Email, password, name, and 11-digit meter number are required")
      }
      if (!validateEmail(formData.email)) {
        throw new Error("Please enter a valid email address")
      }
      if (!validateMeterNumber(formData.meter_number)) {
        throw new Error("Meter number must be exactly 11 digits")
      }
      if (formData.password.length < 8) {
        throw new Error("Password must be at least 8 characters")
      }
      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match")
      }

      const body = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        meter_number: formData.meter_number
      }

      if (formData.secret_key && formData.secret_key.trim() !== "") {
        body.secret_key = formData.secret_key.trim().toLowerCase()
      }

      const res = await fetch(API_BASE + "/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Sign up failed")
      }

      localStorage.setItem(AUTH_TOKEN_KEY, data.accessToken)
      localStorage.setItem(AUTH_REFRESH_KEY, data.refreshToken)
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user))

      if (data.meter) {
        localStorage.setItem("stanfliet_meters", JSON.stringify([data.meter]))
      }

      if (onLogin) {
        onLogin(data.user, data.accessToken, data.meter ? [data.meter] : [])
      }
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const handleSocialSignIn = async function(provider) {
    setError("")
    setLoading(true)
    try {
      setError(provider + " sign-in coming soon. Use email/password for now.")
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const updateField = function(field, value) {
    setFormData(function(prev) {
      const updated = Object.assign({}, prev, { [field]: value })

      if (field === "email") {
        const adminDetected = checkAdminEmail(value)
        setIsAdmin(adminDetected)
      }

      return updated
    })
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      padding: "20px",
      fontFamily: "'Segoe UI', system-ui, sans-serif"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "460px",
        background: "#1e293b",
        borderRadius: "16px",
        padding: "40px 32px",
        boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
        border: "1px solid #334155"
      }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            fontSize: "28px",
            color: "#fff",
            boxShadow: "0 0 20px rgba(245,158,11,0.3)"
          }}>
            ⚡
          </div>
          <h1 style={{ color: "#f1f5f9", fontSize: "24px", fontWeight: "700", margin: "0 0 6px", letterSpacing: "0.5px" }}>
            Stanfliet OTA
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "14px", margin: "0" }}>
            Prepaid Electricity Management System
          </p>
        </div>

        <div style={{ display: "flex", gap: "0", marginBottom: "24px", background: "#0f172a", borderRadius: "10px", padding: "4px" }}>
          <button onClick={() => { setMode("signin"); setError("") }} style={{
            flex: "1", padding: "12px 16px", border: "none", borderRadius: "8px", cursor: "pointer",
            fontSize: "14px", fontWeight: "600",
            background: mode === "signin" ? "#f59e0b" : "transparent",
            color: mode === "signin" ? "#0f172a" : "#64748b", transition: "all 0.2s"
          }}>
            Sign In
          </button>
          <button onClick={() => { setMode("signup"); setError("") }} style={{
            flex: "1", padding: "12px 16px", border: "none", borderRadius: "8px", cursor: "pointer",
            fontSize: "14px", fontWeight: "600",
            background: mode === "signup" ? "#f59e0b" : "transparent",
            color: mode === "signup" ? "#0f172a" : "#64748b", transition: "all 0.2s"
          }}>
            Create Account
          </button>
        </div>

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "8px", padding: "12px 16px", color: "#fca5a5",
            fontSize: "13px", marginBottom: "16px", textAlign: "center"
          }}>
            {error}
          </div>
        )}

        {mode === "signin" && (
          <form onSubmit={handleSignIn}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", color: "#94a3b8", fontSize: "13px", fontWeight: "500", marginBottom: "6px" }}>
                Email Address
              </label>
              <input type="email" value={formData.email} onChange={(e) => updateField("email", e.target.value)}
                placeholder="you@example.com" required
                style={{ width: "100%", padding: "12px 14px", background: "#0f172a", border: "1px solid #334155",
                  borderRadius: "8px", color: "#f1f5f9", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", color: "#94a3b8", fontSize: "13px", fontWeight: "500", marginBottom: "6px" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input type={showPassword ? "text" : "password"} value={formData.password}
                  onChange={(e) => updateField("password", e.target.value)} placeholder="Enter your password" required
                  style={{ width: "100%", padding: "12px 14px", background: "#0f172a", border: "1px solid #334155",
                    borderRadius: "8px", color: "#f1f5f9", fontSize: "14px", outline: "none", boxSizing: "border-box", paddingRight: "60px" }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)",
                    background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: "12px", fontWeight: "600", padding: "4px 8px" }}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            {loading && (
              <div style={{ textAlign: "center", color: "#f59e0b", fontSize: "13px", marginBottom: "12px" }}>
                {loading ? "Signing in... (cold start may take 30s)" : ""}
              </div>
            )}
            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "14px",
                background: loading ? "#475569" : "linear-gradient(135deg, #f59e0b, #d97706)",
                border: "none", borderRadius: "8px", color: "#fff", fontSize: "15px", fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s", marginTop: "8px" }}>
              {loading ? "Signing In..." : "Sign In"}
            </button>
            <p style={{ textAlign: "center", color: "#64748b", fontSize: "13px", marginTop: "20px" }}>
              Don't have an account?{" "}
              <button type="button" onClick={() => { setMode("signup"); setError("") }}
                style={{ background: "transparent", border: "none", color: "#f59e0b", cursor: "pointer", fontWeight: "600", fontSize: "13px", padding: "0" }}>
                Create one
              </button>
            </p>
          </form>
        )}

        {mode === "signup" && (
          <form onSubmit={handleSignUp}>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", color: "#94a3b8", fontSize: "13px", fontWeight: "500", marginBottom: "6px" }}>Full Name *</label>
              <input type="text" value={formData.name} onChange={(e) => updateField("name", e.target.value)} placeholder="John Doe" required
                style={{ width: "100%", padding: "12px 14px", background: "#0f172a", border: "1px solid #334155",
                  borderRadius: "8px", color: "#f1f5f9", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", color: "#94a3b8", fontSize: "13px", fontWeight: "500", marginBottom: "6px" }}>Email Address *</label>
              <input type="email" value={formData.email} onChange={(e) => updateField("email", e.target.value)} placeholder="you@example.com" required
                style={{ width: "100%", padding: "12px 14px", background: "#0f172a", border: "1px solid #334155",
                  borderRadius: "8px", color: "#f1f5f9", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
              {isAdmin && (
                <div style={{ marginTop: "6px", padding: "6px 10px", background: "rgba(245,158,11,0.1)",
                  border: "1px solid rgba(245,158,11,0.3)", borderRadius: "6px", color: "#fbbf24", fontSize: "12px" }}>
                  🔑 Admin email pattern detected! You will be registered as admin.
                </div>
              )}
            </div>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", color: "#94a3b8", fontSize: "13px", fontWeight: "500", marginBottom: "6px" }}>Meter Number (11 digits) *</label>
              <input type="text" value={formData.meter_number}
                onChange={(e) => { const val = e.target.value.replace(/\D/g, "").slice(0, 11); updateField("meter_number", val) }}
                placeholder="12345678901" maxLength={11} required
                style={{ width: "100%", padding: "12px 14px", background: "#0f172a", border: "1px solid #334155",
                  borderRadius: "8px", color: "#f1f5f9", fontSize: "14px", outline: "none", boxSizing: "border-box",
                  fontFamily: "'Courier New', monospace", letterSpacing: "2px" }} />
              {formData.meter_number && formData.meter_number.length > 0 && (
                <div style={{ marginTop: "4px", fontSize: "11px",
                  color: formData.meter_number.length === 11 ? "#10b981" : "#ef4444" }}>
                  {formData.meter_number.length === 11 ? "✓ Valid 11-digit meter number" : formData.meter_number.length + "/11 digits entered"}
                </div>
              )}
            </div>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", color: "#94a3b8", fontSize: "13px", fontWeight: "500", marginBottom: "6px" }}>Phone Number (optional)</label>
              <input type="tel" value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="+27 123 456 789"
                style={{ width: "100%", padding: "12px 14px", background: "#0f172a", border: "1px solid #334155",
                  borderRadius: "8px", color: "#f1f5f9", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", color: "#94a3b8", fontSize: "13px", fontWeight: "500", marginBottom: "6px" }}>Password *</label>
              <input type={showPassword ? "text" : "password"} value={formData.password}
                onChange={(e) => updateField("password", e.target.value)} placeholder="At least 8 characters" required
                style={{ width: "100%", padding: "12px 14px", background: "#0f172a", border: "1px solid #334155",
                  borderRadius: "8px", color: "#f1f5f9", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
              {formData.password && formData.password.length > 0 && (
                <div style={{ marginTop: "4px", fontSize: "11px",
                  color: formData.password.length >= 8 ? "#10b981" : "#ef4444" }}>
                  {formData.password.length >= 8 ? "✓ Strong enough" : "At least 8 characters needed (" + formData.password.length + "/8)"}
                </div>
              )}
            </div>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", color: "#94a3b8", fontSize: "13px", fontWeight: "500", marginBottom: "6px" }}>Confirm Password *</label>
              <input type={showPassword ? "text" : "password"} value={formData.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)} placeholder="Repeat your password" required
                style={{ width: "100%", padding: "12px 14px", background: "#0f172a", border: "1px solid #334155",
                  borderRadius: "8px", color: "#f1f5f9", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <div style={{ marginTop: "4px", fontSize: "11px", color: "#ef4444" }}>Passwords do not match</div>
              )}
            </div>

            {/* Admin Secret Key Box */}
            <div style={{ marginBottom: "20px", padding: "14px", background: "rgba(245,158,11,0.05)",
              border: "1px dashed #475569", borderRadius: "8px" }}>
              <label style={{ display: "block", color: "#94a3b8", fontSize: "13px", fontWeight: "500", marginBottom: "6px" }}>
                Admin Secret Key (optional — for admin/operator accounts)
              </label>
              <input type="password" value={formData.secret_key}
                onChange={(e) => updateField("secret_key", e.target.value)} placeholder="Enter admin secret key"
                style={{ width: "100%", padding: "12px 14px", background: "#0f172a", border: "1px solid #334155",
                  borderRadius: "8px", color: "#f1f5f9", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
              {formData.secret_key && formData.secret_key.trim().toLowerCase() === "ota" && (
                <div style={{ marginTop: "6px", padding: "6px 10px", background: "rgba(245,158,11,0.15)",
                  border: "1px solid rgba(245,158,11,0.4)", borderRadius: "6px", color: "#fbbf24", fontSize: "12px", fontWeight: "600" }}>
                  🔐 Admin secret verified! You will be registered with admin privileges.
                </div>
              )}
              <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: "11px", lineHeight: "1.4" }}>
                Leave blank for a regular consumer account. Enter the correct secret key for admin access.
                Alternatively, ending your email with <strong style={{color: "#f59e0b"}}>"ota"</strong> (e.g., adminota@example.com) also grants admin.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <input type="checkbox" id="showPassSignup" checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
                style={{ accentColor: "#f59e0b", width: "16px", height: "16px" }} />
              <label htmlFor="showPassSignup" style={{ color: "#64748b", fontSize: "13px", cursor: "pointer" }}>
                Show passwords
              </label>
            </div>

            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "14px",
                background: loading ? "#475569" : "linear-gradient(135deg, #f59e0b, #d97706)",
                border: "none", borderRadius: "8px", color: "#fff", fontSize: "15px", fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>
            <p style={{ textAlign: "center", color: "#64748b", fontSize: "13px", marginTop: "20px" }}>
              Already have an account?{" "}
              <button type="button" onClick={() => { setMode("signin"); setError("") }}
                style={{ background: "transparent", border: "none", color: "#f59e0b", cursor: "pointer", fontWeight: "600", fontSize: "13px", padding: "0" }}>
                Sign In
              </button>
            </p>
          </form>
        )}

        <div style={{ textAlign: "center", marginTop: "30px", paddingTop: "20px", borderTop: "1px solid #334155" }}>
          <p style={{ color: "#475569", fontSize: "11px", margin: "0 0 4px" }}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
          <p style={{ color: "#334155", fontSize: "10px", margin: "0" }}>
            Patent Pending © 2026 Stanfliet OTA Energy Systems
          </p>
        </div>
      </div>
    </div>
  )
}
