import { useState, useMemo } from "react";
import { database, calculateDaysRemaining } from "../data/mockDatabase";
import "../styles/replenishment.css";

export default function Replenishment() {
  const [toast, setToast] = useState({ show: false, message: "" });

  const hospitalMetrics = useMemo(() => {
    return database.clients
      .map((client) => {
        const inventory = database.inventory.filter(
          (i) => i.client_id === client.id
        );

        let expiringSoon = 0;
        let healthy = 0;

        inventory.forEach((item) => {
          const daysRemaining = calculateDaysRemaining(item.scans[0]);
          if (daysRemaining < 10) expiringSoon++;
          else healthy++;
        });

        const totalScans = inventory.reduce((sum, i) => sum + i.scans.length, 0);
        const avgDailyUsage = inventory.length > 0 ? totalScans / inventory.length / 30 : 0;
        const daysOfSupply = avgDailyUsage > 0 ? Math.round(inventory.length / avgDailyUsage) : 999;

        const stockRatio = healthy / client.total_purchased;

        let status = "good";
        if (stockRatio < 0.1 || daysOfSupply < 14) {
          status = "urgent";
        } else if (stockRatio < 0.25 || daysOfSupply < 20) {
          status = "low";
        }

        const recommendedOrder = Math.max(0, Math.round(client.total_purchased * 0.3));

        return {
          ...client,
          activeUnits: inventory.length,
          expiringSoon,
          daysOfSupply: Math.min(daysOfSupply, 99),
          status,
          recommendedOrder,
        };
      })
      .sort((a, b) => {
        const order = { urgent: 0, low: 1, good: 2 };
        return order[a.status] - order[b.status];
      });

    // Ensure at least one hospital shows "running low"
    const hasLow = metrics.some((m) => m.status === "low");
    if (!hasLow) {
      // Prefer demoting a "good" hospital, otherwise the least-bad "urgent" one
      const target =
        metrics.find((m) => m.status === "good") ??
        metrics.slice().reverse().find((m) => m.status === "urgent");
      if (target) {
        target.status = "low";
        metrics.sort((a, b) => {
          const order = { urgent: 0, low: 1, good: 2 };
          return order[a.status] - order[b.status];
        });
      }
    }

    return metrics;
  }, []);

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 2500);
  };

  const getStatusLabel = (status) => {
    if (status === "urgent") return "Needs attention";
    if (status === "low") return "Running low";
    return "Stocked";
  };

  return (
    <div className="replenishment-page">
      <div className="page-intro">
        <h1>Replenishment</h1>
        <p>Hospitals sorted by stock urgency</p>
      </div>

      <div className="hospital-list">
        {hospitalMetrics.map((hospital) => (
          <div key={hospital.id} className={`hospital-row ${hospital.status}`}>
            <div className="hospital-main">
              <div className={`status-dot ${hospital.status}`} />
              <div className="hospital-details">
                <span className="hospital-name">{hospital.name}</span>
                <span className="status-label">{getStatusLabel(hospital.status)}</span>
              </div>
            </div>

            <div className="hospital-stats">
              <div className="stat">
                <span className="stat-value">{hospital.activeUnits}</span>
                <span className="stat-label">Active</span>
              </div>
              <div className="stat">
                <span className={`stat-value ${hospital.expiringSoon > 0 ? "highlight" : ""}`}>
                  {hospital.expiringSoon}
                </span>
                <span className="stat-label">Expiring</span>
              </div>
              <div className="stat">
                <span className={`stat-value ${hospital.daysOfSupply < 30 ? "highlight" : ""}`}>
                  {hospital.daysOfSupply}d
                </span>
                <span className="stat-label">Supply</span>
              </div>
            </div>

            <div className="hospital-actions">
              <button
                className="btn-secondary"
                onClick={() => showToast(`Reminder sent to ${hospital.name}`)}
              >
                Send reminder
              </button>
              <button
                className="btn-primary"
                onClick={() => showToast(`Order of ${hospital.recommendedOrder} units placed`)}
              >
                Order {hospital.recommendedOrder}
              </button>
            </div>
          </div>
        ))}
      </div>

      {toast.show && <div className="toast">{toast.message}</div>}
    </div>
  );
}
