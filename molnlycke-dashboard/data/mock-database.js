/**
 * MÖLNLYCKE MASTER DATABASE (Procedurally Generated)
 * Context Date: Feb 18, 2026
 * * This script generates realistic data points to track:
 * 1. Usage Cycles (Scans)
 * 2. Lifespan (Days remaining of 90-day limit)
 * 3. Shelf Time vs. Use Time (Simulating Capacitive Sensor)
 */

// --- 1. CONFIGURATION: The "Story" for each hospital ---
const CLIENTS = [
    {
        id: "hosp_001",
        name: "Stanford Health Care",
        total_purchased: 350,
        compliance_target: 0.65,
        behavior_profile: "mixed",
        lat: 37.4419, lng: -122.1430  // Palo Alto, CA
    },
    {
        id: "hosp_002",
        name: "UCSF Medical Center",
        total_purchased: 150,
        compliance_target: 0.92,
        behavior_profile: "hero",
        lat: 41.8781, lng: -87.6298   // Chicago, IL (mock spread)
    },
    {
        id: "hosp_003",
        name: "Kaiser Permanente",
        total_purchased: 500,
        compliance_target: 0.15,
        behavior_profile: "villain",
        lat: 29.7604, lng: -95.3698   // Houston, TX (mock spread)
    }
];

// --- 2. DATA GENERATOR FUNCTIONS ---

/**
 * Generates an array of ISO dates representing usage events.
 */
function generateDates(scanCount) {
    const dates = [];
    const startTimestamp = new Date("2025-11-20").getTime();
    const endTimestamp = new Date("2026-02-18").getTime();
    let current = startTimestamp + Math.random() * (endTimestamp - startTimestamp);

    for (let i = 0; i < scanCount; i++) {
        dates.push(new Date(current).toISOString());
        // Bags are typically scanned every few days during use cycles
        current += (2 + Math.random() * 8) * (24 * 60 * 60 * 1000); 
    }
    return dates;
}

/**
 * Determines how many times a bag was reused based on hospital profile.
 * High scan counts = Successful multi-patient use.
 */
function getScanCount(profile) {
    const r = Math.random();
    
    if (profile === "hero") {
        if (r < 0.05) return 1; 
        if (r < 0.20) return 2;
        if (r < 0.40) return 3;
        return 4 + Math.floor(Math.random() * 4); // High reuse (4-7)
    } 
    else if (profile === "villain") {
        if (r < 0.80) return 1; // 80% are single-use
        if (r < 0.95) return 2;
        return 3; 
    } 
    else {
        if (r < 0.20) return 1;
        if (r < 0.50) return 2;
        if (r < 0.80) return 3;
        return 4 + Math.floor(Math.random() * 2);
    }
}

/**
 * MOCK SENSOR DATA: Generates "Active Use Hours" based on days since opening.
 * This simulates a capacitive sensor detecting a human on the bag.
 */
function generateActiveHours(firstScan, profile) {
    const today = new Date("2026-02-18");
    const diffDays = Math.floor(Math.abs(today - new Date(firstScan)) / (1000 * 60 * 60 * 24));
    const totalPossibleHours = diffDays * 24;

    let usePercentage;
    if (profile === "hero") usePercentage = 0.4 + Math.random() * 0.3; // 40-70% efficiency
    else if (profile === "villain") usePercentage = 0.05 + Math.random() * 0.1; // 5-15% efficiency
    else usePercentage = 0.15 + Math.random() * 0.25; // 15-40% efficiency

    return Math.floor(totalPossibleHours * usePercentage);
}

/**
 * Loops through clients and creates the inventory logs.
 */
function generateInventory() {
    let allInventory = [];

    CLIENTS.forEach(client => {
        const activeCount = Math.floor(client.total_purchased * client.compliance_target);
        
        for (let i = 0; i < activeCount; i++) {
            const scansNeeded = getScanCount(client.behavior_profile);
            const scanDates = generateDates(scansNeeded);
            
            allInventory.push({
                serial_number: `MP-${Math.floor(1000 + Math.random() * 9000)}-${client.id.slice(-2)}`,
                client_id: client.id,
                batch: Math.random() > 0.5 ? "BATCH-JAN" : "BATCH-FEB",
                scans: scanDates,
                // New Mock Sensor Data Property:
                active_use_hours: generateActiveHours(scanDates[0], client.behavior_profile)
            });
        }
    });

    return allInventory;
}

// --- 3. EXPORT THE MASTER DATABASE ---
const MASTER_DATABASE = {
    clients: CLIENTS,
    inventory: generateInventory()
};

// Expose to window so app.js can access data without complex imports
window.MOLNLYCKE_DB = MASTER_DATABASE;