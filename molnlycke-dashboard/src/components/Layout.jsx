import { NavLink, Outlet } from "react-router-dom";
import { FaChartLine, FaBoxesStacked, FaCalendar } from "react-icons/fa6";
import "../styles/layout.css";

export default function Layout() {
  return (
    <main className="main-content">
      <header className="top-bar">
        <div className="brand">
          <span className="brand-name">Mölnlycke</span>
          <span className="brand-sub">Usage Insights</span>
        </div>

        <nav className="nav-tabs">
          <NavLink to="/" className={({ isActive }) => `nav-tab ${isActive ? "active" : ""}`} end>
            <FaChartLine /> Usage Insights
          </NavLink>
          <NavLink to="/replenishment" className={({ isActive }) => `nav-tab ${isActive ? "active" : ""}`}>
            <FaBoxesStacked /> Replenishment
          </NavLink>
        </nav>

        <div className="date-display">
          <FaCalendar /> <span>Feb 18, 2026</span>
        </div>
      </header>

      <Outlet />
    </main>
  );
}
