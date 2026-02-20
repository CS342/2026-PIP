import styles from './FilterTabs.module.css';

export function FilterTabs({ current, onChange }) {
  const tabs = [
    { id: 'active', label: 'Active' },
    { id: 'discarded', label: 'Discarded' },
    { id: 'all', label: 'All' }
  ];
  
  return (
    <div className={styles.tabs}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`${styles.tab} ${current === tab.id ? styles.active : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
