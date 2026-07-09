import React, { useState } from 'react'

export default function PurchaseForm() {
  const [meterId, setMeterId] = useState('')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('payfast')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handlePurchase = async () => {
    if (!meterId || !amount) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    const units = parseFloat(amount) / 2.1437
    setResult({
      success: true,
      meterSerial: meterId,
      amount: parseFloat(amount),
      units: Math.round(units * 100) / 100,
      tariff: 2.1437,
      reference: 'PAY-' + Date.now().toString(36).toUpperCase(),
      timestamp: new Date().toLocaleString()
    })
    setLoading(false)
  }

  return (
    <div className="grid-2">
      <div className="card">
        <div className="card-header"><h3 className="card-title">?? Purchase Electricity Units</h3></div>
        <div className="form-group">
          <label>Meter Serial Number</label>
          <input type="text" placeholder="e.g., SM-2026-0001" value={meterId} onChange={e => setMeterId(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Amount (ZAR)</label>
          <input type="number" placeholder="e.g., 500" value={amount} onChange={e => setAmount(e.target.value)} min="10" />
        </div>
        <div className="form-group">
          <label>Payment Method</label>
          <select value={method} onChange={e => setMethod(e.target.value)}>
            <option value="payfast">PayFast</option>
            <option value="yoco">Yoco Card</option>
            <option value="voucher">Voucher Code</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>
        {amount && <div style={{padding:12,background:'#f0fff4',borderRadius:8,marginBottom:16,fontSize:14}}>
          You will receive: <strong>{Math.round(parseFloat(amount) / 2.1437 * 100) / 100} kWh</strong> @ R2.1437/kWh
        </div>}
        <button className="btn btn-primary btn-lg" style={{width:'100%'}} onClick={handlePurchase} disabled={loading || !meterId || !amount}>
          {loading ? <><span className="spinner" /> Processing...</> : '?? Purchase Now'}
        </button>
      </div>
      <div className="card">
        <div className="card-header"><h3 className="card-title">?? Purchase History</h3></div>
        {result ? (
          <div>
            <div className="alert-box success">? Payment Successful!</div>
            <div className="form-group"><label>Reference</label><input readOnly value={result.reference} /></div>
            <div className="form-group"><label>Meter</label><input readOnly value={result.meterSerial} /></div>
            <div className="form-group"><label>Amount</label><input readOnly value={'R' + result.amount.toFixed(2)} /></div>
            <div className="form-group"><label>Units Purchased</label><input readOnly value={result.units.toFixed(2) + ' kWh'} /></div>
            <div className="form-group"><label>Date</label><input readOnly value={result.timestamp} /></div>
          </div>
        ) : (
          <div style={{textAlign:'center',padding:40,color:'var(--text-light)'}}>
            <div style={{fontSize:48,marginBottom:16}}>??</div>
            <p>Complete a purchase to see receipt here.</p>
          </div>
        )}
      </div>
    </div>
  )
}
