import { useState, useEffect } from 'react';
import { fetchSensorData, fetchOccupancyHistory } from '../services/api';
import { getTimeAgo } from '../hooks/useMedplum';
import styles from './BagCard.module.css';

export function BagCard({ 
  device, 
  bagId, 
  status, 
  currentUse, 
  daysSinceOpened, 
  daysRemaining, 
  history,
  isDiscarded,
  onDiscard,
  onRestore 
}) {
  const [expanded, setExpanded] = useState(false);
  const [sensorData, setSensorData] = useState({ pressure: null, capacitance: null, wearHours: null });
  
  useEffect(() => {
    async function loadSensorData() {
      try {
        const [pressure, capacitance, occupancyHistory] = await Promise.all([
          fetchSensorData(device.id, 'bag-occupancy'),
          fetchSensorData(device.id, 'bag-capacitance'),
          fetchOccupancyHistory(device.id)
        ]);
        
        let wearHours = 0;
        if (occupancyHistory.length > 0) {
          const hourlyOccupancy = {};
          occupancyHistory.forEach(obs => {
            const ts = new Date(obs.effectiveDateTime);
            const key = `${ts.getFullYear()}-${ts.getMonth()}-${ts.getDate()}-${ts.getHours()}`;
            if (!hourlyOccupancy[key]) hourlyOccupancy[key] = { occupied: 0, total: 0 };
            hourlyOccupancy[key].total++;
            if (obs.valueBoolean) hourlyOccupancy[key].occupied++;
          });
          Object.values(hourlyOccupancy).forEach(hour => {
            if (hour.occupied / hour.total >= 0.5) wearHours++;
          });
        }
        
        setSensorData({ pressure, capacitance, wearHours });
      } catch (e) {
        console.error('Error loading sensor data:', e);
      }
    }
    loadSensorData();
  }, [device.id]);
  
  const patientName = currentUse?.subject?.display || currentUse?.subject?.reference;
  const progressPercent = daysSinceOpened !== null ? Math.min((daysSinceOpened / 90) * 100, 100) : 0;
  
  const statusLabel = {
    'in-use': 'In Use',
    'available': 'Available', 
    'expired': 'Expired',
    'expired-in-use': 'Expired',
    'discarded': 'Discarded'
  }[status];

  return (
    <div className={`${styles.row} ${status === 'expired-in-use' ? styles.critical : ''}`}>
      <div className={styles.main} onClick={() => setExpanded(!expanded)}>
        <div className={styles.id}>{bagId}</div>
        
        <div className={styles.cell}>
          <span className={`${styles.status} ${styles[status.replace('-', '')]}`}>
            {statusLabel}
          </span>
        </div>
        
        <div className={styles.cell}>
          {patientName || <span className={styles.empty}>—</span>}
        </div>
        
        <div className={styles.cell}>
          {daysSinceOpened !== null ? (
            <div className={styles.lifecycle}>
              <div className={styles.progress}>
                <div 
                  className={styles.progressBar} 
                  style={{ 
                    width: `${progressPercent}%`,
                    background: progressPercent > 100 ? 'var(--color-danger)' : 
                               progressPercent > 75 ? 'var(--color-warning)' : 
                               'var(--color-success)'
                  }} 
                />
              </div>
              <span className={styles.days}>
                {daysRemaining < 0 ? (
                  <span className={styles.overdue}>{Math.abs(daysRemaining)}d over</span>
                ) : (
                  `${daysRemaining}d left`
                )}
              </span>
            </div>
          ) : (
            <span className={styles.empty}>—</span>
          )}
        </div>
        
        <div className={styles.cell}>
          <SensorIndicator data={sensorData.pressure} type="pressure" />
        </div>
        
        <div className={styles.cell}>
          {sensorData.wearHours !== null ? `${sensorData.wearHours}h` : '—'}
        </div>
        
        <div className={styles.actions}>
          {!isDiscarded ? (
            <button className={styles.btnDanger} onClick={(e) => { e.stopPropagation(); onDiscard(); }}>
              Discard
            </button>
          ) : (
            <button className={styles.btnRestore} onClick={(e) => { e.stopPropagation(); onRestore(); }}>
              Restore
            </button>
          )}
        </div>
      </div>
      
      {expanded && (
        <div className={styles.details}>
          <div className={styles.detailGrid}>
            <div className={styles.detail}>
              <span className={styles.detailLabel}>Opened</span>
              <span className={styles.detailValue}>
                {daysSinceOpened !== null 
                  ? new Date(Date.now() - daysSinceOpened * 86400000).toLocaleDateString()
                  : '—'}
              </span>
            </div>
            <div className={styles.detail}>
              <span className={styles.detailLabel}>Days Used</span>
              <span className={styles.detailValue}>{daysSinceOpened ?? '—'}</span>
            </div>
            <div className={styles.detail}>
              <span className={styles.detailLabel}>Capacitance</span>
              <span className={styles.detailValue}>
                <SensorIndicator data={sensorData.capacitance} type="capacitance" />
              </span>
            </div>
            <div className={styles.detail}>
              <span className={styles.detailLabel}>Model</span>
              <span className={styles.detailValue}>{device.modelNumber || '—'}</span>
            </div>
          </div>
          
          {history.length > 0 && (
            <div className={styles.history}>
              <span className={styles.historyTitle}>History ({history.length})</span>
              {history.slice(0, 5).map((h, i) => (
                <div key={i} className={styles.historyItem}>
                  <span>{h.subject?.display || 'Unknown'}</span>
                  <span className={styles.historyDates}>
                    {h.timingPeriod?.start ? new Date(h.timingPeriod.start).toLocaleDateString() : '?'}
                    {' → '}
                    {h.timingPeriod?.end ? new Date(h.timingPeriod.end).toLocaleDateString() : 'Now'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SensorIndicator({ data, type }) {
  if (!data) return <span className={styles.empty}>—</span>;
  
  const isActive = data.valueBoolean;
  const timeAgo = getTimeAgo(data.effectiveDateTime);
  
  return (
    <span className={styles.sensor}>
      <span className={`${styles.dot} ${isActive ? styles.active : ''}`} />
      <span className={styles.sensorTime}>{timeAgo}</span>
    </span>
  );
}

export function BagList({ children }) {
  return (
    <div className={styles.table}>
      <div className={styles.header}>
        <div className={styles.headerCell}>ID</div>
        <div className={styles.headerCell}>Status</div>
        <div className={styles.headerCell}>Patient</div>
        <div className={styles.headerCell}>Lifecycle</div>
        <div className={styles.headerCell}>Sensor</div>
        <div className={styles.headerCell}>Wear</div>
        <div className={styles.headerCell}></div>
      </div>
      {children}
    </div>
  );
}
