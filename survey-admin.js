// DOM elements
const surveyIdInput = document.getElementById('surveyId-input');
const tokenInput = document.getElementById('token-input');
const loadBtn = document.getElementById('load-responses-btn');
const statusEl = document.getElementById('status');
const resultsContainer = document.getElementById('results-container');
const surveyTitleEl = document.getElementById('survey-title');
const totalCountEl = document.getElementById('total-count');
const responsesTableWrapper = document.getElementById('responses-table-wrapper');

// Utility functions
function showElement(element) {
    element.style.display = 'block';
}

function hideElement(element) {
    element.style.display = 'none';
}

function showStatus(message, isError = false) {
    statusEl.textContent = message;
    statusEl.className = isError ? 'message error' : 'message success';
    showElement(statusEl);
}

function hideStatus() {
    hideElement(statusEl);
}

// Get surveyId from URL
function getSurveyIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('surveyId');
}

// Pre-fill surveyId if in URL
function initializePage() {
    const surveyId = getSurveyIdFromURL();
    if (surveyId) {
        surveyIdInput.value = surveyId;
    }
}

// Format date/time
function formatDateTime(isoString) {
    const date = new Date(isoString);

    // Format: MM/DD/YYYY HH:MM AM/PM
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };

    return date.toLocaleString('en-US', options);
}

// Fetch survey responses
async function fetchSurveyResponses(surveyId, adminToken) {
    try {
        const response = await fetch(
            `${BACKEND_BASE_URL}/api/surveys/${surveyId}/responses`,
            {
                headers: {
                    'x-admin-token': adminToken
                }
            }
        );

        if (response.status === 401) {
            showStatus('Invalid admin token.', true);
            return null;
        }

        if (response.status === 404) {
            showStatus('Survey not found.', true);
            return null;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();

    } catch (error) {
        console.error('Error fetching survey responses:', error);
        showStatus('Failed to load responses. Please check your connection and try again.', true);
        return null;
    }
}

// Render responses table
function renderResponses(data) {
    const { title, questions, responses, totalResponses } = data;

    // Update title and count
    surveyTitleEl.textContent = title;
    totalCountEl.textContent = totalResponses;

    // Create table
    const table = document.createElement('table');
    table.id = 'responses-table';

    // Create thead
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    // Name column
    const nameHeader = document.createElement('th');
    nameHeader.textContent = 'Name';
    headerRow.appendChild(nameHeader);

    // Submitted At column
    const timeHeader = document.createElement('th');
    timeHeader.textContent = 'Submitted At';
    headerRow.appendChild(timeHeader);

    // Question columns
    questions.forEach((question, index) => {
        const questionHeader = document.createElement('th');
        questionHeader.textContent = `Q${index + 1}: ${question}`;
        headerRow.appendChild(questionHeader);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create tbody
    const tbody = document.createElement('tbody');

    if (responses.length === 0) {
        const emptyRow = document.createElement('tr');
        const emptyCell = document.createElement('td');
        emptyCell.colSpan = 2 + questions.length;
        emptyCell.textContent = 'No responses yet';
        emptyCell.style.textAlign = 'center';
        emptyCell.style.color = '#999';
        emptyRow.appendChild(emptyCell);
        tbody.appendChild(emptyRow);
    } else {
        responses.forEach(response => {
            const row = document.createElement('tr');

            // Name cell
            const nameCell = document.createElement('td');
            nameCell.textContent = response.name;
            row.appendChild(nameCell);

            // Submitted At cell
            const timeCell = document.createElement('td');
            timeCell.textContent = formatDateTime(response.submittedAt);
            timeCell.style.whiteSpace = 'nowrap';
            row.appendChild(timeCell);

            // Answer cells
            response.answers.forEach(answer => {
                const answerCell = document.createElement('td');
                answerCell.textContent = answer;
                answerCell.style.maxWidth = '300px';
                answerCell.style.wordWrap = 'break-word';
                row.appendChild(answerCell);
            });

            tbody.appendChild(row);
        });
    }

    table.appendChild(tbody);

    // Clear and append table
    responsesTableWrapper.innerHTML = '';
    responsesTableWrapper.appendChild(table);

    // Show results container
    showElement(resultsContainer);
}

// Handle load responses button click
async function handleLoadResponses() {
    hideStatus();
    hideElement(resultsContainer);

    // Get inputs
    const surveyId = surveyIdInput.value.trim();
    const adminToken = tokenInput.value.trim();

    // Validate
    if (!surveyId) {
        showStatus('Please enter a Survey ID.', true);
        return;
    }

    if (!adminToken) {
        showStatus('Please enter an Admin Token.', true);
        return;
    }

    // Disable button while loading
    loadBtn.disabled = true;
    loadBtn.textContent = 'Loading...';

    // Fetch responses
    const data = await fetchSurveyResponses(surveyId, adminToken);

    // Re-enable button
    loadBtn.disabled = false;
    loadBtn.textContent = 'Load Responses';

    if (!data) {
        return; // Error already shown
    }

    // Render responses
    hideStatus();
    renderResponses(data);
}

// Event listeners
loadBtn.addEventListener('click', handleLoadResponses);

// Allow Enter key to submit
surveyIdInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleLoadResponses();
    }
});

tokenInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleLoadResponses();
    }
});

// Initialize on page load
initializePage();
