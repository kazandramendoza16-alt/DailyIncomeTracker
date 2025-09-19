// Generate income source rows dynamically
function generateIncomeRows() {
    const tbody = document.getElementById('incomeRows');
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    
    for (let i = 0; i < 12; i++) {
        const row = document.createElement('tr');
        
        // Income source cell
        const sourceCell = document.createElement('td');
        sourceCell.className = 'income-source';
        sourceCell.innerHTML = `<input type="text" placeholder="Income Source ${i + 1}" style="border: none; background: transparent; width: 100%; font-weight: bold;">`;
        row.appendChild(sourceCell);
        
        // Daily amount cells
        days.forEach((day, dayIndex) => {
            const cell = document.createElement('td');
            cell.className = 'dollar-symbol';
            cell.innerHTML = `<input type="number" class="dollar-input" data-row="${i}" data-day="${dayIndex}" step="0.01" min="0" oninput="calculateTotals()">`;
            row.appendChild(cell);
        });
        
        tbody.appendChild(row);
    }
}

// Calculate daily and weekly totals
function calculateTotals() {
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    let weeklyTotal = 0;
    
    days.forEach((day, dayIndex) => {
        let dailyTotal = 0;
        
        // Sum all inputs for this day
        const dayInputs = document.querySelectorAll(`input[data-day="${dayIndex}"]`);
        dayInputs.forEach(input => {
            const value = parseFloat(input.value) || 0;
            dailyTotal += value;
        });
        
        // Update daily total
        const dailyTotalInput = document.getElementById(`${day}Total`);
        dailyTotalInput.value = dailyTotal.toFixed(2);
        
        weeklyTotal += dailyTotal;
    });
    
    // Update weekly total
    document.getElementById('weeklyTotal').textContent = `₱${weeklyTotal.toFixed(2)}`;
}

// Set the date input to the beginning of the current week (Sunday)
function setCurrentWeek() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    
    const weekInput = document.getElementById('weekDate');
    weekInput.value = startOfWeek.toISOString().split('T')[0];
}

// Initialize the tracker when the page loads
document.addEventListener('DOMContentLoaded', function() {
    generateIncomeRows();
    setCurrentWeek();
    calculateTotals();
});

// Add event listeners for real-time calculation
document.addEventListener('input', function(e) {
    if (e.target.classList.contains('dollar-input') && !e.target.classList.contains('total-input')) {
        calculateTotals();
    }
});