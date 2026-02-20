// MAP STATE
let map = null;
let mapMarkers = [];

function initMap() {
    map = L.map('usMap', { zoomControl: true, scrollWheelZoom: false })
            .setView([39.5, -98.35], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);
}

function updateMap(selectedId) {
    mapMarkers.forEach(m => map.removeLayer(m));
    mapMarkers = [];

    MOLNLYCKE_DB.clients.forEach(client => {
        const bagCount = MOLNLYCKE_DB.inventory.filter(i => i.client_id === client.id).length;
        const highlighted = selectedId === 'all' || selectedId === client.id;
        const marker = L.circleMarker([client.lat, client.lng], {
            radius: Math.max(10, Math.sqrt(bagCount) * 1.8),
            fillColor: highlighted ? '#00754a' : '#aaa',
            color: '#fff',
            weight: 2,
            fillOpacity: highlighted ? 0.85 : 0.35
        }).addTo(map);
        marker.bindPopup(`<strong>${client.name}</strong><br>${bagCount} active positioners`);
        mapMarkers.push(marker);
    });
}

// 1. INITIALIZE: Wait for the page to load
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    populateHospitalSelector();
    updateDashboard();
    document.getElementById('hospitalSelect').addEventListener('change', updateDashboard);
});

// 2. DATA SELECTOR: Fill the dropdown from our database
function populateHospitalSelector() {
    const selector = document.getElementById('hospitalSelect');
    // Add "All Hospitals" option
    selector.innerHTML = '<option value="all">All Accounts (Aggregate)</option>';
    
    // Add specific hospitals from the data
    MOLNLYCKE_DB.clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = client.name;
        selector.appendChild(option);
    });
}

// 3. THE "BRAIN": Calculate and display metrics
function updateDashboard() {
    const selectedId = document.getElementById('hospitalSelect').value;
    
    // FILTER: Get only the inventory for the selected hospital
    const filteredInventory = selectedId === 'all' 
        ? MOLNLYCKE_DB.inventory 
        : MOLNLYCKE_DB.inventory.filter(item => item.client_id === selectedId);

    // AGGREGATE: Get total purchased units for the selected context
    const totalPurchased = selectedId === 'all'
        ? MOLNLYCKE_DB.clients.reduce((sum, c) => sum + c.total_purchased, 0)
        : MOLNLYCKE_DB.clients.find(c => c.id === selectedId).total_purchased;

    // --- CALCULATIONS ---
    
    // Adoption / Compliance
    const scannedCount = filteredInventory.length;
    const complianceRate = ((scannedCount / totalPurchased) * 100).toFixed(1);

    // Re-use Rate (Avg Scans per Bag)
    const totalScans = filteredInventory.reduce((sum, item) => sum + item.scans.length, 0);
    const avgScans = scannedCount > 0 ? (totalScans / scannedCount).toFixed(1) : 0;

    // Use vs. Shelf Ratio (Aggregate)
    let totalActiveHours = 0;
    let totalPossibleHours = 0;

    filteredInventory.forEach(item => {
        const first = new Date(item.scans[0]);
        const now = new Date("2026-02-18"); // Hardcoded "today" for demo consistency
        const diffHours = Math.abs(now - first) / (1000 * 60 * 60);
        
        totalPossibleHours += diffHours;
        totalActiveHours += (item.active_use_hours || 0); 
    });

    const utilRatio = totalPossibleHours > 0 
        ? ((totalActiveHours / totalPossibleHours) * 100).toFixed(1) 
        : 0;

    // Expiring Soon count (<10 days remaining)
    const today = new Date("2026-02-18");
    const expiringSoonCount = filteredInventory.filter(item => {
        const daysSince = Math.floor(Math.abs(today - new Date(item.scans[0])) / (1000 * 60 * 60 * 24));
        const remaining = 90 - daysSince;
        return remaining >= 0 && remaining < 10;
    }).length;

    // --- UPDATE THE UI CARDS ---
    document.getElementById('kpi-total-purchased').textContent = totalPurchased;
    document.getElementById('kpi-scan-compliance').textContent = `${complianceRate}%`;
    document.getElementById('kpi-active-count').textContent = `${scannedCount} scanned at least once`;
    document.getElementById('kpi-avg-scans').textContent = avgScans;
    document.getElementById('kpi-utilization-ratio').textContent = `${utilRatio}%`;
    document.getElementById('kpi-expiring-soon').textContent = expiringSoonCount;
    document.getElementById('kpi-expiring-trend').textContent = expiringSoonCount === 1 ? '1 bag needs attention' : `${expiringSoonCount} bags need attention`;

    // Bags Saved (multi-patient reuse)
    const totalScansForSaved = filteredInventory.reduce((sum, item) => sum + item.scans.length, 0);
    const bagsSaved = totalScansForSaved - filteredInventory.length;
    document.getElementById('kpi-bags-saved').textContent = bagsSaved;

    // --- RENDER THE TABLE ---
    renderTable(filteredInventory);
    // --- UPDATE THE MAP ---
    updateMap(selectedId);
}

// 4. TABLE GENERATOR: Create the rows
function renderTable(items) {
    const tbody = document.getElementById('inventoryTableBody');
    tbody.innerHTML = ''; 

    items.forEach(item => {
        const firstScanDate = new Date(item.scans[0]);
        const today = new Date("2026-02-18");
        
        // A. Calculate Lifespan (90 Day Hard Stop from first scan)
        const daysSinceFirstScan = Math.floor(Math.abs(today - firstScanDate) / (1000 * 60 * 60 * 24));
        const daysRemaining = Math.max(0, 90 - daysSinceFirstScan);
        
        // B. Calculate Use vs Shelf (Active sensor time vs. time since first scan)
        const totalPossibleHours = Math.max(1, daysSinceFirstScan * 24);
        const activeHours = item.active_use_hours || 0;
        const usePercentage = ((activeHours / totalPossibleHours) * 100).toFixed(0);

        // Styling for the lifespan warning
        const isExpiringSoon = daysRemaining >= 0 && daysRemaining < 10;
        const rowClass = isExpiringSoon ? 'class="row-expiring"' : '';
        const lifespanCell = isExpiringSoon
            ? `<td style="color:#d32f2f;font-weight:bold;">⚠ ${daysRemaining} Days</td>`
            : `<td>${daysRemaining} Days</td>`;

        const row = `
            <tr ${rowClass}>
                <td><strong>${item.serial_number}</strong></td>
                <td>${item.batch}</td>
                <td>${firstScanDate.toLocaleDateString()}</td>
                <td>${item.scans.length > 1 ? new Date(item.scans[item.scans.length-1]).toLocaleDateString() : 'N/A'}</td>
                <td>${item.scans.length}</td>
                <td>${usePercentage}% Active</td>
                ${lifespanCell}
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function exportCSV() {
    const selectedId = document.getElementById('hospitalSelect').value;
    const items = selectedId === 'all'
        ? MOLNLYCKE_DB.inventory
        : MOLNLYCKE_DB.inventory.filter(i => i.client_id === selectedId);

    const today = new Date("2026-02-18");
    const rows = [['Serial ID', 'Batch', 'Client', 'First Scan', 'Last Scan', 'Total Scans', 'Days Remaining', 'Active Use Hours']];
    items.forEach(item => {
        const client = MOLNLYCKE_DB.clients.find(c => c.id === item.client_id);
        const firstScan = new Date(item.scans[0]);
        const lastScan = new Date(item.scans[item.scans.length - 1]);
        const daysSince = Math.floor(Math.abs(today - firstScan) / (1000 * 60 * 60 * 24));
        const daysRemaining = Math.max(0, 90 - daysSince);
        rows.push([
            item.serial_number, item.batch, client ? client.name : item.client_id,
            firstScan.toLocaleDateString(), lastScan.toLocaleDateString(),
            item.scans.length, daysRemaining, item.active_use_hours || 0
        ]);
    });

    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `molnlycke-bag-logs-${selectedId}.csv`;
    a.click();
}