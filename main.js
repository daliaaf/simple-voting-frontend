// Get DOM elements
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const pollContainer = document.getElementById('poll-container');
const questionEl = document.getElementById('question');
const optionsEl = document.getElementById('options');
const voteForm = document.getElementById('vote-form');
const statusEl = document.getElementById('status');

// Parse pollId from URL
function getPollIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('pollId');
}

// Show error message
function showError(message) {
    loadingEl.style.display = 'none';
    pollContainer.style.display = 'none';
    errorEl.textContent = message;
    errorEl.style.display = 'block';
}

// Show status message
function showStatus(message, isSuccess) {
    statusEl.textContent = message;
    statusEl.className = isSuccess ? 'message success' : 'message error';
    statusEl.style.display = 'block';
}

// Load and display poll
async function loadPoll(pollId) {
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/polls/${pollId}`);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Poll not found');
            }
            throw new Error(`Failed to load poll: ${response.statusText}`);
        }

        const poll = await response.json();

        // Display poll
        loadingEl.style.display = 'none';
        pollContainer.style.display = 'block';

        questionEl.textContent = poll.question;

        // Create radio buttons for each option
        optionsEl.innerHTML = '';
        poll.options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option';

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'option';
            radio.id = `option-${index}`;
            radio.value = index;

            const label = document.createElement('label');
            label.htmlFor = `option-${index}`;
            label.textContent = option;

            optionDiv.appendChild(radio);
            optionDiv.appendChild(label);
            optionsEl.appendChild(optionDiv);
        });

    } catch (error) {
        showError(error.message);
    }
}

// Submit vote
async function submitVote(pollId, optionIndex) {
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/polls/${pollId}/vote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ optionIndex })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || 'Failed to submit vote');
        }

        showStatus('Thanks! Your vote has been recorded.', true);

        // Disable form after successful vote
        voteForm.querySelectorAll('input, button').forEach(el => el.disabled = true);

    } catch (error) {
        showStatus(error.message, false);
    }
}

// Handle form submission
voteForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const selectedOption = document.querySelector('input[name="option"]:checked');

    if (!selectedOption) {
        showStatus('Please select an option', false);
        return;
    }

    const pollId = getPollIdFromUrl();
    const optionIndex = parseInt(selectedOption.value, 10);

    await submitVote(pollId, optionIndex);
});

// Initialize on page load
(function init() {
    const pollId = getPollIdFromUrl();

    if (!pollId) {
        showError('Missing pollId. Please provide a pollId in the URL (e.g., ?pollId=demo-poll-1)');
        return;
    }

    loadPoll(pollId);
})();
