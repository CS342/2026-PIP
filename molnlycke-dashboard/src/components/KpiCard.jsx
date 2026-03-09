import "../styles/components.css";

export default function KpiCard({ label, value, trend, variant = "default" }) {
  return (
    <div className={`kpi-card ${variant}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-trend">{trend}</div>
    </div>
  );
}
