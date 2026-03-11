// Fleet Dashboard - Standalone Positioner inventory management
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  authenticate,
  fetchAllPositioners,
  fetchAllSensorData,
  discardPositioner,
  deactivatePositioner,
} from './services/api';
import './styles/fleet-dashboard.css';
import styles from './App.module.css';

function App() {
  const [positioners, setPositioners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [filter, setFilter] = useState('active');
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [sensorData, setSensorData] = useState({});
  const loadedRef = useRef(false);

  // Load sensor data for all positioners
  const loadSensorData = useCallback(async (positionerList) => {
    const data = await fetchAllSensorData(positionerList);
    setSensorData(data);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await authenticate();
      const data = await fetchAllPositioners();
      setPositioners(data);
      setLastUpdated(new Date());
      // Load sensor data after positioners
      loadSensorData(data);
    } catch (error) {
      console.error('Error loading positioners:', error);
    } finally {
      setLoading(false);
    }
  }, [loadSensorData]);

  // Initial load
  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      loadData();
    }
  }, [loadData]);

  // Poll sensor data every 10 seconds
  useEffect(() => {
    if (positioners.length > 0) {
      const interval = setInterval(() => loadSensorData(positioners), 10000);
      return () => clearInterval(interval);
    }
  }, [positioners, loadSensorData]);

  // Process positioners with computed fields
  const processedPositioners = useMemo(() => {
    return positioners.map((p) => {
      // Calculate shelf days
      let shelfDays = null;
      if (!p.currentPatient && p.openedAt) {
        shelfDays = Math.floor((new Date().getTime() - p.openedAt.getTime()) / (1000 * 60 * 60 * 24));
      }

      return {
        ...p,
        shelfDays,
        isGhostUse: false,
      };
    }).sort((a, b) => a.barcode.localeCompare(b.barcode));
  }, [positioners]);

  // Filter positioners
  const filteredPositioners = useMemo(() => {
    return processedPositioners.filter((p) => {
      switch (filter) {
        case 'active':
          return p.status === 'active' || (p.status === 'available' && !p.currentPatient);
        case 'available':
          return p.status === 'available' && !p.currentPatient;
        case 'expired':
          return p.status === 'expired';
        case 'discarded':
          return p.status === 'discarded';
        case 'all':
        default:
          return true;
      }
    });
  }, [processedPositioners, filter]);

  // Stats
  const stats = useMemo(() => {
    const nonDiscarded = processedPositioners.filter((p) => p.status !== 'discarded');
    const inUse = nonDiscarded.filter((p) => p.currentPatient);
    const expired = processedPositioners.filter((p) => p.status === 'expired');
    return {
      total: nonDiscarded.length,
      inUse: inUse.length,
      available: nonDiscarded.length - inUse.length,
      expired: expired.length,
    };
  }, [processedPositioners]);

  // Expired positioners that are still in use
  const expiredInUse = useMemo(() => {
    return processedPositioners.filter(
      (p) => p.status === 'expired' && p.currentPatient
    );
  }, [processedPositioners]);

  const handleDiscard = async (p) => {
    if (!confirm(`Discard positioner ${p.barcode}?`)) return;
    
    setActionLoading(`discard-${p.id}`);
    try {
      await discardPositioner(p.device);
      loadData();
    } catch (error) {
      console.error('Error discarding positioner:', error);
      alert('Failed to discard positioner');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivate = async (p) => {
    if (!confirm(`Deactivate positioner ${p.barcode}? This will unassign it from the current patient.`)) return;
    
    setActionLoading(`deactivate-${p.id}`);
    try {
      await deactivatePositioner(p.device);
      loadData();
    } catch (error) {
      console.error('Error deactivating positioner:', error);
      alert('Failed to deactivate positioner');
    } finally {
      setActionLoading(null);
    }
  };

  const getPatientDisplay = (p) => {
    if (!p.currentPatient?.reference) return '';
    const parts = p.currentPatient.reference.split('/');
    return parts.length > 1 ? `Patient ${parts[1].substring(0, 8)}...` : p.currentPatient.reference;
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'active':
      case 'in-use':
        return styles.inuse;
      case 'available':
        return styles.available;
      case 'expired':
        return styles.expired;
      case 'discarded':
        return styles.discarded;
      default:
        return '';
    }
  };

  const getStatusLabel = (p) => {
    if (p.status === 'expired') return 'Expired';
    if (p.status === 'discarded') return 'Discarded';
    if (p.currentPatient) return 'In Use';
    return 'Available';
  };

  const getProgressColor = (daysRemaining) => {
    if (daysRemaining === null) return 'var(--fleet-color-success)';
    if (daysRemaining <= 0) return 'var(--fleet-color-danger)';
    if (daysRemaining < 30) return 'var(--fleet-color-warning)';
    return 'var(--fleet-color-success)';
  };

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Positioner Fleet</h1>
          {lastUpdated && (
            <span className={styles.timestamp}>
              Last sync {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btn} onClick={() => loadData()}>
            Refresh
          </button>
          <button className={styles.btnPrimary} onClick={() => alert('Scanner not available in standalone mode')}>
            Scan Positioner
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Alert Banner for Expired In Use */}
        {expiredInUse.length > 0 && (
          <div className={styles.alertBanner}>
            <div className={styles.alertContent}>
              <span className={styles.alertCount}>{expiredInUse.length}</span>
              <span className={styles.alertText}>
                expired positioner{expiredInUse.length > 1 ? 's' : ''} currently in use
              </span>
            </div>
            <div className={styles.alertList}>
              {expiredInUse.map((p) => (
                <div key={p.id} className={styles.alertItem}>
                  <span className={styles.alertBagId}>{p.barcode}</span>
                  <span className={styles.alertArrow}>→</span>
                  <span className={styles.alertPatient}>{getPatientDisplay(p)}</span>
                  <span className={styles.alertDays}>
                    {p.daysRemaining !== null ? `${Math.abs(p.daysRemaining)}d over` : 'Expired'}
                  </span>
                  <button
                    className={styles.alertAction}
                    onClick={() => handleDiscard(p)}
                    disabled={actionLoading === `discard-${p.id}`}
                  >
                    {actionLoading === `discard-${p.id}` ? '...' : 'Discard'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Bar */}
        <div className={styles.statsBar}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{loading ? '—' : stats.total}</span>
            <span className={styles.statLabel}>Total</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{loading ? '—' : stats.inUse}</span>
            <span className={styles.statLabel}>In Use</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{loading ? '—' : stats.available}</span>
            <span className={styles.statLabel}>Available</span>
          </div>
          <div className={`${styles.stat} ${stats.expired > 0 ? styles.danger : ''}`}>
            <span className={styles.statValue}>{loading ? '—' : stats.expired}</span>
            <span className={styles.statLabel}>Expired</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className={styles.filterTabs}>
          {['active', 'available', 'expired', 'discarded', 'all'].map((tab) => (
            <button
              key={tab}
              className={`${styles.filterTab} ${filter === tab ? styles.active : ''}`}
              onClick={() => setFilter(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p>Loading positioners...</p>
          </div>
        ) : filteredPositioners.length === 0 ? (
          <div className={styles.empty}>No positioners found</div>
        ) : (
          /* Positioner Table */
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <div className={styles.tableHeaderCell}>ID</div>
              <div className={styles.tableHeaderCell}>Status</div>
              <div className={styles.tableHeaderCell}>Patient</div>
              <div className={styles.tableHeaderCell}>Lifecycle</div>
              <div className={styles.tableHeaderCell}>Opened</div>
              <div className={styles.tableHeaderCell}></div>
            </div>

            {filteredPositioners.map((p) => (
              <div
                key={p.id}
                className={`${styles.row} ${p.status === 'expired' && p.currentPatient ? styles.critical : ''} ${p.isGhostUse ? styles.ghostUse : ''}`}
              >
                <div
                  className={styles.rowMain}
                  onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                >
                  {/* ID */}
                  <div className={styles.rowId}>
                    {p.barcode}
                    {p.isGhostUse && <span className={styles.ghostBadge}>⚠ Unscanned</span>}
                  </div>

                  {/* Status */}
                  <div className={styles.cell}>
                    <span className={`${styles.status} ${getStatusClass(p.currentPatient ? 'in-use' : p.status)}`}>
                      {getStatusLabel(p)}
                    </span>
                  </div>

                  {/* Patient */}
                  <div className={styles.cell}>
                    {p.currentPatient ? (
                      getPatientDisplay(p)
                    ) : p.shelfDays !== null ? (
                      <span className={styles.shelf}>On shelf {p.shelfDays}d</span>
                    ) : (
                      <span className={styles.cellEmpty}>—</span>
                    )}
                  </div>

                  {/* Lifecycle */}
                  <div className={styles.cell}>
                    {p.daysRemaining !== null ? (
                      <div className={styles.lifecycle}>
                        <div className={styles.progress}>
                          <div
                            className={styles.progressBar}
                            style={{
                              width: `${Math.min(((90 - Math.max(p.daysRemaining, 0)) / 90) * 100, 100)}%`,
                              background: getProgressColor(p.daysRemaining),
                            }}
                          />
                        </div>
                        <span className={styles.days}>
                          {p.daysRemaining <= 0 ? (
                            <span className={styles.overdue}>{Math.abs(p.daysRemaining)}d over</span>
                          ) : (
                            `${p.daysRemaining}d left`
                          )}
                        </span>
                      </div>
                    ) : (
                      <span className={styles.cellEmpty}>—</span>
                    )}
                  </div>

                  {/* Opened Date */}
                  <div className={styles.cell}>
                    {p.openedAt ? (
                      p.openedAt.toLocaleDateString()
                    ) : (
                      <span className={styles.cellEmpty}>—</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className={styles.rowActions}>
                    {p.status !== 'discarded' && (
                      <button
                        className={styles.btnDanger}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDiscard(p);
                        }}
                        disabled={actionLoading === `discard-${p.id}`}
                      >
                        {actionLoading === `discard-${p.id}` ? '...' : 'Discard'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === p.id && (
                  <div className={styles.rowDetails}>
                    <div className={styles.detailGrid}>
                      <div className={styles.detail}>
                        <span className={styles.detailLabel}>Opened</span>
                        <span className={styles.detailValue}>
                          {p.openedAt ? p.openedAt.toLocaleDateString() : '—'}
                        </span>
                      </div>
                      <div className={styles.detail}>
                        <span className={styles.detailLabel}>Expires</span>
                        <span className={styles.detailValue}>
                          {p.expiresAt ? p.expiresAt.toLocaleDateString() : '—'}
                        </span>
                      </div>
                      <div className={styles.detail}>
                        <span className={styles.detailLabel}>Days Remaining</span>
                        <span className={styles.detailValue}>
                          {p.daysRemaining !== null ? `${p.daysRemaining} days` : '—'}
                        </span>
                      </div>
                      <div className={styles.detail}>
                        <span className={styles.detailLabel}>Assigned</span>
                        <span className={styles.detailValue}>
                          {p.assignedAt ? p.assignedAt.toLocaleString() : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Sensor Data */}
                    <div className={styles.sensorSection}>
                      <span className={styles.sensorTitle}>Capacitance Sensor</span>
                      {sensorData[p.id] ? (
                        <div className={styles.sensorData}>
                          <span className={`${styles.sensorStatus} ${sensorData[p.id]?.touched ? styles.sensorTouched : styles.sensorNotTouched}`}>
                            {sensorData[p.id]?.touched ? '🟡 TOUCHED' : '⚪ NOT TOUCHED'}
                          </span>
                          {sensorData[p.id]?.rawValue !== null && (
                            <span className={styles.sensorRaw}>Raw: {sensorData[p.id]?.rawValue}</span>
                          )}
                          <span className={styles.sensorTime}>{sensorData[p.id]?.timeAgo}</span>
                        </div>
                      ) : (
                        <span className={styles.sensorNoData}>No sensor data</span>
                      )}
                    </div>

                    {p.currentPatient && (
                      <div className={styles.history}>
                        <span className={styles.historyTitle}>Current Assignment</span>
                        <div className={styles.historyItem}>
                          <span>{getPatientDisplay(p)}</span>
                          <span className={styles.historyDates}>
                            Since {p.assignedAt ? p.assignedAt.toLocaleDateString() : 'Unknown'}
                          </span>
                        </div>
                        <button
                          className={styles.btnRestore}
                          style={{ marginTop: '12px' }}
                          onClick={() => handleDeactivate(p)}
                          disabled={actionLoading === `deactivate-${p.id}`}
                        >
                          {actionLoading === `deactivate-${p.id}` ? '...' : 'Unassign from Patient'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
