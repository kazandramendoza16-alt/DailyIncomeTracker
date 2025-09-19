// Track the number of rows
let rowCount = 0;

// Generate a single income row
function createIncomeRow(rowIndex) {
    const row = document.createElement('tr');
    row.setAttribute('data-row-id', rowIndex);
    
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    
    // Income source cell with delete button
    const sourceCell = document.createElement('td');
    sourceCell.className = 'income-source';
    sourceCell.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between;">
            <input type="text" placeholder="Income Source ${rowIndex + 1}" 
                   style="border: none; background: transparent; font-weight: bold; flex: 1;">
            <button class="delete-row-btn" onclick="deleteRow(${rowIndex})" title="Delete Row">×</button>
        </div>
    `;
    row.appendChild(sourceCell);
    
    // Daily amount cells
    days.forEach((day, dayIndex) => {
        const cell = document.createElement('td');
        cell.className = 'dollar-symbol';
        cell.innerHTML = `<input type="number" class="dollar-input" data-row="${rowIndex}" data-day="${dayIndex}" step="0.01" min="0" oninput="calculateTotals()">`;
        row.appendChild(cell);
    });
    
    return row;
}

// Add a new income row
function addIncomeRow() {
    const tbody = document.getElementById('incomeRows');
    const newRow = createIncomeRow(rowCount);
    tbody.appendChild(newRow);
    rowCount++;
}

// Delete a specific row
function deleteRow(rowIndex) {
    const rowToDelete = document.querySelector(`tr[data-row-id="${rowIndex}"]`);
    if (rowToDelete) {
        rowToDelete.remove();
        calculateTotals(); // Recalculate totals after deletion
    }
}

// Add multiple initial rows
function generateInitialRows(count = 5) {
    for (let i = 0; i < count; i++) {
        addIncomeRow();
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
        if (dailyTotalInput) {
            dailyTotalInput.value = dailyTotal.toFixed(2);
        }
        
        weeklyTotal += dailyTotal;
    });
    
    // Update weekly total with peso sign
    const weeklyTotalElement = document.getElementById('weeklyTotal');
    if (weeklyTotalElement) {
        weeklyTotalElement.textContent = `₱${weeklyTotal.toFixed(2)}`;
    }
}

// Set current week date
function setCurrentWeek() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    
    const weekInput = document.getElementById('weekDate');
    if (weekInput) {
        weekInput.value = startOfWeek.toISOString().split('T')[0];
    }
}

// Create add row button
function createAddRowButton() {
    const container = document.querySelector('.container');
    const addButton = document.createElement('button');
    addButton.textContent = '+ Add Income Source';
    addButton.className = 'add-row-btn';
    addButton.onclick = addIncomeRow;
    
    // Insert before the print button
    const printButton = document.querySelector('.print-btn');
    container.insertBefore(addButton, printButton);
}

// Initialize the tracker
document.addEventListener('DOMContentLoaded', function() {
    generateInitialRows(5); // Start with 5 rows
    createAddRowButton();
    setCurrentWeek();
    calculateTotals();
    
    // Add event listener for dynamic input calculation
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('dollar-input') && !e.target.classList.contains('total-input')) {
            calculateTotals();
        }
    });
});

// Add a function to get the current week's start date from the input
function getWeekStartDate() {
    const weekInput = document.getElementById('weekDate');
    return weekInput ? weekInput.value : '';
}

function saveIncomeData() {
    const allRows = document.querySelectorAll('#incomeRows tr');
    const incomeData = [];
    const weekStartDate = getWeekStartDate(); // Get the date from the input
    
    // Add this line to debug:
    console.log("Week Start Date being sent:", weekStartDate); 

    if (weekStartDate === '') {
        alert("Please select a week start date before saving.");
        return; // Stop the function from proceeding
    }

    allRows.forEach(row => {
        const sourceInput = row.querySelector('.income-source input');
        const dailyInputs = row.querySelectorAll('.dollar-input');
        
        const rowData = {
            source: sourceInput.value || '',
            daily_income: []
        };
        
        dailyInputs.forEach(input => {
            rowData.daily_income.push(parseFloat(input.value) || 0);
        });

        incomeData.push(rowData);
    });

    const weeklyTotalElement = document.getElementById('weeklyTotal');
    const weeklyTotal = parseFloat(weeklyTotalElement.textContent.replace('₱', '')) || 0;

    // Send the data, including the new date field
    fetch('http://localhost/DAILYINCOMETRACKER/save_income.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            rows: incomeData,
            weekly_total: weeklyTotal,
            week_start_date: weekStartDate // Pass the week start date
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Data saved successfully!');
            alert('Data saved successfully!');
        } else {
            console.error('Error saving data:', data.message);
            alert('Failed to save data: ' + data.message);
        }
    })
    .catch((error) => {
        console.error('Network or server error:', error);
        alert('An error occurred. Please check the console.');
    });
}