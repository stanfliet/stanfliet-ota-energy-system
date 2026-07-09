import React, { useState } from 'react'

export default function TransferForm() {
  const [sender, setSender] = useState('')
  const [receiver, setReceiver] = useState('')
  const [amount, setAmount] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('initiate')
  const [loading, setLoading] = useState(false)
  const [transferId, setTransferId] = useState('')
  const [result, setResult] = useState(null)

  const handleInitiate = async () => {
    if (!sender || !receiver || !amount) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    setTransferId('TRF-' + Date.now().toString(36).toUpperCase())
    setStep('confirm')
    setLoading(false)
  }

  const handleConfirm = async () => {
    if (!otp) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    const units = parseFloat(amount) / 2.1437
    setResult({
      success: true,
      transferId,
      sender, receiver,
      amount: parseFloat(amount),
      units: Math.round(units * 100) / 100,
      completedAt: new Date().toLocaleString()
    })
    setStep('complete')
    setLoading(false)
  }

  return (
    <div className="grid-2">
      <div className="card">
        <div className="card-header"><h3 className="card-title">?? Peer-to-Peer Credit Transfer</h3></div>
        {step === 'initiate' && (
          <div>
            <div className="form-group">
              <label>Sender Meter Serial</label>
              <input type="text" placeholder="e.g., SM-2026-0001" value={sender} onChange={e => setSender(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Receiver Meter Serial</label>
              <input type="text" placeholder="e.g., SM-2026-0002" value={receiver} onChange={e => setReceiver(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Amount (ZAR)</label>
              <input type="number" placeholder="e.g., 200" value={amount} onChange={e => setAmount(e.target.value)} min="1" />
            </div>
            {amount && <div style={{padding:12,background:'#bee3f8',borderRadius:8,marginBottom:16,fontSize:14}}>
              Receiver gets: <strong>{Math.round(parseFloat(amount) / 2.1437 * 100) / 100} kWh</strong>
            </div>}
            <button className="btn btn-primary btn-lg" style={{width:'100%'}} onClick={handleInitiate} disabled={loading || !sender || !receiver || !amount}>
              {loading ? <><span className="spinner" /> Initiating...</> : '?? Initiate Transfer'}
            </button>
          </div>
        )}
        {step === 'confirm' && (
          <div>
            <div className="alert-box warning">?? An OTP has been sent to the receiver's phone</div>
            <div className="form-group">
              <label>Enter OTP Code</label>
              <input type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} maxLength="6" />
            </div>
            <button className="btn btn-primary btn-lg" style={{width:'100%'}} onClick={handleConfirm} disabled={loading || otp.length !== 6}>
              {loading ? <><span className="spinner" /> Verifying...</> : '? Confirm Transfer'}
            </button>
            <button className="btn btn-sm" style={{marginTop:8}} onClick={() => setStep('initiate')}>Cancel</button>
          </div>
        )}
      </div>
      <div className="card">
        <div className="card-header"><h3 className="card-title">?? Transfer Details</h3></div>
        {result ? (
          <div>
            <div className="alert-box success">? Transfer Completed!</div>
            <div className="form-group"><label>Transfer ID</label><input readOnly value={result.transferId} /></div>
            <div className="form-group"><label>From</label><input readOnly value={result.sender} /></div>
            <div className="form-group"><label>To</label><input readOnly value={result.receiver} /></div>
            <div className="form-group"><label>Amount</label><input readOnly value={'R' + result.amount.toFixed(2)} /></div>
            <div className="form-group"><label>Units Transferred</label><input readOnly value={result.units.toFixed(2) + ' kWh'} /></div>
            <div className="form-group"><label>Completed At</label><input readOnly value={result.completedAt} /></div>
          </div>
        ) : (
          <div style={{textAlign:'center',padding:40,color:'var(--text-light)'}}>
            <div style={{fontSize:48,marginBottom:16}}>??</div>
            <p>Initiate a transfer to see details here.</p>
          </div>
        )}
      </div>
    </div>
  )
}
