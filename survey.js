// ===================================
// STATE
// ===================================
let surveyId = null;
let surveyTitle = '';
let questions = [];
let currentStep = 0;  // 0 = name, 1..N = questions
let name = '';
let answers = [];

// ===================================
// DOM ELEMENTS
// ===================================
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const surveyCardEl = document.getElementById('survey-card');
const surveyTitleEl = document.getElementById('survey-title');
const instructionsEl = document.getElementById('instructions');
const progressEl = document.getElementById('progress');
const questionLabelEl = document.getElementById('question-label');
const inputWrapperEl = document.getElementById('input-wrapper');
const actionBtn = document.getElementById('action-btn');
const statusEl = document.getElementById('status');

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
    hideElement(surveyCardEl);
}

function showStatus(message, isError = false) {
    statusEl.textContent = message;
    statusEl.className = isError ? 'message error' : 'message success';
    showElement(statusEl);
}

function hideStatus() {
    hideElement(statusEl);
}

function getSurveyIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('surveyId');
}

// ===================================
// FETCH SURVEY
// ===================================
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

// ===================================
// RENDER STEP
// ===================================
function renderStep() {
    hideStatus();
    inputWrapperEl.innerHTML = '';

    // STEP 0: Name input
    if (currentStep === 0) {
        hideElement(progressEl);
        questionLabelEl.textContent = 'What is your name?';

        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'name-input';
        input.placeholder = 'Enter your name';
        input.value = name;

        input.addEventListener('input', (e) => {
            name = e.target.value.trim();
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleButtonClick();
            }
        });

        inputWrapperEl.appendChild(input);
        actionBtn.textContent = 'Next';

        setTimeout(() => input.focus(), 0);
    }
    // STEPS 1..N: Question inputs
    else {
        const questionIndex = currentStep - 1;
        const questionText = questions[questionIndex];

        showElement(progressEl);
        progressEl.textContent = `Question ${currentStep} of ${questions.length}`;
        questionLabelEl.textContent = questionText;

        const textarea = document.createElement('textarea');
        textarea.id = `answer-${questionIndex}`;
        textarea.placeholder = 'Type your answer here...';
        textarea.value = answers[questionIndex] || '';

        textarea.addEventListener('input', (e) => {
            answers[questionIndex] = e.target.value.trim();
        });

        inputWrapperEl.appendChild(textarea);

        // Update button text
        if (currentStep < questions.length) {
            actionBtn.textContent = 'Next';
        } else {
            actionBtn.textContent = 'Submit';
        }

        setTimeout(() => textarea.focus(), 0);
    }
}

// ===================================
// BUTTON CLICK HANDLER
// ===================================
async function handleButtonClick() {
    hideStatus();

    // STEP 0: Name step
    if (currentStep === 0) {
        if (!name) {
            showStatus('Please enter your name.', true);
            return;
        }
        currentStep = 1;
        renderStep();
    }
    // STEPS 1..N: Question steps
    else {
        const questionIndex = currentStep - 1;
        const answer = answers[questionIndex] || '';

        if (!answer) {
            showStatus('Please provide an answer before continuing.', true);
            return;
        }

        // Not the last question: advance to next
        if (currentStep < questions.length) {
            currentStep++;
            renderStep();
        }
        // Last question: submit survey
        else {
            await submitSurvey();
        }
    }
}

// ===================================
// SUBMIT SURVEY
// ===================================
async function submitSurvey() {
    // Validate all answers are filled
    for (let i = 0; i < questions.length; i++) {
        if (!answers[i]) {
            showStatus(`Please answer question ${i + 1}.`, true);
            return;
        }
    }

    // Disable button to prevent double submission
    actionBtn.disabled = true;
    actionBtn.textContent = 'Submitting...';

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

        // Success: Show thank you screen
        showSuccessScreen();

    } catch (error) {
        console.error('Error submitting survey:', error);
        showStatus('Could not submit, please try again.', true);
        actionBtn.disabled = false;
        actionBtn.textContent = 'Submit';
    }
}

// ===================================
// SUCCESS SCREEN
// ===================================
function showSuccessScreen() {
    surveyCardEl.innerHTML = `
        <div class="success-screen">
            <h2>✓ Thank you, ${name}!</h2>
            <p>Your feedback has been submitted.</p>
            <p style="color: #7f8c8d; font-size: 14px; margin-top: 10px;">
                You answered ${questions.length} question${questions.length !== 1 ? 's' : ''}.
            </p>
        </div>
    `;
}

// ===================================
// INITIALIZE
// ===================================
async function init() {
    // Get surveyId from URL
    surveyId = getSurveyIdFromURL();

    if (!surveyId) {
        showError('No survey ID provided. Please use a valid survey link.');
        return;
    }

    // Fetch survey definition
    const survey = await fetchSurvey();

    if (!survey) {
        return; // Error already shown
    }

    // Store survey data
    surveyTitle = survey.title;
    questions = survey.questions;
    answers = new Array(questions.length).fill('');

    // Initialize state
    currentStep = 0;
    name = '';

    // Update UI
    surveyTitleEl.textContent = surveyTitle;

    hideElement(loadingEl);
    hideElement(errorEl);
    showElement(surveyCardEl);

    // Render first step
    renderStep();
}

// ===================================
// EVENT LISTENERS
// ===================================
actionBtn.addEventListener('click', handleButtonClick);

// ===================================
// START
// ===================================
init();
