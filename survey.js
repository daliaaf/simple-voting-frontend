// State
let surveyId = null;
let surveyTitle = null;
let questions = [];
let currentStep = 0;
let name = '';
let answers = [];
let isSubmitting = false;

// DOM elements
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const surveyContainerEl = document.getElementById('survey-container');
const surveyTitleEl = document.getElementById('survey-title');
const progressEl = document.getElementById('progress');
const questionLabelEl = document.getElementById('question-label');
const inputContainerEl = document.getElementById('input-container');
const nextBtn = document.getElementById('next-btn');
const statusEl = document.getElementById('status');

// Utility functions
function showElement(element) {
    element.style.display = 'block';
}

function hideElement(element) {
    element.style.display = 'none';
}

function showError(message) {
    errorEl.textContent = message;
    showElement(errorEl);
    hideElement(loadingEl);
    hideElement(surveyContainerEl);
}

function showStatus(message, isSuccess = false) {
    statusEl.textContent = message;
    statusEl.className = isSuccess ? 'message success' : 'message error';
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

// Fetch survey from backend
async function fetchSurvey() {
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/surveys/${surveyId}`);

        if (response.status === 404) {
            showError('Survey not found');
            return null;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching survey:', error);
        showError('Failed to load survey. Please check your connection and try again.');
        return null;
    }
}

// Render current step
function render() {
    hideStatus();

    // Step 0: Name input
    if (currentStep === 0) {
        hideElement(progressEl);
        questionLabelEl.textContent = 'Your name';

        inputContainerEl.innerHTML = '';
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'name-input';
        input.placeholder = 'Enter your name';
        input.value = name;
        input.className = 'form-control';

        input.addEventListener('input', (e) => {
            name = e.target.value.trim();
            updateButtonState();
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleNext();
            }
        });

        inputContainerEl.appendChild(input);
        nextBtn.textContent = 'Next';

        // Auto-focus
        setTimeout(() => input.focus(), 0);
    }
    // Steps 1 to N: Question inputs
    else if (currentStep <= questions.length) {
        const questionIndex = currentStep - 1;
        const questionText = questions[questionIndex];

        showElement(progressEl);
        progressEl.textContent = `Question ${currentStep} of ${questions.length}`;
        questionLabelEl.textContent = questionText;

        inputContainerEl.innerHTML = '';
        const textarea = document.createElement('textarea');
        textarea.id = `question-${questionIndex}`;
        textarea.className = 'textarea';
        textarea.placeholder = 'Enter your answer here...';
        textarea.value = answers[questionIndex] || '';

        textarea.addEventListener('input', (e) => {
            answers[questionIndex] = e.target.value.trim();
            updateButtonState();
        });

        inputContainerEl.appendChild(textarea);

        // Update button text
        if (currentStep === questions.length) {
            nextBtn.textContent = 'Submit';
        } else {
            nextBtn.textContent = 'Next';
        }

        // Auto-focus
        setTimeout(() => textarea.focus(), 0);
    }

    updateButtonState();
}

// Update button state (enable/disable)
function updateButtonState() {
    if (currentStep === 0) {
        nextBtn.disabled = !name || isSubmitting;
    } else {
        const questionIndex = currentStep - 1;
        const currentAnswer = answers[questionIndex] || '';
        nextBtn.disabled = !currentAnswer || isSubmitting;
    }
}

// Handle Next/Submit button click
async function handleNext() {
    if (nextBtn.disabled) return;

    hideStatus();

    // Step 0: Save name and move to first question
    if (currentStep === 0) {
        if (!name) {
            showStatus('Please enter your name.');
            return;
        }
        currentStep++;
        render();
    }
    // Steps 1 to N-1: Save answer and move to next question
    else if (currentStep < questions.length) {
        const questionIndex = currentStep - 1;
        if (!answers[questionIndex]) {
            showStatus('Please answer the current question.');
            return;
        }
        currentStep++;
        render();
    }
    // Step N: Submit all answers
    else if (currentStep === questions.length) {
        const questionIndex = currentStep - 1;
        if (!answers[questionIndex]) {
            showStatus('Please answer the current question.');
            return;
        }

        await submitSurvey();
    }
}

// Submit survey to backend
async function submitSurvey() {
    // Validate all data
    if (!name) {
        showStatus('Name is required.');
        return;
    }

    for (let i = 0; i < questions.length; i++) {
        if (!answers[i]) {
            showStatus(`Please answer question ${i + 1}.`);
            return;
        }
    }

    // Prevent double submission
    if (isSubmitting) return;
    isSubmitting = true;

    nextBtn.disabled = true;
    nextBtn.textContent = 'Submitting...';

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/surveys/${surveyId}/responses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                answers
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Success - show success message
        showSuccessScreen();

    } catch (error) {
        console.error('Error submitting survey:', error);
        showStatus('Could not submit, please try again.');
        nextBtn.disabled = false;
        nextBtn.textContent = 'Submit';
        isSubmitting = false;
    }
}

// Show success screen
function showSuccessScreen() {
    surveyContainerEl.innerHTML = `
        <div class="success-container">
            <h2>✓ Thank you!</h2>
            <p>Your feedback has been submitted successfully.</p>
        </div>
    `;
}

// Initialize survey
async function initSurvey() {
    // Get surveyId from URL
    surveyId = getSurveyIdFromURL();

    if (!surveyId) {
        showError('No survey ID provided. Please use a valid survey link.');
        return;
    }

    // Fetch survey
    const survey = await fetchSurvey();

    if (!survey) {
        return; // Error already shown
    }

    // Initialize state
    surveyTitle = survey.title;
    questions = survey.questions;
    answers = new Array(questions.length).fill('');
    currentStep = 0;
    name = '';

    // Display survey
    surveyTitleEl.textContent = surveyTitle;

    hideElement(loadingEl);
    hideElement(errorEl);
    showElement(surveyContainerEl);

    // Render first step
    render();
}

// Event listeners
nextBtn.addEventListener('click', handleNext);

// Initialize on page load
initSurvey();
