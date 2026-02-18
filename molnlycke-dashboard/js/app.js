// 1. INITIALIZE: Wait for the page to load
document.addEventListener('DOMContentLoaded', () => {
    populateHospitalSelector();
    updateDashboard(); // Run once at start

    // Listen for changes in the dropdown
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

    // --- UPDATE THE UI CARDS ---
    document.getElementById('kpi-total-purchased').textContent = totalPurchased;
    document.getElementById('kpi-scan-compliance').textContent = `${complianceRate}%`;
    document.getElementById('kpi-active-count').textContent = `${scannedCount} scanned at least once`;
    document.getElementById('kpi-avg-scans').textContent = avgScans;
    document.getElementById('kpi-utilization-ratio').textContent = `${utilRatio}%`;

    // --- RENDER THE TABLE ---
    renderTable(filteredInventory);
    // --- RENDER THE CHART ---
    renderChart(filteredInventory);
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
        const lifespanStyle = daysRemaining < 10 ? 'style="color: #d32f2f; font-weight: bold;"' : '';

        const row = `
            <tr>
                <td><strong>${item.serial_number}</strong></td>
                <td>${item.batch}</td>
                <td>${firstScanDate.toLocaleDateString()}</td>
                <td>${item.scans.length > 1 ? new Date(item.scans[item.scans.length-1]).toLocaleDateString() : 'N/A'}</td>
                <td>${item.scans.length}</td>
                <td>${usePercentage}% Active</td>
                <td ${lifespanStyle}>${daysRemaining} Days</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function renderChart(items) {
    const chartContainer = document.getElementById('reuseHistogram');
    chartContainer.innerHTML = ''; 

    const actualBagsUsed = items.length;
    const totalPotentialWaste = items.reduce((sum, item) => sum + item.scans.length, 0);
    const bagsSaved = totalPotentialWaste - actualBagsUsed; //

    // Create a side-by-side comparison that actually makes sense
    const data = [
        { label: 'Bags Used', value: actualBagsUsed, color: '#00754a' },
        { label: 'Bags Saved', value: bagsSaved, color: '#66bb6a' }
    ];

    const maxVal = Math.max(actualBagsUsed, bagsSaved, 1);

    data.forEach(point => {
        const height = (point.value / maxVal) * 100;
        const bar = document.createElement('div');
        bar.style.cssText = `display:flex; flex-direction:column; align-items:center; height:100%; justify-content:flex-end; width:40%;`;
        bar.innerHTML = `
            <span style="font-weight:bold; margin-bottom:5px;">${point.value}</span>
            <div style="height:${height}%; width:100%; background-color:${point.color}; border-radius:4px 4px 0 0;"></div>
            <span style="font-size:11px; margin-top:10px; text-align:center;">${point.label}</span>
        `;
        chartContainer.appendChild(bar);
    });
}