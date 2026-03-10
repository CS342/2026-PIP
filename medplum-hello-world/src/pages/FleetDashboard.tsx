// Fleet Dashboard - Positioner inventory management with teal healthcare theme
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { JSX } from 'react';
import { useMedplum, useMedplumProfile } from '@medplum/react';
import { useNavigate } from 'react-router';
import { showNotification } from '@mantine/notifications';
import {
  getAllPositioners,
  discardPositioner,
  deactivatePositioner,
  type Positioner,
  type PositionerStatus,
} from '../utils/positioner';
import { getLatestCapacitanceReading, type SensorReading } from '../utils/sensorData';
import { FleetScannerModal } from '../components/FleetScannerModal';
import '../styles/fleet-dashboard.css';
import styles from './FleetDashboard.module.css';

type FilterType = 'active' | 'available' | 'expired' | 'discarded' | 'all';

// Extended positioner with computed display fields
interface ProcessedPositioner extends Positioner {
  shelfDays: number | null;
  isGhostUse: boolean;
  displayStatus: string;
}

export function FleetDashboard(): JSX.Element {
  const medplum = useMedplum();
  const profile = useMedplumProfile();
  const navigate = useNavigate();
  const [positioners, setPositioners] = useState<Positioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [filter, setFilter] = useState<FilterType>('active');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [sensorData, setSensorData] = useState<Record<string, SensorReading | null>>({});
  const loadedRef = useRef(false);

  // Load sensor data for all positioners
  const loadSensorData = useCallback(async (positionerList: Positioner[]) => {
    const data: Record<string, SensorReading | null> = {};
    for (const p of positionerList) {
      data[p.id] = await getLatestCapacitanceReading(medplum, p.id);
    }
    setSensorData(data);
  }, [medplum]);

  const loadData = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await getAllPositioners(medplum);
      setPositioners(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading positioners:', error);
      showNotification({
        color: 'red',
        message: 'Failed to load positioners',
      });
    } finally {
      setLoading(false);
    }
  };

  // Only load data once when profile is available
  useEffect(() => {
    if (profile && !loadedRef.current) {
      loadedRef.current = true;
      loadData();
    }
  }, [profile]);

  // Poll sensor data every 10 seconds
  useEffect(() => {
    if (positioners.length > 0) {
      loadSensorData(positioners);
      const interval = setInterval(() => loadSensorData(positioners), 10000);
      return () => clearInterval(interval);
    }
  }, [positioners, loadSensorData]);

  // Redirect to sign in if not authenticated
  if (!profile) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Please sign in to view the fleet dashboard</p>
        </div>
      </div>
    );
  }

  // Process positioners with computed fields
  const processedPositioners = useMemo((): ProcessedPositioner[] => {
    return positioners.map((p) => {
      // Calculate shelf days (days since last use if not currently assigned)
      let shelfDays: number | null = null;
      if (!p.currentPatient && p.openedAt) {
        shelfDays = Math.floor((new Date().getTime() - p.openedAt.getTime()) / (1000 * 60 * 60 * 24));
      }

      // Determine display status
      let displayStatus = p.status;
      if (p.status === 'active' && p.currentPatient) {
        displayStatus = 'in-use' as PositionerStatus;
      }

      return {
        ...p,
        shelfDays,
        isGhostUse: false, // Would need sensor data to determine
        displayStatus,
      };
    }).sort((a, b) => a.barcode.localeCompare(b.barcode));
  }, [positioners]);

  // Filter positioners
  const filteredPositioners = useMemo((): ProcessedPositioner[] => {
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

  // Expired positioners that are still in use (critical alerts)
  const expiredInUse = useMemo(() => {
    return processedPositioners.filter(
      (p) => p.status === 'expired' && p.currentPatient
    );
  }, [processedPositioners]);

  const handleDiscard = async (p: ProcessedPositioner): Promise<void> => {
    if (!confirm(`Discard positioner ${p.barcode}?`)) return;
    
    setActionLoading(`discard-${p.id}`);
    try {
      await discardPositioner(medplum, p.device);
      showNotification({
        color: 'green',
        message: `Positioner ${p.barcode} discarded`,
      });
      loadData();
    } catch (error) {
      console.error('Error discarding positioner:', error);
      showNotification({
        color: 'red',
        message: 'Failed to discard positioner',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivate = async (p: ProcessedPositioner): Promise<void> => {
    if (!confirm(`Deactivate positioner ${p.barcode}? This will unassign it from the current patient.`)) return;
    
    setActionLoading(`deactivate-${p.id}`);
    try {
      await deactivatePositioner(medplum, p.device);
      showNotification({
        color: 'green',
        message: `Positioner ${p.barcode} deactivated`,
      });
      loadData();
    } catch (error) {
      console.error('Error deactivating positioner:', error);
      showNotification({
        color: 'red',
        message: 'Failed to deactivate positioner',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getPatientDisplay = (p: ProcessedPositioner): string => {
    if (!p.currentPatient?.reference) return '';
    const parts = p.currentPatient.reference.split('/');
    return parts.length > 1 ? `Patient ${parts[1].substring(0, 8)}...` : p.currentPatient.reference;
  };

  const getStatusClass = (status: string): string => {
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

  const getStatusLabel = (p: ProcessedPositioner): string => {
    if (p.status === 'expired') return 'Expired';
    if (p.status === 'discarded') return 'Discarded';
    if (p.currentPatient) return 'In Use';
    return 'Available';
  };

  const getProgressColor = (daysRemaining: number | null): string => {
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
          <button className={styles.btnPrimary} onClick={() => setScanModalOpen(true)}>
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
          {(['active', 'available', 'expired', 'discarded', 'all'] as FilterType[]).map((tab) => (
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
                              width: `${Math.min(((90 - (p.daysRemaining || 0)) / 90) * 100, 100)}%`,
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

      {/* Scanner Modal */}
      <FleetScannerModal
        opened={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        onSuccess={() => {
          setScanModalOpen(false);
          loadData();
        }}
      />
    </div>
  );
}
