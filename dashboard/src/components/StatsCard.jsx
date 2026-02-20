import styles from './StatsCard.module.css';

export function StatsCard({ label, value, danger }) {
  return (
    <div className={`${styles.stat} ${danger ? styles.danger : ''}`}>
      <span className={styles.value}>{value}</span>
      <span className={styles.label}>{label}</span>
    </div>
  );
}

export function StatsGrid({ children }) {
  return <div className={styles.bar}>{children}</div>;
}
