// Get DOM elements
const pollIdInput = document.getElementById('pollId-input');
const tokenInput = document.getElementById('token-input');
const loadResultsBtn = document.getElementById('load-results-btn');
const statusEl = document.getElementById('status');
const resultsContainer = document.getElementById('results-container');
const questionEl = document.getElementById('question');
const resultsBody = document.getElementById('results-body');
const totalVotesEl = document.getElementById('total-votes');

// Parse pollId from URL
function getPollIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('pollId');
}

// Show status message
function showStatus(message, isError = false) {
    statusEl.textContent = message;
    statusEl.className = isError ? 'message error' : 'message success';
    statusEl.style.display = 'block';
}

// Hide status message
function hideStatus() {
    statusEl.style.display = 'none';
}

// Load and display results
async function loadResults() {
    const pollId = pollIdInput.value.trim();
    const adminToken = tokenInput.value.trim();

    if (!pollId) {
        showStatus('Please enter a poll ID', true);
        return;
    }

    if (!adminToken) {
        showStatus('Please enter an admin token', true);
        return;
    }

    hideStatus();
    resultsContainer.style.display = 'none';
    loadResultsBtn.disabled = true;
    loadResultsBtn.textContent = 'Loading...';

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/polls/${pollId}/results`, {
            headers: {
                'x-admin-token': adminToken
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Invalid admin token');
            }
            if (response.status === 404) {
                throw new Error('Poll not found');
            }
            throw new Error(`Failed to load results: ${response.statusText}`);
        }

        const data = await response.json();
        displayResults(data);

    } catch (error) {
        showStatus(error.message, true);
    } finally {
        loadResultsBtn.disabled = false;
        loadResultsBtn.textContent = 'Load Results';
    }
}

// Display results in the table
function displayResults(data) {
    questionEl.textContent = data.question;

    // Calculate total votes
    const totalVotes = data.results.reduce((sum, result) => sum + result.count, 0);

    // Clear existing results
    resultsBody.innerHTML = '';

    // Add each option as a row
    data.results.forEach(result => {
        const row = document.createElement('tr');

        const optionCell = document.createElement('td');
        optionCell.textContent = result.option;

        const votesCell = document.createElement('td');
        votesCell.textContent = result.count;

        const percentageCell = document.createElement('td');
        const percentage = totalVotes > 0
            ? ((result.count / totalVotes) * 100).toFixed(1) + '%'
            : '0.0%';
        percentageCell.textContent = percentage;

        row.appendChild(optionCell);
        row.appendChild(votesCell);
        row.appendChild(percentageCell);
        resultsBody.appendChild(row);
    });

    totalVotesEl.textContent = `Total votes: ${totalVotes}`;
    resultsContainer.style.display = 'block';
}

// Handle button click
loadResultsBtn.addEventListener('click', loadResults);

// Allow Enter key in inputs to trigger load
pollIdInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loadResults();
    }
});

tokenInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loadResults();
    }
});

// Initialize on page load
(function init() {
    const pollId = getPollIdFromUrl();
    if (pollId) {
        pollIdInput.value = pollId;
    }
})();
