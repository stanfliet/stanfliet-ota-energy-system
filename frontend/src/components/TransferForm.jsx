import React, { useState } from "react"

const API_BASE = "https://stanfliet-ota-api.onrender.com"
const AUTH_TOKEN_KEY = "stanfliet_auth_token"

export default function TransferForm() {
  const [step, setStep] = useState("form")
  const [formData, setFormData] = useState({
    source_meter: "",
    destination_meter: "",
    kwh: 10,
    reason: ""
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [reversalId, setReversalId] = useState("")
  const [reversalResult, setReversalResult] = useState(null)

  const getToken = function() { return localStorage.getItem(AUTH_TOKEN_KEY); }

  const handleTransfer = async function(e) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      if (formData.kwh > 50) { throw new Error("Transfer limit: max 50 kWh per transaction"); }
      var token = getToken()
      var res = await fetch(API_BASE + "/api/v1/p2p/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify(formData)
      })
      if (!res.ok) { var errData = await res.json(); throw new Error(errData.error || "Transfer failed"); }
      var data = await res.json()
      setResult(data)
      setStep("result")
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const handleReversal = async function() {
    setLoading(true)
    setError("")
    try {
      if (!reversalId) { throw new Error("Enter a transaction ID to reverse"); }
      var token = getToken()
      var res = await fetch(API_BASE + "/api/v1/reversal", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({
          transaction_id: reversalId,
          reason: formData.reason || "Customer request",
          type: "auto"
        })
      })
      if (!res.ok) { var errData = await res.json(); throw new Error(errData.error || "Reversal failed"); }
      var data = await res.json()
      setReversalResult(data)
      setStep("reversal-done")
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <div onClick={function() { setStep("form"); setResult(null); }} style={{
          padding: "8px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
          background: step === "form" ? "#3b82f6" : "var(--surface, #fff)", color: step === "form" ? "white" : "var(--text-secondary, #64748b)",
          border: "1px solid var(--border, #e2e8f0)"
        }}>Send Credit</div>
        <div onClick={function() { setStep("reversal"); setReversalResult(null); }} style={{
          padding: "8px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
          background: step === "reversal" ? "#ef4444" : "var(--surface, #fff)", color: step === "reversal" ? "white" : "var(--text-secondary, #64748b)",
          border: "1px solid var(--border, #e2e8f0)"
        }}>Reverse Transaction</div>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: 12, marginBottom: 20, color: "#ef4444", fontSize: 13 }}>
          {error}
        </div>
      )}

      {step === "form" && !result && (
        <form onSubmit={handleTransfer} style={{ background: "var(--surface, #fff)", borderRadius: 16, padding: 24, border: "1px solid var(--border, #e2e8f0)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 20px 0", color: "var(--text, #1e293b)" }}>
            Peer-to-Peer Credit Transfer
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary, #64748b)", marginBottom: 20, lineHeight: 1.5 }}>
            Transfer prepaid electricity credits directly to another registered meter.
            Credits are delivered in real-time via OTA with RSA-2048 signed commands.
            Limit: 50 kWh per transaction, 200 kWh per day.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #64748b)", display: "block", marginBottom: 4 }}>Source Meter *</label>
              <input value={formData.source_meter} onChange={function(e) { setFormData(function(p) { return Object.assign({}, p, { source_meter: e.target.value }); }); }}
                placeholder="SM-2026-0001" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border, #e2e8f0)", fontSize: 13, background: "var(--surface, #fff)", color: "var(--text, #1e293b)", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #64748b)", display: "block", marginBottom: 4 }}>Destination Meter *</label>
              <input value={formData.destination_meter} onChange={function(e) { setFormData(function(p) { return Object.assign({}, p, { destination_meter: e.target.value }); }); }}
                placeholder="SM-2026-0002" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border, #e2e8f0)", fontSize: 13, background: "var(--surface, #fff)", color: "var(--text, #1e293b)", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #64748b)", display: "block", marginBottom: 4 }}>Units (kWh) *</label>
              <input type="number" value={formData.kwh} min="1" max="50" onChange={function(e) { setFormData(function(p) { return Object.assign({}, p, { kwh: parseFloat(e.target.value) || 0 }); }); }}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border, #e2e8f0)", fontSize: 13, background: "var(--surface, #fff)", color: "var(--text, #1e293b)", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #64748b)", display: "block", marginBottom: 4 }}>Max 50 kWh per tx</label>
              <div style={{ padding: "10px 12px", fontSize: 12, color: formData.kwh > 50 ? "#ef4444" : formData.kwh > 40 ? "#eab308" : "#10b981" }}>
                {formData.kwh > 50 ? "Exceeds limit!" : formData.kwh > 40 ? "Near limit" : "Within limit"}
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading || formData.kwh > 50}
            style={{ marginTop: 20, width: "100%", padding: "14px 24px", borderRadius: 12, border: "none",
              background: loading ? "rgba(139,92,246,0.5)" : "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
              color: "white", fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Transferring Credits..." : "Send Credits via OTA"}
          </button>
        </form>
      )}

      {step === "result" && result && (
        <div style={{ background: "var(--surface, #fff)", borderRadius: 16, padding: 24, border: "1px solid var(--border, #e2e8f0)" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🔄</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#8b5cf6", margin: 0 }}>Transfer Initiated!</h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary, #64748b)", marginTop: 4 }}>Credits are being transferred via OTA in real-time</p>
          </div>

          <div style={{ border: "1px dashed var(--border, #e2e8f0)", borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 13, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary, #64748b)" }}>Transfer ID:</span>
              <span style={{ fontWeight: 600, color: "var(--text, #1e293b)" }}>{result.transfer_id}</span>
            </div>
            <div style={{ fontSize: 13, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary, #64748b)" }}>From:</span>
              <span style={{ fontWeight: 600, color: "#ef4444" }}>{result.source_meter}</span>
            </div>
            <div style={{ fontSize: 13, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary, #64748b)" }}>To:</span>
              <span style={{ fontWeight: 600, color: "#10b981" }}>{result.destination_meter}</span>
            </div>
            <div style={{ fontSize: 13, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary, #64748b)" }}>Units:</span>
              <span style={{ fontWeight: 700, color: "#8b5cf6", fontSize: 16 }}>{result.kwh} kWh</span>
            </div>
            <div style={{ fontSize: 13, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary, #64748b)" }}>Status:</span>
              <span style={{ fontWeight: 600, color: "#eab308" }}>{result.status}</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={function() { setStep("reversal"); setReversalId(result.transfer_id); }}
              style={{ flex: 1, padding: "10px 20px", borderRadius: 10, border: "1px solid #ef4444", background: "transparent", color: "#ef4444", fontSize: 13, cursor: "pointer" }}>
              Reverse Transfer
            </button>
            <button onClick={function() { setResult(null); setStep("form"); }}
              style={{ flex: 1, padding: "10px 20px", borderRadius: 10, border: "none", background: "#8b5cf6", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              New Transfer
            </button>
          </div>
        </div>
      )}

      {step === "reversal" && (
        <div style={{ background: "var(--surface, #fff)", borderRadius: 16, padding: 24, border: "1px solid var(--border, #e2e8f0)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 20px 0", color: "#ef4444" }}>
            Reverse Transaction
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary, #64748b)", marginBottom: 20, lineHeight: 1.5 }}>
            Reversals will undo the transfer/purchase and adjust meter balances accordingly.
            Enter the transaction ID (e.g., P2P-... or TXN-...) to reverse.
          </p>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #64748b)", display: "block", marginBottom: 4 }}>Transaction ID to Reverse</label>
            <input value={reversalId} onChange={function(e) { setReversalId(e.target.value); }}
              placeholder="P2P-1700000000-xxxx or TXN-..." style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border, #e2e8f0)", fontSize: 13, background: "var(--surface, #fff)", color: "var(--text, #1e293b)", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginTop: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #64748b)", display: "block", marginBottom: 4 }}>Reason for Reversal</label>
            <textarea value={formData.reason} onChange



cd C:\Users\k2020\Desktop\stanfliet-ota-energy-system

# Complete TransferForm component
$transferForm = @'
import React, { useState } from "react"

const API_BASE = "https://stanfliet-ota-api.onrender.com"
const AUTH_TOKEN_KEY = "stanfliet_auth_token"

export default function TransferForm() {
  const [step, setStep] = useState("form")
  const [formData, setFormData] = useState({
    source_meter: "",
    destination_meter: "",
    kwh: 10,
    reason: ""
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [reversalId, setReversalId] = useState("")
  const [reversalResult, setReversalResult] = useState(null)
  const [transferHistory, setTransferHistory] = useState([])

  const getToken = function() { return localStorage.getItem(AUTH_TOKEN_KEY); }

  const handleTransfer = async function(e) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      if (formData.kwh > 50) { throw new Error("Transfer limit: max 50 kWh per transaction"); }
      var token = getToken()
      var res = await fetch(API_BASE + "/api/v1/p2p/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify(formData)
      })
      if (!res.ok) { var errData = await res.json(); throw new Error(errData.error || "Transfer failed"); }
      var data = await res.json()
      setResult(data)
      setStep("result")
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  const handleReversal = async function() {
    setLoading(true)
    setError("")
    try {
      if (!reversalId) { throw new Error("Enter a transaction ID to reverse"); }
      var token = getToken()
      var res = await fetch(API_BASE + "/api/v1/reversal", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ transaction_id: reversalId, reason: formData.reason || "Customer request", type: "auto" })
      })
      if (!res.ok) { var errData = await res.json(); throw new Error(errData.error || "Reversal failed"); }
      var data = await res.json()
      setReversalResult(data)
      setStep("reversal-done")
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  const loadHistory = async function() {
    setLoading(true)
    try {
      var token = getToken()
      var res = await fetch(API_BASE + "/api/v1/transactions?limit=30", {
        headers: { Authorization: "Bearer " + token }
      })
      if (res.ok) { var data = await res.json(); setTransferHistory(data.transactions || []); }
    } catch (err) {}
    setLoading(false)
  }

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <div onClick={function() { setStep("form"); setResult(null); }} style={{ padding: "8px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", background: step === "form" ? "#3b82f6" : "var(--surface, #fff)", color: step === "form" ? "white" : "var(--text-secondary, #64748b)", border: "1px solid var(--border, #e2e8f0)" }}>Send Credit</div>
        <div onClick={function() { setStep("reversal"); setReversalResult(null); }} style={{ padding: "8px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", background: step === "reversal" ? "#ef4444" : "var(--surface, #fff)", color: step === "reversal" ? "white" : "var(--text-secondary, #64748b)", border: "1px solid var(--border, #e2e8f0)" }}>Reverse Transaction</div>
        <div onClick={function() { setStep("history"); loadHistory(); }} style={{ padding: "8px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", background: step === "history" ? "#8b5cf6" : "var(--surface, #fff)", color: step === "history" ? "white" : "var(--text-secondary, #64748b)", border: "1px solid var(--border, #e2e8f0)" }}>History</div>
      </div>

      {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: 12, marginBottom: 20, color: "#ef4444", fontSize: 13 }}>{error}</div>}

      {step === "form" && !result && (
        <form onSubmit={handleTransfer} style={{ background: "var(--surface, #fff)", borderRadius: 16, padding: 24, border: "1px solid var(--border, #e2e8f0)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 20px 0", color: "var(--text, #1e293b)" }}>Peer-to-Peer Credit Transfer</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary, #64748b)", marginBottom: 20, lineHeight: 1.5 }}>Transfer prepaid electricity credits to another registered meter. Real-time OTA delivery with RSA-2048 signed commands. Limit: 50 kWh per transaction, 200 kWh per day.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #64748b)", display: "block", marginBottom: 4 }}>Source Meter *</label>
              <input value={formData.source_meter} onChange={function(e) { setFormData(function(p) { return Object.assign({}, p, { source_meter: e.target.value }); }); }} placeholder="SM-2026-0001" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border, #e2e8f0)", fontSize: 13, background: "var(--surface, #fff)", color: "var(--text, #1e293b)", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #64748b)", display: "block", marginBottom: 4 }}>Destination Meter *</label>
              <input value={formData.destination_meter} onChange={function(e) { setFormData(function(p) { return Object.assign({}, p, { destination_meter: e.target.value }); }); }} placeholder="SM-2026-0002" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border, #e2e8f0)", fontSize: 13, background: "var(--surface, #fff)", color: "var(--text, #1e293b)", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary, #64748b)", display: "block", marginBottom: 4 }}>Units (kWh) *</label>
              <input type="number" value={formData.kwh} min="1" max="50" onChange={function(e) { setFormData(function(p) { return Object.assign({}, p, { kwh: parseFloat(e.target.value) || 0 }); }); }} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border, #e2e8f0)", fontSize: 13, background: "var(--surface, #fff)", color: "var(--text, #1e293b)", boxSizing: "border-box" }} />
            </div>
            <div>
              <div style={{ padding: "10px 12px", fontSize: 12, color: formData.kwh > 50 ? "#ef4444" : formData.kwh > 40 ? "#eab308" : "#10b981" }}>{formData.kwh > 50 ? "Exceeds limit!" : formData.kwh > 40 ? "Near limit" : "Within limit"}</div>
            </div>
          </div>
          <button type="submit" disabled={loading || formData.kwh > 50} style={{ marginTop: 20, width: "100%", padding: "14px 24px", borderRadius: 12, border: "none", background: loading ? "rgba(139,92,246,0.5)" : "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)", color: "white", fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>{loading ? "Transferring Credits..." : "Send Credits via OTA"}</button>
        </form>
      )}

      {step === "result" && result && (
        <div style={{ background: "var(--surface, #fff)", borderRadius: 16, padding: 24, border: "1px solid var(--border, #e2e8f0)" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🔄</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#8b5cf6", margin: 0 }}>Transfer Initiated!</h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary, #64748b)", marginTop: 4 }}>Credits being transferred via OTA in real-time</p>
          </div>
          <div style={{ border: "1px dashed var(--border, #e2e8f0)", borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 13, marginBottom: 8, display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-secondary, #64748b)" }}>Transfer ID:</span><span style={{ fontWeight: 600, color: "var(--text, #1e293b)" }}>{result.transfer_id}</span></div>
            <div style={{ fontSize: 13, marginBottom: 8, display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-secondary, #64748b)" }}>From:</span><span style={{ fontWeight: 600, color: "#ef4444" }}>{result.source_meter}</span></div>
            <div style={{ fontSize: 13, marginBottom: 8, display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-secondary, #64748b)" }}>To:</span><span style={{ fontWeight: 600, color: "#10b981" }}>{result.destination_meter}</span></div>
            <div style={{ fontSize: 13, marginBottom: 8, display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-secondary, #64748b)" }}>Units:</span><span style={{ fontWeight: 700, color: "#8b5cf6", fontSize: 16 }}>{result.kwh} kWh</span></div>
            <div style={{ fontSize: 13, display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-secondary, #64748b)" }}>Status:</span><span style={{ fontWeight: 600, color: "#eab308" }}>{result.status}</span></div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={function() { setStep("reversal"); setReversalId(result.transfer_id); }} style={{ flex: 1, padding: "10px 20px", borderRadius: 10, border: "1px solid #ef4444", background: "transparent", color: "#ef4444", fontSize: 13, cursor: "pointer" }}>Reverse Transfer</button>
            <button onClick={function() { setResult(null); setStep("form"); }} style={{ flex: 1, padding: "10px 20px", borderRadius: 10, border: "none", background: "#8b5cf6", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>New Transfer</button>
          </div>
        </div>
      )}

      {step === "reversal" && (
        <div style={{ background: "var(--surface, #fff)", borderRadius: 16, padding: 24, border: "1px solid var(--border, #e2e8f0)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 20px 0", color: "#ef4444" }}>Reverse Transaction</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary, #64748b)", marginBottom: 20, lineHeight: 1.5 }}>Enter the transaction ID (e.g., P2P-..., TXN-..., REV-...) to reverse it.</p>
          <input value={reversalId} onChange={function(e) { setReversalId(e.target.value); }} placeholder="P2P-1700000000-xxxx or TXN-..." style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border, #e2e8f0)", fontSize: 13, background: "var(--surface, #fff)", color: "var(--text, #1e293b)", boxSizing: "border-box" }} />
          <textarea value={formData.reason} onChange={function(e) { setFormData(function(p) { return Object.assign({}, p, { reason: e.target.value }); }); }} placeholder="Reason for reversal..." rows="3" style={{ width: "100%", marginTop: 12, padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border, #e2e8f0)", fontSize: 13, background: "var(--surface, #fff)", color: "var(--text, #1e293b)", boxSizing: "border-box", resize: "vertical" }} />
          <button onClick={handleReversal} disabled={loading} style={{ marginTop: 16, width: "100%", padding: "14px 24px", borderRadius: 12, border: "none", background: loading ? "rgba(239,68,68,0.5)" : "#ef4444", color: "white", fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>{loading ? "Processing Reversal..." : "Reverse Transaction"}</button>
        </div>
      )}

      {step === "reversal-done" && reversalResult && (
        <div style={{ background: "var(--surface, #fff)", borderRadius: 16, padding: 24, border: "1px solid var(--border, #e2e8f0)" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>↩️</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#ef4444", margin: 0 }}>Transaction Reversed!</h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary, #64748b)", marginTop: 4 }}>Meter balances have been adjusted</p>
          </div>
          <p style={{ fontSize: 13, color: "var(--text, #1e293b)", textAlign: "center" }}>Reversal ID: {reversalResult.reversal?.reversal_id || reversalResult.reversal_id}</p>
          <button onClick={function() { setStep("form"); setReversalResult(null); }} style={{ width: "100%", marginTop: 16, padding: "10px 20px", borderRadius: 10, border: "none", background: "#3b82f6", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Back</button>
        </div>
      )}

      {step === "history" && (
        <div style={{ background: "var(--surface, #fff)", borderRadius: 16, padding: 24, border: "1px solid var(--border, #e2e8f0)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 16px 0", color: "var(--text, #1e293b)" }}>Transfer & Transaction History</h2>
          {transferHistory.length === 0 ? <p style={{ fontSize: 13, color: "var(--text-secondary, #64748b)", textAlign: "center", padding: 20 }}>No transactions found.</p> : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead><tr><th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--border, #e2e8f0)", color: "var(--text-secondary, #64748b)", fontWeight: 600 }}>ID</th><th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--border, #e2e8f0)", color: "var(--text-secondary, #64748b)", fontWeight: 600 }}>From</th><th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--border, #e2e8f0)", color: "var(--text-secondary, #64748b)", fontWeight: 600 }}>To</th><th style={{ textAlign: "right", padding: "8px 12px", borderBottom: "1px solid var(--border, #e2e8f0)", color: "var(--text-secondary, #64748b)", fontWeight: 600 }}>kWh</th><th style={{ textAlign: "center", padding: "8px 12px", borderBottom: "1px solid var(--border, #e2e8f0)", color: "var(--text-secondary, #64748b)", fontWeight: 600 }}>Status</th></tr></thead>
                <tbody>{transferHistory.map(function(t, i) { return (<tr key={i}><td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border, #e2e8f0)", color: "var(--text, #1e293b)", fontSize: 10 }}>{t.transfer_id || t.reversal_id || t.command_id}</td><td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border, #e2e8f0)", color: "var(--text, #1e293b)" }}>{t.source_meter || "N/A"}</td><td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border, #e2e8f0)", color: "var(--text, #1e293b)" }}>{t.destination_meter || "N/A"}</td><td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border, #e2e8f0)", textAlign: "right", color: "var(--text, #1e293b)" }}>{t.amount_kwh || t.kwh || "—"}</td><td style={{ padding: "8px 12px", borderBottom: "1px solid var(--border, #e2e8f0)", textAlign: "center" }}><span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 8, fontSize: 10, fontWeight: 600, background: t.reversed ? "rgba(239,68,68,0.15)" : t.status === "completed" ? "rgba(16,185,129,0.15)" : "rgba(234,179,8,0.15)", color: t.reversed ? "#ef4444" : t.status === "completed" ? "#10b981" : "#eab308" }}>{t.reversed ? "Reversed" : t.status}</span></td></tr>); })}</tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
