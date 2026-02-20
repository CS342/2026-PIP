import styles from './Header.module.css';

export function Header({ onRefresh, lastUpdated }) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.title}>Bag Fleet</h1>
        {lastUpdated && (
          <span className={styles.timestamp}>
            Last sync {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
      
      <div className={styles.actions}>
        <button className={styles.btn} onClick={onRefresh}>
          Refresh
        </button>
        <a href="hospital-scanner.html" className={styles.btnPrimary}>
          New Assignment
        </a>
      </div>
    </header>
  );
}
