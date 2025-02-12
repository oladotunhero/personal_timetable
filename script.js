function addSubject() {
    const container = document.getElementById('subjectsContainer');
    const div = document.createElement('div');
    div.className = 'subject-input';
    div.innerHTML = `
        <input type="text" placeholder="Subject name" class="subject-name" required>
        <button onclick="removeSubject(this)">Remove</button>
    `;
    container.appendChild(div);
}

function removeSubject(button) {
    button.parentElement.remove();
}

function resetForm() {
    document.getElementById('subjectsContainer').innerHTML = `
        <div class="subject-input">
            <input type="text" placeholder="Subject name" class="subject-name" required>
            <button onclick="removeSubject(this)">Remove</button>
        </div>
    `;
    document.getElementById('startTime').value = '08:00';
    document.getElementById('endTime').value = '14:00';
    document.getElementById('breakAfter').value = '1';
    document.getElementById('breakDuration').value = '15';
    document.getElementById('timetable').querySelector('tbody').innerHTML = '';
    document.getElementById('downloadBtn').disabled = true;
}

function validateInputs() {
    const subjectInputs = document.getElementsByClassName('subject-input');
    if (subjectInputs.length === 0) {
        alert('Please add at least one subject');
        return false;
    }

    for (let input of subjectInputs) {
        const name = input.querySelector('.subject-name').value;
        if (!name) {
            alert('Please fill in all subject names');
            return false;
        }
    }

    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const breakAfter = document.getElementById('breakAfter').value;
    const breakDuration = document.getElementById('breakDuration').value;

    if (!startTime || !endTime || !breakAfter || !breakDuration) {
        alert('Please fill in all settings fields');
        return false;
    }

    if (startTime >= endTime) {
        alert('End time must be after start time');
        return false;
    }

    return true;
}

function formatTime(hours, minutes) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function generateTimeSlots(startTime, endTime, breakAfter, breakDuration) {
    const slots = [];
    let currentTime = new Date(`2000-01-01T${startTime}`);
    const endDateTime = new Date(`2000-01-01T${endTime}`);
    let hoursSinceBreak = 0;
    
    while (currentTime < endDateTime) {
        // Add current time slot
        slots.push(formatTime(currentTime.getHours(), currentTime.getMinutes()));
        
        // Calculate next time
        currentTime = new Date(currentTime.getTime() + 60 * 60000); // Add 1 hour
        hoursSinceBreak++;
        
        // Add break if needed
        if (hoursSinceBreak >= breakAfter && currentTime < endDateTime) {
            // Add break slot
            slots.push('BREAK');
            // Move time forward by break duration
            currentTime = new Date(currentTime.getTime() + breakDuration * 60000);
            hoursSinceBreak = 0;
        }
    }

    return slots;
}

function distributeSubjects(subjects, timetable) {
    const daysPerWeek = timetable.length;
    const weeks = Math.ceil(subjects.length / daysPerWeek);
    const expandedTimetable = Array(weeks).fill().map(() => 
        Array(daysPerWeek).fill().map(() => 
            Array(timetable[0].length).fill('')
        )
    );
    
    let subjectIndex = 0;
    
    // Get break indices from the time slots
    const timeSlots = generateTimeSlots(
        document.getElementById('startTime').value,
        document.getElementById('endTime').value,
        parseInt(document.getElementById('breakAfter').value),
        parseInt(document.getElementById('breakDuration').value)
    );
    
    // Distribute subjects across weeks and days
    for (let week = 0; week < weeks; week++) {
        for (let day = 0; day < daysPerWeek && subjectIndex < subjects.length; day++) {
            const subject = subjects[subjectIndex];
            
            // Fill slots for this day
            timeSlots.forEach((timeSlot, slotIndex) => {
                if (timeSlot === 'BREAK') {
                    expandedTimetable[week][day][slotIndex] = 'BREAK';
                } else {
                    expandedTimetable[week][day][slotIndex] = subject;
                }
            });
            
            subjectIndex++;
        }
    }
    
    return expandedTimetable;
}

function displayTimetable(expandedTimetable, timeSlots, daysPerWeek) {
    const tbody = document.querySelector('#timetable tbody');
    tbody.innerHTML = '';
    
    // Add week header rows
    expandedTimetable.forEach((weekData, weekIndex) => {
        const weekHeader = document.createElement('tr');
        const weekCell = document.createElement('th');
        weekCell.textContent = `Week ${weekIndex + 1}`;
        weekCell.colSpan = daysPerWeek + 1; // +1 for time column
        weekCell.style.backgroundColor = '#f0f0f0';
        weekCell.style.textAlign = 'center';
        weekHeader.appendChild(weekCell);
        tbody.appendChild(weekHeader);
        
        // Add time slots and subjects for this week
        timeSlots.forEach((time, slotIndex) => {
            const row = document.createElement('tr');
            
            // Time column
            const timeCell = document.createElement('td');
            timeCell.textContent = time;
            if (time === 'BREAK') {
                timeCell.classList.add('break');
            }
            row.appendChild(timeCell);
            
            // Day columns
            for (let day = 0; day < daysPerWeek; day++) {
                const cell = document.createElement('td');
                cell.textContent = weekData[day][slotIndex] || '-';
                if (weekData[day][slotIndex] === 'BREAK') {
                    cell.classList.add('break');
                }
                row.appendChild(cell);
            }
            
            tbody.appendChild(row);
        });
    });
}

function generate() {
    if (!validateInputs()) return;

    // Collect subjects
    const subjectInputs = document.getElementsByClassName('subject-input');
    const subjects = Array.from(subjectInputs).map(input => 
        input.querySelector('.subject-name').value
    );

    // Get settings
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const breakAfter = parseInt(document.getElementById('breakAfter').value);
    const breakDuration = parseInt(document.getElementById('breakDuration').value);
    const daysPerWeek = parseInt(document.getElementById('daysPerWeek').value);

    // Generate time slots
    const timeSlots = generateTimeSlots(startTime, endTime, breakAfter, breakDuration);

    // Initialize base timetable structure
    const baseTimetable = Array(daysPerWeek).fill().map(() => 
        Array(timeSlots.length).fill('')
    );

    // Generate expanded timetable with multiple weeks if needed
    const expandedTimetable = distributeSubjects(subjects, baseTimetable);

    // Display timetable
    displayTimetable(expandedTimetable, timeSlots, daysPerWeek);
    document.getElementById('downloadBtn').disabled = false;
}

function downloadPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const timetable = document.getElementById('timetable');
        const rows = timetable.querySelectorAll('tr');

        let yPos = 20;
        doc.setFontSize(16);
        doc.text('Personal Timetable', 105, yPos, { align: 'center' });
        yPos += 10;

        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        const breakAfter = document.getElementById('breakAfter').value;
        doc.setFontSize(10);
        doc.text(`Time: ${startTime} - ${endTime} | Break after ${breakAfter} hour(s)`, 105, yPos, { align: 'center' });
        yPos += 10;

        const timeColWidth = 25;
        const dayColWidth = 22;
        let xPos = 10;

        // Draw and fill table headers
        doc.setFillColor(240, 240, 240);
        doc.rect(xPos, yPos - 5, timeColWidth + (dayColWidth * parseInt(document.getElementById('daysPerWeek').value)), 8, 'F');

        doc.setFontSize(8);
        rows[0].querySelectorAll('th').forEach((header, index) => {
            doc.text(header.textContent, xPos + (index * dayColWidth), yPos);
            if (index === 0) xPos += timeColWidth - dayColWidth;
        });

        yPos += 8;
        xPos = 10;

        doc.setFontSize(7);
        let isWeekHeader = false;

        Array.from(rows).slice(1).forEach(row => {
            // Check if this is a week header row
            if (row.querySelector('th')) {
                isWeekHeader = true;
                const weekHeader = row.querySelector('th').textContent;
                
                // Add some spacing before week header
                yPos += 3;
                
                // Draw week header with background
                doc.setFillColor(240, 240, 240);
                doc.rect(xPos, yPos - 4, timeColWidth + (dayColWidth * parseInt(document.getElementById('daysPerWeek').value)), 5, 'F');
                doc.text(weekHeader, xPos + 2, yPos);
                
                yPos += 5;
                return;
            }

            isWeekHeader = false;
            const cells = row.querySelectorAll('td');
            xPos = 10;

            cells.forEach((cell, index) => {
                const text = cell.textContent;
                if (cell.classList.contains('break')) {
                    doc.setFillColor(255, 243, 205);
                    doc.rect(xPos - 1, yPos - 4, (index === 0 ? timeColWidth : dayColWidth), 5, 'F');
                }
                
                doc.text(text, xPos, yPos);
                
                if (index === 0) {
                    xPos += timeColWidth;
                } else {
                    xPos += dayColWidth;
                }
            });

            yPos += 7;

            if (yPos > 280) {
                doc.addPage();
                yPos = 20;
            }
        });

        doc.save('timetable.pdf');
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF. Please try again.');
    }
}