import React, { useState } from "react"

const API_BASE = "https://stanfliet-ota-api.onrender.com"
const AUTH_TOKEN_KEY = "stanfliet_auth_token"
const AUTH_REFRESH_KEY = "stanfliet_refresh_token"
const USER_DATA_KEY = "stanfliet_user_data"

export default function LoginForm({ onLogin }) {
  const [mode, setMode] = useState("signin")
  const [formData, setFormData] = useState({
    email: "", password: "", name: "", phone: "", confirmPassword: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  const validateEmail = function(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSignIn = async function(e) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (!formData.email || !formData.password) {
        throw new Error("Email and password are required")
      }

      // Add retry logic for backend cold start
      let retries = 0;
      const maxRetries = 2;
      let lastError = null;

      while (retries <= maxRetries) {
        try {
          const res = await fetch(API_BASE + "/api/v1/auth/signin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: formData.email, password: formData.password }),
            signal: AbortSignal.timeout(30000)
          });

          if (res.ok) {
            const data = await res.json()
            // Store tokens
            localStorage.setItem(AUTH_TOKEN_KEY, data.accessToken)
            localStorage.setItem(AUTH_REFRESH_KEY, data.refreshToken)
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user))

            // Also store meters
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
            throw new Error(lastError) // Don't retry on auth failure
          }

          if (res.status === 503 || res.status === 502) {
            // Cold start - retry
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
      if (!formData.email || !formData.password || !formData.name) {
        throw new Error("Email, password, and name are required")
      }
      if (!validateEmail(formData.email)) {
        throw new Error("Please enter a valid email address")
      }
      if (formData.password.length < 8) {
        throw new Error("Password must be at least 8 characters")
      }
      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match")
      }

      const res = await fetch(API_BASE + "/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone
        }),
        signal: AbortSignal.timeout(30000)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Sign up failed")
      }

      // Auto-login after signup
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
      // Google/GitHub OAuth would redirect to Supabase Auth
      // For now, show info message
      setError(provider + " sign-in coming soon. Use email/password for now.")
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const updateField = function(field, value) {
    setFormData(function(prev) { return Object.assign({}, prev, { [field]: value }); });
  }

  return (
    <div style={{
      width: "100%", maxWidth: 420, margin: "0 auto",
      background: "var(--surface, #fff)", borderRadius: 20,
      padding: 36, boxShadow: "0 20px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
      border: "1px solid var(--border, #e2e8f0)"
    }}>
      {/* Logo & Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>⚡</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text, #1e293b)", margin: 0 }}>
          Stanfliet OTA
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary, #64748b)", marginTop: 4 }}>
          Prepaid Electricity Management System
        </p>
      </div>

      {/* Tab Buttons */}
      <div style={{ display: "flex", background: "var(--bg, #f1f5f9)", borderRadius: 12, padding: 4, marginBottom: 24 }}>
        <button onClick={function() { setMode("signin"); setError(""); }}
          style={{
            flex: 1, padding: "10px 16px", borderRadius: 10, border: "none",
            background: mode === "signin" ? "var(--surface, #fff)" : "transparent",
            color: mode === "signin" ? "var(--text, #1e293b)" : "var(--text-secondary, #64748b)",
            fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all 0.2s",
            boxShadow: mode === "signin" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
          }}>
          Sign In
        </button>
        <button onClick={function() { setMode("signup"); setError(""); }}
          style={{
            flex: 1, padding: "10px 16px", borderRadius: 10, border: "none",
            background: mode === "signup" ? "var(--surface, #fff)" : "transparent",
            color: mode === "signup" ? "var(--text, #1e293b)" : "var(--text-secondary, #64748b)",
            fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all 0.2s",
            boxShadow: mode === "signup" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
          }}>
          Create Account
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: 12, padding: "10px 14px", marginBottom: 20,
          color: "#ef4444", fontSize: 13, lineHeight: 1.4
        }}>
          {error}
        </div>
      )}

      {/* Sign In Form */}
      {mode === "signin" && (
        <form onSubmit={handleSignIn}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #64748b)", display: "block", marginBottom: 6 }}>
              Email Address
            </label>
            <input type="email" value={formData.email}
              onChange={function(e) { updateField("email", e.target.value); }}
              placeholder="you@example.com"
              autoComplete="email"
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 10,
                border: "1px solid var(--border, #e2e8f0)", fontSize: 14,
                background: "var(--surface, #fff)", color: "var(--text, #1e293b)",
                outline: "none", boxSizing: "border-box", transition: "border-color 0.2s"
              }}
              onFocus={function(e) { e.target.style.borderColor = "#3b82f6"; }}
              onBlur={function(e) { e.target.style.borderColor = ""; }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #64748b)", display: "block", marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input type={showPassword ? "text" : "password"} value={formData.password}
                onChange={function(e) { updateField("password", e.target.value); }}
                placeholder="Enter your password"
                autoComplete="current-password"
                style={{
                  width: "100%", padding: "12px 42px 12px 14px", borderRadius: 10,
                  border: "1px solid var(--border, #e2e8f0)", fontSize: 14,
                  background: "var(--surface, #fff)", color: "var(--text, #1e293b)",
                  outline: "none", boxSizing: "border-box", transition: "border-color 0.2s"
                }}
                onFocus={function(e) { e.target.style.borderColor = "#3b82f6"; }}
                onBlur={function(e) { e.target.style.borderColor = ""; }}
              />
              <button type="button" onClick={function() { setShowPassword(!showPassword); }}
                style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-secondary, #64748b)"
                }}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {loading && (
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "var(--text-secondary, #64748b)" }}>
                {loading ? "Signing in... (cold start may take 30s)" : ""}
              </div>
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{
              width: "100%", padding: "14px 24px", borderRadius: 12, border: "none",
              background: loading ? "rgba(59,130,246,0.5)" : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              color: "white", fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s", marginBottom: 16
            }}>
            {loading ? "Signing In..." : "Sign In"}
          </button>

          <div style={{ textAlign: "center" }}>
            <button type="button" onClick={function() { setMode("signup"); setError(""); }}
              style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
              Don't have an account? Create one
            </button>
          </div>
        </form>
      )}

      {/* Sign Up Form */}
      {mode === "signup" && (
        <form onSubmit={handleSignUp}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #64748b)", display: "block", marginBottom: 6 }}>
              Full Name *
            </label>
            <input type="text" value={formData.name}
              onChange={function(e) { updateField("name", e.target.value); }}
              placeholder="John Doe"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border, #e2e8f0)", fontSize: 14, background: "var(--surface, #fff)", color: "var(--text, #1e293b)", outline: "none", boxSizing: "border-box" }}
              onFocus={function(e) { e.target.style.borderColor = "#3b82f6"; }}
              onBlur={function(e) { e.target.style.borderColor = ""; }}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #64748b)", display: "block", marginBottom: 6 }}>
              Email Address *
            </label>
            <input type="email" value={formData.email}
              onChange={function(e) { updateField("email", e.target.value); }}
              placeholder="you@example.com"
              autoComplete="email"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border, #e2e8f0)", fontSize: 14, background: "var(--surface, #fff)", color: "var(--text, #1e293b)", outline: "none", boxSizing: "border-box" }}
              onFocus={function(e) { e.target.style.borderColor = "#3b82f6"; }}
              onBlur={function(e) { e.target.style.borderColor = ""; }}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #64748b)", display: "block", marginBottom: 6 }}>
              Phone Number
            </label>
            <input type="tel" value={formData.phone}
              onChange={function(e) { updateField("phone", e.target.value); }}
              placeholder="+27 82 123 4567"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border, #e2e8f0)", fontSize: 14, background: "var(--surface, #fff)", color: "var(--text, #1e293b)", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #64748b)", display: "block", marginBottom: 6 }}>
              Password *
            </label>
            <input type={showPassword ? "text" : "password"} value={formData.password}
              onChange={function(e) { updateField("password", e.target.value); }}
              placeholder="Min 8 characters"
              autoComplete="new-password"
              style={{ width: "100%", padding: "12px 42px 12px 14px", borderRadius: 10, border: "1px solid var(--border, #e2e8f0)", fontSize: 14, background: "var(--surface, #fff)", color: "var(--text, #1e293b)", outline: "none", boxSizing: "border-box" }}
            />
            {formData.password && formData.password.length > 0 && (
              <div style={{ marginTop: 4, fontSize: 11, color: formData.password.length >= 8 ? "#10b981" : "#ef4444" }}>
                {formData.password.length >= 8 ? "Strong enough" : "At least 8 characters needed"}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #64748b)", display: "block", marginBottom: 6 }}>
              Confirm Password *
            </label>
            <input type={showPassword ? "text" : "password"} value={formData.confirmPassword}
              onChange={function(e) { updateField("confirmPassword", e.target.value); }}
              placeholder="Repeat password"
              autoComplete="new-password"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border, #e2e8f0)", fontSize: 14, background: "var(--surface, #fff)", color: "var(--text, #1e293b)", outline: "none", boxSizing: "border-box" }}
            />
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <div style={{ marginTop: 4, fontSize: 11, color: "#ef4444" }}>Passwords do not match</div>
            )}
          </div>

          <button type="submit" disabled={loading}
            style={{
              width: "100%", padding: "14px 24px", borderRadius: 12, border: "none",
              background: loading ? "rgba(16,185,129,0.5)" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "white", fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s", marginBottom: 16
            }}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: 13, color: "var(--text-secondary, #64748b)" }}>Already have an account? </span>
            <button type="button" onClick={function() { setMode("signin"); setError(""); }}
              style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
              Sign In
            </button>
          </div>
        </form>
      )}

      {/* Footer */}
      <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border, #e2e8f0)", textAlign: "center" }}>
        <p style={{ fontSize: 11, color: "var(--text-secondary, #94a3b8)", margin: 0 }}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
        <p style={{ fontSize: 11, color: "var(--text-secondary, #94a3b8)", marginTop: 4 }}>
          Patent Pending &copy; 2026 Stanfliet OTA Energy Systems
        </p>
      </div>
    </div>
  )
}
