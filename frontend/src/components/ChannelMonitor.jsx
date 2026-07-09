import React, { useState } from 'react'

export default function ChannelMonitor() {
  const [channels] = useState([
    { id: 'CH-001', name: 'Soweto Energy Agents', type: 'agent', sales: 245000, commission: 6125, rate: 2.5, active: true, contact: 'Lerato M.' },
    { id: 'CH-002', name: 'Tshwane Retail Hub', type: 'retailer', sales: 182000, commission: 4550, rate: 2.5, active: true, contact: 'Johan B.' },
    { id: 'CH-003', name: 'Ekurhuleni Distributors', type: 'distributor', sales: 320000, commission: 8000, rate: 2.5, active: true, contact: 'Mike D.' },
    { id: 'CH-004', name: 'Online Prepaid Portal', type: 'online', sales: 89000, commission: 2225, rate: 2.5, active: true, contact: 'System' },
    { id: 'CH-005', name: 'Midrand Corporate Park', type: 'corporate', sales: 156000, commission: 3900, rate: 2.5, active: false, contact: 'Susan K.' }
  ])

  const totalSales = channels.filter(c => c.active).reduce((s, c) => s + c.sales, 0)
  const totalCommission = channels.filter(c => c.active).reduce((s, c) => s + c.commission, 0)

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card success"><div className="stat-value">{channels.filter(c => c.active).length}</div><div className="stat-label">Active Channels</div></div>
        <div className="stat-card"><div className="stat-value">R{Math.round(totalSales / 1000)}K</div><div className="stat-label">Total Sales</div></div>
        <div className="stat-card"><div className="stat-value">R{Math.round(totalCommission)}</div><div className="stat-label">Total Commission</div></div>
        <div className="stat-card"><div className="stat-value">{channels.length}</div><div className="stat-label">Total Channels</div></div>
      </div>
      <div className="card">
        <div className="card-header"><h3 className="card-title">?? Sales Channel Performance</h3></div>
        <div className="table-container">
          <table>
            <thead><tr><th>Channel</th><th>Type</th><th>Contact</th><th>Sales (ZAR)</th><th>Commission</th><th>Rate</th><th>Status</th></tr></thead>
            <tbody>
              {channels.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td><span className="badge online">{c.type}</span></td>
                  <td>{c.contact}</td>
                  <td>R{Math.round(c.sales).toLocaleString()}</td>
                  <td>R{Math.round(c.commission).toLocaleString()}</td>
                  <td>{c.rate}%</td>
                  <td><span className={'badge ' + (c.active ? 'online' : 'offline')}>{c.active ? 'Active' : 'Inactive'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
