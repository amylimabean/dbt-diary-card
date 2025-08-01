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

    function initialize() {
        populateEmotionFields();
        loadEntries();
        setCurrentDateDisplay();
        diaryForm.addEventListener('submit', handleFormSubmit);
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
        
        const entry = {
            date: getFormattedDate(),
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
        const index = entries.findIndex(e => e.date === entry.date);
        if (index > -1) {
            entries[index] = entry; 
        } else {
            entries.push(entry);
        }
        entries.sort((a, b) => new Date(b.date) - new Date(a.date));
        localStorage.setItem('diaryEntries', JSON.stringify(entries));
    }
    
    function getStartOfWeek(d) {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        return new Date(date.setDate(diff));
    }

    function loadEntries() {
        const entries = getEntries();
        entriesLog.innerHTML = '<h2>Past Entries</h2>';
        if (entries.length === 0) {
            entriesLog.parentElement.style.display = 'none';
        } else {
            entriesLog.parentElement.style.display = 'block';

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

            for (const weekStartString in groupedEntries) {
                const weekEntries = groupedEntries[weekStartString];
                const weekContainer = document.createElement('div');
                weekContainer.classList.add('week-container');

                const weekEnd = new Date(weekStartString);
                weekEnd.setDate(weekEnd.getDate() + 6);

                const options = { month: 'long', day: 'numeric' };
                const weekStartFormatted = new Date(weekStartString + 'T00:00:00').toLocaleDateString('en-US', options);
                const weekEndFormatted = weekEnd.toLocaleDateString('en-US', options);

                weekContainer.innerHTML = `<h3 class="week-header">Week of ${weekStartFormatted} - ${weekEndFormatted}</h3>`;
                
                const entriesList = document.createElement('div');
                entriesList.classList.add('weekly-entries');
                weekEntries.forEach(entry => {
                    entriesList.appendChild(createEntryElement(entry));
                });
                weekContainer.appendChild(entriesList);
                entriesLog.appendChild(weekContainer);
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
            const color = getEmotionColor(emotion);
            emotionHtml += `<li><div class="emotion-indicator indicator-${color}"></div><strong>${emotion}:</strong> ${rating}</li>`;
        }
        emotionHtml += '</ul>';

        let notesHtml = '';
        if (entry.notes) {
            notesHtml = `<div class="entry-notes"><h4>Notable Moments:</h4><p>${entry.notes.replace(/\n/g, '<br>')}</p></div>`;
        }

        const displayDate = new Date(entry.date + 'T00:00:00');
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

        entryElement.innerHTML = `
            <h4>${displayDate.toLocaleDateString('en-US', options)}</h4>
            ${emotionHtml}
            ${notesHtml}
        `;
        return entryElement;
    }

    initialize();
});
