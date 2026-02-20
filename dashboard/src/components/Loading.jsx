import styles from './Loading.module.css';

export function Loading({ message = 'Loading...' }) {
  return (
    <div className={styles.container}>
      <div className={styles.spinner} />
      <p>{message}</p>
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div className={styles.error}>
      <p>Error: {message}</p>
    </div>
  );
}
