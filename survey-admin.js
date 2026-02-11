// ===================================
// STATE
// ===================================
let surveyId = null;
let refreshInterval = null;

// ===================================
// DOM ELEMENTS
// ===================================
const errorEl = document.getElementById('error');
const loadingEl = document.getElementById('loading');
const resultsContainer = document.getElementById('results-container');
const surveyTitleEl = document.getElementById('survey-title');
const totalCountEl = document.getElementById('total-count');
const responsesTableWrapper = document.getElementById('responses-table-wrapper');

// ===================================
// UTILITY FUNCTIONS
// ===================================
function showElement(el) {
    el.style.display = 'block';
}

function hideElement(el) {
    el.style.display = 'none';
}

function showError(message) {
    errorEl.textContent = message;
    showElement(errorEl);
    hideElement(loadingEl);
    hideElement(resultsContainer);
}

function getSurveyIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('surveyId');
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

// ===================================
// LOAD RESPONSES
// ===================================
async function loadResponses(surveyId) {
    try {
        const response = await fetch(
            `${BACKEND_BASE_URL}/api/surveys/${surveyId}/responses`
        );

        if (response.status === 404) {
            showError('Survey not found');
            // Stop auto-refresh on 404
            if (refreshInterval) {
                clearInterval(refreshInterval);
                refreshInterval = null;
            }
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Hide loading and error, show results
        hideElement(loadingEl);
        hideElement(errorEl);
        showElement(resultsContainer);

        // Render the data
        renderResponses(data);

    } catch (error) {
        console.error('Error fetching survey responses:', error);
        showError('Failed to load responses. Please check your connection.');
        // Don't stop auto-refresh on network errors - keep trying
    }
}

// ===================================
// RENDER RESPONSES
// ===================================
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

    // Last Updated column
    const timeHeader = document.createElement('th');
    timeHeader.textContent = 'Last Updated';
    headerRow.appendChild(timeHeader);

    // Question columns
    questions.forEach((question, index) => {
        const questionHeader = document.createElement('th');
        questionHeader.textContent = question;
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

            // Last Updated cell
            const timeCell = document.createElement('td');
            timeCell.textContent = formatDateTime(response.updatedAt || response.submittedAt);
            timeCell.style.whiteSpace = 'nowrap';
            row.appendChild(timeCell);

            // Answer cells
            response.answers.forEach(answer => {
                const answerCell = document.createElement('td');
                answerCell.textContent = answer || '-';
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
}

// ===================================
// INITIALIZE
// ===================================
function init() {
    // Get surveyId from URL
    surveyId = getSurveyIdFromURL();

    if (!surveyId) {
        showError('Missing surveyId in URL');
        return;
    }

    // Load responses immediately
    loadResponses(surveyId);

    // Set up auto-refresh every 5 seconds
    refreshInterval = setInterval(() => {
        loadResponses(surveyId);
    }, 5000);
}

// ===================================
// START
// ===================================
document.addEventListener('DOMContentLoaded', init);
