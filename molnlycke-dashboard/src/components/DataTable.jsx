import { useMemo } from "react";
import { FaShareNodes } from "react-icons/fa6";
import { database, calculateDaysRemaining } from "../data/mockDatabase";
import "../styles/components.css";

export default function DataTable({ inventory, onExport }) {
  const tableData = useMemo(() => {
    return inventory.map((item) => {
      const firstScanDate = new Date(item.scans[0]);
      const lastScanDate = new Date(item.scans[item.scans.length - 1]);
      const daysRemaining = calculateDaysRemaining(item.scans[0]);
      const daysSinceFirstScan = 90 - daysRemaining;
      const totalPossibleHours = Math.max(1, daysSinceFirstScan * 24);
      const usePercentage = Math.round(
        ((item.active_use_hours || 0) / totalPossibleHours) * 100
      );

      return {
        ...item,
        firstScanDate,
        lastScanDate,
        daysRemaining,
        usePercentage,
        isExpiring: daysRemaining >= 0 && daysRemaining < 10,
      };
    });
  }, [inventory]);

  return (
    <div className="table-card">
      <div className="card-header">
        <h3>Detailed Bag Logs</h3>
        <button className="icon-btn" onClick={onExport} title="Export as CSV">
          <FaShareNodes />
        </button>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Serial ID</th>
              <th>Batch</th>
              <th>First Scan</th>
              <th>Last Scan</th>
              <th>Total Scans</th>
              <th>Use vs. Shelf</th>
              <th>Lifespan (90d)</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((item) => (
              <tr key={item.serial_number} className={item.isExpiring ? "row-expiring" : ""}>
                <td>
                  <strong>{item.serial_number}</strong>
                </td>
                <td>{item.batch}</td>
                <td>{item.firstScanDate.toLocaleDateString()}</td>
                <td>
                  {item.scans.length > 1
                    ? item.lastScanDate.toLocaleDateString()
                    : "N/A"}
                </td>
                <td>{item.scans.length}</td>
                <td>{item.usePercentage}% Active</td>
                <td className={item.isExpiring ? "expiring-cell" : ""}>
                  {item.isExpiring && "⚠ "}
                  {item.daysRemaining} Days
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
