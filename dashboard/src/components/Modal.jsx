import styles from './Modal.module.css';

export function Modal({ isOpen, onClose, title, children, actions }) {
  if (!isOpen) return null;
  
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button className={styles.close} onClick={onClose}>×</button>
        </div>
        <div className={styles.body}>{children}</div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>
  );
}

export function DiscardModal({ isOpen, onClose, onConfirm, bagId, isExpired, patientName }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Discard Bag"
      actions={
        <>
          <button className={styles.btnCancel} onClick={onClose}>Cancel</button>
          <button className={styles.btnConfirm} onClick={onConfirm}>Discard</button>
        </>
      }
    >
      <p>Are you sure you want to discard <strong>{bagId}</strong>?</p>
      {isExpired && patientName && (
        <p className={styles.warning}>
          This expired bag is currently assigned to {patientName}. The assignment will be ended.
        </p>
      )}
    </Modal>
  );
}
