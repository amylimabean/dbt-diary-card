document.addEventListener('DOMContentLoaded', () => {
    const emotions = [
        { name: "Grief", color: 'red' },
        { name: "Anxiety", color: 'red' },
        { name: "Rumination", color: 'red' },
        { name: "Fantasizing", color: 'red' },
        { name: "Business", color: 'red' },
        { name: "Knowledge Seeking", color: 'red' },
        { name: "Excitement", color: 'green' },
        { name: "Hopefulness", color: 'green' }
    ];

    const sliderDescriptions = {
        1: "Very Mild", 2: "Mild", 3: "Moderate", 4: "Slightly Strong", 5: "Strong",
        6: "Fairly Strong", 7: "Very Strong", 8: "Intense", 9: "Very Intense", 10: "Extremely Intense"
    };

    const emotionRatingsContainer = document.getElementById('emotion-ratings');
    const diaryForm = document.getElementById('diary-form');
    const entriesLog = document.getElementById('entries-log');
    const notableMomentsInput = document.getElementById('notable-moments');
    const dateDisplay = document.getElementById('date-display');
    const emailReportBtn = document.getElementById('email-report-btn');
    const showDataBtn = document.getElementById('show-data-btn');

    function initialize() {
        populateEmotionFields();
        loadEntries();
        setCurrentDateDisplay();
        diaryForm.addEventListener('submit', handleFormSubmit);
        emailReportBtn.addEventListener('click', handleEmailReport);
        showDataBtn.addEventListener('click', handleShowRawData);
    }

    function populateEmotionFields() {
        emotionRatingsContainer.innerHTML = ''; 
    
        emotions.forEach(emotion => {
            const emotionId = emotion.name.toLowerCase().replace(/\s+/g, '-');
            const emotionEntry = document.createElement('div');
            emotionEntry.classList.add('emotion-entry', `emotion-${emotion.color}`);

            emotionEntry.innerHTML = `
                <div class="emotion-label">
                    <span>${emotion.name}</span>
                    <span class="slider-value" id="${emotionId}-value">5</span>
                </div>
                <input type="range" id="${emotionId}" min="1" max="10" value="5" required>
                <div class="slider-description" id="${emotionId}-desc">${sliderDescriptions[5]}</div>
            `;
            emotionRatingsContainer.appendChild(emotionEntry);

            const slider = emotionEntry.querySelector('input[type="range"]');
            const valueDisplay = emotionEntry.querySelector('.slider-value');
            const descriptionDisplay = emotionEntry.querySelector('.slider-description');

            slider.addEventListener('input', () => {
                const value = slider.value;
                valueDisplay.textContent = value;
                descriptionDisplay.textContent = sliderDescriptions[value];
            });
        });
    }

    function getFormattedDate(date = new Date()) {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    function setCurrentDateDisplay() {
        const today = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateDisplay.textContent = today.toLocaleDateString('en-US', options);
    }

    function handleFormSubmit(event) {
        event.preventDefault();
        
        const now = new Date();
        let entryDate = new Date(now);

        // If it's before 5 AM, attribute the entry to the previous day
        if (now.getHours() < 5) {
            entryDate.setDate(entryDate.getDate() - 1);
        }

        const entry = {
            id: now.toISOString(), // Unique ID for every save
            date: getFormattedDate(entryDate), // "Logical" date for grouping
            emotions: {},
            notes: notableMomentsInput.value
        };

        emotions.forEach(emotion => {
            const emotionId = emotion.name.toLowerCase().replace(/\s+/g, '-');
            const input = document.getElementById(emotionId);
            entry.emotions[emotion.name] = input.value;
        });

        saveEntry(entry);
        loadEntries(); 
        diaryForm.reset();
        populateEmotionFields();
    }

    function saveEntry(entry) {
        const entries = getEntries();
        entries.push(entry); // Always add a new entry, never overwrite
        // Sort by the unique timestamp ID to ensure correct chronological order
        entries.sort((a, b) => new Date(b.id) - new Date(a.id)); 
        localStorage.setItem('diaryEntries', JSON.stringify(entries));
    }
    
    function getStartOfWeek(d) {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); 
        return new Date(date.setDate(diff));
    }

    function loadEntries() {
        const entries = getEntries();
        const entriesSection = document.getElementById('entries-section');
        entriesLog.innerHTML = '';

        if (entries.length === 0) {
            entriesSection.style.display = 'none';
        } else {
            entriesSection.style.display = 'block';

            const groupedEntries = entries.reduce((acc, entry) => {
                const entryDate = new Date(entry.date + 'T00:00:00');
                const weekStart = getStartOfWeek(entryDate);
                const weekStartString = getFormattedDate(weekStart);

                if (!acc[weekStartString]) {
                    acc[weekStartString] = [];
                }
                acc[weekStartString].push(entry);
                return acc;
            }, {});

            const weekKeys = Object.keys(groupedEntries).sort((a, b) => new Date(b) - new Date(a));

            for (const weekStartString of weekKeys) {
                const weekEntries = groupedEntries[weekStartString];
                const weekContainer = document.createElement('div');
                weekContainer.classList.add('week-container');

                const weekEnd = new Date(weekStartString);
                weekEnd.setDate(weekEnd.getDate() + 6);

                const options = { month: 'long', day: 'numeric' };
                const weekStartFormatted = new Date(weekStartString + 'T00:00:00').toLocaleDateString('en-US', options);
                const weekEndFormatted = weekEnd.toLocaleDateString('en-US', options);

                const weekHeader = document.createElement('h3');
                weekHeader.classList.add('week-header');
                weekHeader.textContent = `Week of ${weekStartFormatted} - ${weekEndFormatted}`;
                
                const entriesList = document.createElement('div');
                entriesList.classList.add('weekly-entries');
                // Sort entries within the week by their timestamp
                weekEntries.sort((a, b) => new Date(b.id) - new Date(a.id));
                weekEntries.forEach(entry => {
                    entriesList.appendChild(createEntryElement(entry));
                });
                
                weekContainer.appendChild(weekHeader);
                weekContainer.appendChild(entriesList);
                entriesLog.appendChild(weekContainer);
                
                weekHeader.addEventListener('click', () => {
                    weekContainer.classList.toggle('expanded');
                });
            }
        }
    }

    function getEntries() {
        const entries = localStorage.getItem('diaryEntries');
        return entries ? JSON.parse(entries) : [];
    }

    function getEmotionColor(emotionName) {
        const emotion = emotions.find(e => e.name === emotionName);
        return emotion ? emotion.color : 'default';
    }

    function createEntryElement(entry) {
        const entryElement = document.createElement('div');
        entryElement.classList.add('entry');
        
        let emotionHtml = '<ul>';
        for (const [emotion, rating] of Object.entries(entry.emotions)) {
            emotionHtml += `<li><strong>${emotion}:</strong> ${rating}</li>`;
        }
        emotionHtml += '</ul>';

        let notesHtml = '';
        if (entry.notes) {
            notesHtml = `<div class="entry-notes"><h4>Notable Moments:</h4><p>${entry.notes.replace(/\n/g, '<br>')}</p></div>`;
        }
        
        const entryTimestamp = new Date(entry.id);
        const options = { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' };

        entryElement.innerHTML = `
            <h4>${entryTimestamp.toLocaleDateString('en-US', options)}</h4>
            ${emotionHtml}
            ${notesHtml}
        `;
        return entryElement;
    }

    function handleEmailReport() {
        const entries = getEntries();
        
        // Get the last 7 entries (most recent)
        const last7Entries = entries.slice(0, 7);

        if (last7Entries.length === 0) {
            alert("No entries found.");
            return;
        }

        const recipient = 'drjohnsonpsychology@gmail.com';
        const subject = `Amy's Diary Cards - Last ${last7Entries.length} Entries`;
        
        let body = `Hi Grace,\n\nHere are my last ${last7Entries.length} diary card entries:\n\n`;

        // Sort chronologically for email (oldest first)
        const entriesForEmail = [...last7Entries].sort((a, b) => new Date(a.id) - new Date(b.id));
        entriesForEmail.forEach(entry => {
            const entryTimestamp = new Date(entry.id);
            const options = { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' };
            body += `----------------------------------------\n`;
            body += `Date: ${entryTimestamp.toLocaleDateString('en-US', options)}\n`;

            body += `Emotions:\n`;
            for (const [emotion, rating] of Object.entries(entry.emotions)) {
                body += `  - ${emotion}: ${rating}/10\n`;
            }

            if (entry.notes) {
                body += `Notable Moments:\n  - ${entry.notes}\n`;
            }
            body += `\n`;
        });
        
        const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;
    }

    function handleShowRawData() {
        const rawData = localStorage.getItem('diaryEntries');
        if (rawData) {
            alert(`Found ${JSON.parse(rawData).length} entries in storage:\n\n${rawData.substring(0, 500)}${rawData.length > 500 ? '...' : ''}`);
        } else {
            alert('No data found in localStorage');
        }
    }

    initialize();
});
