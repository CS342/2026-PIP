import styles from './AlertBanner.module.css';

export function AlertBanner({ expiredBags, onDiscard }) {
  if (!expiredBags || expiredBags.length === 0) return null;
  
  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <span className={styles.count}>{expiredBags.length}</span>
        <span className={styles.text}>
          expired bag{expiredBags.length > 1 ? 's' : ''} currently in use
        </span>
      </div>
      <div className={styles.list}>
        {expiredBags.map(bag => (
          <div key={bag.deviceId} className={styles.item}>
            <span className={styles.bagId}>{bag.bagId}</span>
            <span className={styles.arrow}>→</span>
            <span className={styles.patient}>{bag.patientName}</span>
            <span className={styles.days}>{bag.daysOverdue}d over</span>
            <button className={styles.action} onClick={() => onDiscard(bag)}>
              Discard
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
