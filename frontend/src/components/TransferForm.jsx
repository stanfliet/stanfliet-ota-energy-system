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
    <div>
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        <button onClick={() => { setStep("form"); setResult(null); setError(""); }}
          style={{ flex: 1, padding: "10px 16px", borderRadius: "8px", border: step === "form" || step === "result" ? "2px solid #8b5cf6" : "1px solid #334155",
            background: step === "form" || step === "result" ? "rgba(139,92,246,0.15)" : "transparent",
            color: step === "form" || step === "result" ? "#8b5cf6" : "#94a3b8", fontWeight: "600", cursor: "pointer", fontSize: "14px" }}
        >Send Credit</button>
        <button onClick={() => { setStep("reversal"); setReversalResult(null); setError(""); }}
          style={{ flex: 1, padding: "10px 16px", borderRadius: "8px", border: step === "reversal" || step === "reversal-done" ? "2px solid #f59e0b" : "1px solid #334155",
            background: step === "reversal" || step === "reversal-done" ? "rgba(245,158,11,0.15)" : "transparent",
            color: step === "reversal" || step === "reversal-done" ? "#f59e0b" : "#94a3b8", fontWeight: "600", cursor: "pointer", fontSize: "14px" }}
        >Reverse Transaction</button>
      </div>
      {error && (
        <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", color: "#fca5a5", fontSize: "14px" }}>
          {error}
        </div>
      )}
      {step === "form" && !result && (
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#f1f5f9", marginBottom: "8px" }}>Peer-to-Peer Credit Transfer</h2>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "24px", lineHeight: "1.5" }}>
            Transfer prepaid electricity credits directly to another registered meter.
          </p>
          <form onSubmit={handleTransfer}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#cbd5e1", marginBottom: "6px" }}>Source Meter *</label>
            <input type="text" value={formData.source_meter} onChange={(e) => setFormData({ ...formData, source_meter: e.target.value })}
              placeholder="12345678901" maxLength={11} required
              style={{ width: "100%", padding: "12px 14px", background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "#f1f5f9", fontSize: "14px", outline: "none", boxSizing: "border-box", marginBottom: "16px", fontFamily: "'Courier New', monospace", letterSpacing: "2px" }}
            />
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#cbd5e1", marginBottom: "6px" }}>Destination Meter *</label>
            <input type="text" value={formData.destination_meter} onChange={(e) => setFormData({ ...formData, destination_meter: e.target.value })}
              placeholder="98765432109" maxLength={11} required
              style={{ width: "100%", padding: "12px 14px", background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "#f1f5f9", fontSize: "14px", outline: "none", boxSizing: "border-box", marginBottom: "16px", fontFamily: "'Courier New', monospace", letterSpacing: "2px" }}
            />
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#cbd5e1", marginBottom: "6px" }}>Units (kWh) *</label>
            <input type="number" value={formData.kwh} onChange={(e) => setFormData({ ...formData, kwh: Math.min(50, Math.max(1, parseInt(e.target.value) || 1)) })}
              min="1" max="50" required
              style={{ width: "100%", padding: "12px 14px", background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "#f1f5f9", fontSize: "14px", outline: "none", boxSizing: "border-box", marginBottom: "6px" }}
            />
            <div style={{ fontSize: "12px", color: formData.kwh > 50 ? "#ef4444" : formData.kwh > 40 ? "#eab308" : "#10b981", marginBottom: "16px" }}>
              {formData.kwh > 50 ? "Exceeds limit!" : formData.kwh > 40 ? "Near limit" : "Within limit"}
            </div>
            <button type="submit" disabled={loading || formData.kwh > 50}
              style={{ marginTop: 20, width: "100%", padding: "14px 24px", borderRadius: 12, border: "none",
                background: loading ? "rgba(139,92,246,0.5)" : "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                color: "white", fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}
            >{loading ? "Transferring Credits..." : "Send Credits via OTA"}</button>
          </form>
        </div>
      )}
      {step === "result" && result && (
        <div style={{ textAlign: "center", padding: "32px 16px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔄</div>
          <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#f1f5f9", marginBottom: "8px" }}>Transfer Initiated!</h2>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "24px" }}>Credits being transferred via OTA in real-time</p>
          <div style={{ background: "#1e293b", borderRadius: "8px", padding: "16px", textAlign: "left", marginBottom: "24px" }}>
            <div style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "4px" }}>Transfer ID: <span style={{ color: "#f1f5f9", fontWeight: "600" }}>{result.transfer_id}</span></div>
            <div style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "4px" }}>From: <span style={{ color: "#f1f5f9" }}>{result.source_meter}</span></div>
            <div style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "4px" }}>To: <span style={{ color: "#f1f5f9" }}>{result.destination_meter}</span></div>
            <div style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "4px" }}>Units: <span style={{ color: "#f1f5f9", fontWeight: "600" }}>{result.kwh} kWh</span></div>
            <div style={{ fontSize: "13px", color: "#94a3b8" }}>Status: <span style={{ color: "#10b981", fontWeight: "600" }}>{result.status}</span></div>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={() => { setStep("reversal"); setError(""); }}
              style={{ flex: 1, padding: "12px 20px", borderRadius: "8px", border: "1px solid #f59e0b", background: "transparent", color: "#f59e0b", fontWeight: "600", cursor: "pointer" }}>Reverse Transfer</button>
            <button onClick={() => { setStep("form"); setResult(null); setFormData({ source_meter: "", destination_meter: "", kwh: 10, reason: "" }); }}
              style={{ flex: 1, padding: "12px 20px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)", color: "white", fontWeight: "600", cursor: "pointer" }}>New Transfer</button>
          </div>
        </div>
      )}
      {step === "reversal" && (
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#f1f5f9", marginBottom: "8px" }}>Reverse Transaction</h2>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "24px" }}>Reversals will undo the transfer and adjust meter balances.</p>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#cbd5e1", marginBottom: "6px" }}>Transaction ID to Reverse</label>
            <input type="text" value={reversalId} onChange={(e) => setReversalId(e.target.value)}
              placeholder="P2P-XXXXXXXXXX" required
              style={{ width: "100%", padding: "12px 14px", background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "#f1f5f9", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#cbd5e1", marginBottom: "6px" }}>Reason for Reversal</label>
            <textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="e.g., Wrong meter, duplicate transaction"
              rows={3}
              style={{ width: "100%", padding: "12px 14px", background: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "#f1f5f9", fontSize: "14px", outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }}
            />
          </div>
          <button onClick={handleReversal} disabled={loading}
            style={{ width: "100%", padding: "14px 24px", borderRadius: 12, border: "none",
              background: loading ? "rgba(245,158,11,0.5)" : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              color: "white", fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Processing Reversal..." : "Reverse Transaction"}
          </button>
        </div>
      )}
      {step === "reversal-done" && reversalResult && (
        <div style={{ textAlign: "center", padding: "32px 16px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
          <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#f1f5f9", marginBottom: "8px" }}>Reversal Complete</h2>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "24px" }}>Transaction has been reversed successfully</p>
          <div style={{ background: "#1e293b", borderRadius: "8px", padding: "16px", textAlign: "left", marginBottom: "24px" }}>
            <div style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "4px" }}>Original TXN: <span style={{ color: "#f1f5f9" }}>{reversalResult.original_transaction_id}</span></div>
            <div style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "4px" }}>Reversal ID: <span style={{ color: "#f1f5f9", fontWeight: "600" }}>{reversalResult.reversal_id}</span></div>
            <div style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "4px" }}>Amount Refunded: <span style={{ color: "#10b981", fontWeight: "600" }}>{reversalResult.amount_refunded} kWh</span></div>
            <div style={{ fontSize: "13px", color: "#94a3b8" }}>Status: <span style={{ color: "#10b981", fontWeight: "600" }}>{reversalResult.status}</span></div>
          </div>
          <button onClick={() => { setStep("form"); setReversalResult(null); setError(""); }}
            style={{ width: "100%", padding: "14px 24px", borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)", color: "white", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
            New Transfer
          </button>
        </div>
      )}
    </div>
  )
}
