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
    // Check if the button already exists to prevent duplicates
    if (document.querySelector('.add-row-btn')) {
        return;
    }

    const container = document.querySelector('.tracker-container');
    const addButton = document.createElement('button');
    addButton.textContent = '+ Add Income Source';
    addButton.className = 'add-row-btn';
    addButton.onclick = addIncomeRow;

    // Insert the button at the end of tracker-container
    container.appendChild(addButton);
}

// Initialize the tracker
document.addEventListener('DOMContentLoaded', function() {
    generateInitialRows(5); // Start with 5 rows
    createAddRowButton();
    setCurrentWeek();
    calculateTotals();

    // Add a change event listener to the date input
    document.getElementById('weekDate').addEventListener('change', loadIncomeData);

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

// Function to load data from the database for the selected week
function loadIncomeData() {
    const weekStartDate = document.getElementById('weekDate').value;
    if (!weekStartDate) {
        // If no date is selected, clear the table and exit
        clearTable();
        calculateTotals();
        return;
    }

    // Fetch data for the selected week from your PHP script
    fetch(`http://localhost/DAILYINCOMETRACKER/fetch_income.php?week_start_date=${weekStartDate}`)
    .then(response => response.json())
    .then(data => {
        if (data.success && data.data.length > 0) {
            renderTableData(data.data);
            calculateTotals();
        } else {
            // If no data is found, clear the table
            clearTable();
            generateInitialRows(5);
            calculateTotals();
        }
    })
    .catch(error => {
        console.error('Error fetching data:', error);
        alert('An error occurred while loading data.');
    });
}

// Helper function to clear all existing rows
function clearTable() {
    const tbody = document.getElementById('incomeRows');
    tbody.innerHTML = '';
    rowCount = 0; // Reset the row counter
}

// Helper function to render data into the table
function renderTableData(data) {
    clearTable();
    const tbody = document.getElementById('incomeRows');
    data.forEach((rowData, index) => {
        const row = document.createElement('tr');
        row.setAttribute('data-row-id', index);

        // Income source cell
        const sourceCell = document.createElement('td');
        sourceCell.className = 'income-source';
        sourceCell.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <input type="text" value="${rowData.income_source}"
                       style="border: none; background: transparent; font-weight: bold; flex: 1;">
                <button class="delete-row-btn" onclick="deleteRow(${index})" title="Delete Row">×</button>
            </div>
        `;
        row.appendChild(sourceCell);

        // Daily amount cells
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        days.forEach((day, dayIndex) => {
            const cell = document.createElement('td');
            cell.className = 'dollar-symbol';
            cell.innerHTML = `<input type="number" class="dollar-input" data-row="${index}" data-day="${dayIndex}" step="0.01" min="0" value="${rowData[day] || 0}" oninput="calculateTotals()">`;
            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });
    rowCount = data.length; // Update the row counter
}