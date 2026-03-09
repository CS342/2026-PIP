import { useState, useMemo } from "react";
import KpiCard from "../components/KpiCard";
import DataTable from "../components/DataTable";
import FleetMap from "../components/FleetMap";
import {
  database,
  getClientById,
  getInventoryByClient,
  calculateDaysRemaining,
} from "../data/mockDatabase";
import "../styles/pages.css";

export default function UsageInsights() {
  const [selectedClient, setSelectedClient] = useState("all");

  const metrics = useMemo(() => {
    const filteredInventory = getInventoryByClient(selectedClient);

    const totalPurchased =
      selectedClient === "all"
        ? database.clients.reduce((sum, c) => sum + c.total_purchased, 0)
        : getClientById(selectedClient)?.total_purchased || 0;

    const scannedCount = filteredInventory.length;
    const complianceRate = ((scannedCount / totalPurchased) * 100).toFixed(1);

    const totalScans = filteredInventory.reduce(
      (sum, item) => sum + item.scans.length,
      0
    );
    const avgScans = scannedCount > 0 ? (totalScans / scannedCount).toFixed(1) : 0;

    let totalActiveHours = 0;
    let totalPossibleHours = 0;

    filteredInventory.forEach((item) => {
      const first = new Date(item.scans[0]);
      const diffHours = Math.abs(database.today - first) / (1000 * 60 * 60);
      totalPossibleHours += diffHours;
      totalActiveHours += item.active_use_hours || 0;
    });

    const utilRatio =
      totalPossibleHours > 0
        ? ((totalActiveHours / totalPossibleHours) * 100).toFixed(1)
        : 0;

    const expiringSoonCount = filteredInventory.filter((item) => {
      const daysRemaining = calculateDaysRemaining(item.scans[0]);
      return daysRemaining >= 0 && daysRemaining < 10;
    }).length;

    const bagsSaved = totalScans - filteredInventory.length;

    return {
      totalPurchased,
      complianceRate,
      scannedCount,
      avgScans,
      utilRatio,
      expiringSoonCount,
      bagsSaved,
      inventory: filteredInventory,
    };
  }, [selectedClient]);

  const handleExport = () => {
    const rows = [
      [
        "Serial ID",
        "Batch",
        "Client",
        "First Scan",
        "Last Scan",
        "Total Scans",
        "Days Remaining",
        "Active Use Hours",
      ],
    ];

    metrics.inventory.forEach((item) => {
      const client = getClientById(item.client_id);
      const firstScan = new Date(item.scans[0]);
      const lastScan = new Date(item.scans[item.scans.length - 1]);
      const daysRemaining = calculateDaysRemaining(item.scans[0]);

      rows.push([
        item.serial_number,
        item.batch,
        client?.name || item.client_id,
        firstScan.toLocaleDateString(),
        lastScan.toLocaleDateString(),
        item.scans.length,
        daysRemaining,
        item.active_use_hours || 0,
      ]);
    });

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `molnlycke-bag-logs-${selectedClient}.csv`;
    a.click();
  };

  return (
    <>
      <div className="page-controls">
        <div className="client-selector">
          <label>Viewing Data For:</label>
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
          >
            <option value="all">All Accounts (Aggregate)</option>
            {database.clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="kpi-grid">
        <KpiCard
          label="Total Fleet Size"
          value={metrics.totalPurchased}
          trend="Units sold to client"
        />
        <KpiCard
          label="Scan Compliance"
          value={`${metrics.complianceRate}%`}
          trend={`${metrics.scannedCount} scanned at least once`}
        />
        <KpiCard
          label="Avg. Re-Use Rate"
          value={metrics.avgScans}
          trend="Scans per active bag"
        />
        <KpiCard
          label="Use vs. Shelf Ratio"
          value={`${metrics.utilRatio}%`}
          trend="Active use vs. idle time"
        />
        <KpiCard
          label="Expiring Soon (<10d)"
          value={metrics.expiringSoonCount}
          trend={
            metrics.expiringSoonCount === 1
              ? "1 bag needs attention"
              : `${metrics.expiringSoonCount} bags need attention`
          }
          variant="expiring"
        />
        <KpiCard
          label="Bags Saved"
          value={metrics.bagsSaved}
          trend="Via multi-patient reuse"
        />
      </section>

      <section className="insights-container">
        <FleetMap selectedClient={selectedClient} />
        <DataTable inventory={metrics.inventory} onExport={handleExport} />
      </section>
    </>
  );
}
