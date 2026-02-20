import { useState, useMemo } from 'react';
import { 
  Header, 
  StatsCard, 
  StatsGrid, 
  BagCard, 
  BagList, 
  DiscardModal, 
  AlertBanner, 
  FilterTabs,
  Loading,
  ErrorState
} from './components';
import { 
  useMedplum, 
  calculateDaysSinceOpened, 
  getOpenedDate, 
  isDiscarded, 
  findCurrentUseStatement 
} from './hooks/useMedplum';
import styles from './App.module.css';

function App() {
  const { devices, useStatements, pressureMap, loading, error, lastUpdated, loadData, discardDevice, restoreDevice } = useMedplum();
  const [filter, setFilter] = useState('active');
  const [discardModal, setDiscardModal] = useState({ open: false, device: null, bagId: '', isExpired: false, patientName: '' });

  const processedDevices = useMemo(() => {
    return devices.map(device => {
      const bagId = device.identifier?.[0]?.value || device.id;
      const openedDate = getOpenedDate(device);
      const daysSinceOpened = openedDate ? calculateDaysSinceOpened(openedDate) : null;
      const daysRemaining = daysSinceOpened !== null ? 90 - daysSinceOpened : null;
      const discarded = isDiscarded(device);
      const currentUse = findCurrentUseStatement(device, useStatements);

      const history = useStatements.filter(us => {
        const deviceRef = us.device.reference;
        const bagIdentifier = device.identifier?.[0]?.value;
        return deviceRef.includes(device.id) || (bagIdentifier && deviceRef.includes(bagIdentifier));
      }).sort((a, b) => new Date(b.recordedOn) - new Date(a.recordedOn));

      let status = 'available';
      if (discarded) {
        status = 'discarded';
      } else if (daysRemaining !== null && daysRemaining < 0) {
        status = currentUse ? 'expired-in-use' : 'expired';
      } else if (currentUse) {
        status = 'in-use';
      }

      const isGhostUse = !discarded && !currentUse && pressureMap[device.id]?.valueBoolean === true;

      const uniquePatients = new Set(history.map(h => h.subject?.reference).filter(Boolean)).size;
      const totalUses = history.length;

      let shelfDays = null;
      if (!currentUse && openedDate) {
        const completedWithEnd = history.filter(h => h.timingPeriod?.end);
        if (completedWithEnd.length > 0) {
          const lastEnd = new Date(completedWithEnd[0].timingPeriod.end);
          shelfDays = Math.floor((new Date() - lastEnd) / (1000 * 60 * 60 * 24));
        } else {
          shelfDays = daysSinceOpened;
        }
      }

      return { device, bagId, daysSinceOpened, daysRemaining, discarded, currentUse, history, status, isGhostUse, uniquePatients, totalUses, shelfDays };
    }).sort((a, b) => {
      if (a.isGhostUse !== b.isGhostUse) return a.isGhostUse ? -1 : 1;
      return a.bagId.localeCompare(b.bagId);
    });
  }, [devices, useStatements, pressureMap]);

  const filteredDevices = useMemo(() => {
    if (filter === 'active') return processedDevices.filter(d => !d.discarded);
    if (filter === 'discarded') return processedDevices.filter(d => d.discarded);
    return processedDevices;
  }, [processedDevices, filter]);

  const stats = useMemo(() => {
    const active = processedDevices.filter(d => !d.discarded);
    const inUse = active.filter(d => d.currentUse !== null);
    const expiredInUse = active.filter(d => d.status === 'expired-in-use');
    return {
      total: active.length,
      inUse: inUse.length,
      available: active.length - inUse.length,
      expiredInUse: expiredInUse.length
    };
  }, [processedDevices]);

  const expiredBagsInUse = useMemo(() => {
    return processedDevices
      .filter(d => d.status === 'expired-in-use')
      .map(d => ({
        device: d.device,
        deviceId: d.device.id,
        bagId: d.bagId,
        patientName: d.currentUse?.subject?.display || d.currentUse?.subject?.reference || 'Unknown',
        daysOverdue: Math.abs(d.daysRemaining)
      }));
  }, [processedDevices]);

  const handleOpenDiscard = (device, bagId, isExpired, patientName) => {
    setDiscardModal({ open: true, device, bagId, isExpired, patientName });
  };

  const handleConfirmDiscard = async () => {
    if (discardModal.device) {
      await discardDevice(discardModal.device);
    }
    setDiscardModal({ open: false, device: null, bagId: '', isExpired: false, patientName: '' });
  };

  const handleRestore = async (device) => {
    if (confirm(`Restore this bag back to active circulation?`)) {
      await restoreDevice(device);
    }
  };

  if (error) {
    return (
      <div className={styles.app}>
        <Header onRefresh={loadData} lastUpdated={lastUpdated} />
        <main className={styles.main}>
          <ErrorState message={error} />
        </main>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <Header onRefresh={loadData} lastUpdated={lastUpdated} />
      
      <main className={styles.main}>
        <AlertBanner 
          expiredBags={expiredBagsInUse} 
          onDiscard={(bag) => handleOpenDiscard(bag.device, bag.bagId, true, bag.patientName)} 
        />
        
        <StatsGrid>
          <StatsCard label="Total" value={loading ? '—' : stats.total} />
          <StatsCard label="In Use" value={loading ? '—' : stats.inUse} />
          <StatsCard label="Available" value={loading ? '—' : stats.available} />
          <StatsCard label="Expired" value={loading ? '—' : stats.expiredInUse} danger={stats.expiredInUse > 0} />
        </StatsGrid>
        
        <FilterTabs current={filter} onChange={setFilter} />
        
        {loading ? (
          <Loading message="Loading data..." />
        ) : (
          <BagList>
            {filteredDevices.length > 0 ? (
              filteredDevices.map(({ device, bagId, status, currentUse, daysSinceOpened, daysRemaining, history, discarded, isGhostUse, uniquePatients, totalUses, shelfDays }) => (
                <BagCard
                  key={device.id}
                  device={device}
                  bagId={bagId}
                  status={status}
                  currentUse={currentUse}
                  daysSinceOpened={daysSinceOpened}
                  daysRemaining={daysRemaining}
                  history={history}
                  isDiscarded={discarded}
                  isGhostUse={isGhostUse}
                  uniquePatients={uniquePatients}
                  totalUses={totalUses}
                  shelfDays={shelfDays}
                  onDiscard={() => handleOpenDiscard(
                    device,
                    bagId,
                    daysRemaining < 0 && currentUse,
                    currentUse?.subject?.display || currentUse?.subject?.reference || ''
                  )}
                  onRestore={() => handleRestore(device)}
                />
              ))
            ) : (
              <div className={styles.empty}>No bags found</div>
            )}
          </BagList>
        )}
      </main>
      
      <DiscardModal
        isOpen={discardModal.open}
        onClose={() => setDiscardModal({ open: false, device: null, bagId: '', isExpired: false, patientName: '' })}
        onConfirm={handleConfirmDiscard}
        bagId={discardModal.bagId}
        isExpired={discardModal.isExpired}
        patientName={discardModal.patientName}
      />
    </div>
  );
}

export default App;
