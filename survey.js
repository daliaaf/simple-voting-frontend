// State
let survey = null;
let surveyId = null;

// DOM elements
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const surveyContainerEl = document.getElementById('survey-container');
const surveyTitleEl = document.getElementById('survey-title');
const questionsEl = document.getElementById('questions');
const surveyFormEl = document.getElementById('survey-form');
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

// Render questions
function renderQuestions(questions) {
    questionsEl.innerHTML = '';

    questions.forEach((questionText, index) => {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';

        const label = document.createElement('label');
        label.setAttribute('for', `question-${index}`);
        label.textContent = questionText;

        const textarea = document.createElement('textarea');
        textarea.id = `question-${index}`;
        textarea.className = 'textarea';
        textarea.rows = 4;
        textarea.placeholder = 'Enter your answer here...';
        textarea.required = true;

        formGroup.appendChild(label);
        formGroup.appendChild(textarea);
        questionsEl.appendChild(formGroup);
    });
}

// Add textarea styles
function addTextareaStyles() {
    const style = document.createElement('style');
    style.textContent = `
        textarea.textarea {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
            font-family: inherit;
            transition: border-color 0.3s;
            resize: vertical;
        }

        textarea.textarea:focus {
            outline: none;
            border-color: #3498db;
        }
    `;
    document.head.appendChild(style);
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
    survey = await fetchSurvey();

    if (!survey) {
        return; // Error already shown
    }

    // Display survey
    surveyTitleEl.textContent = survey.title;
    renderQuestions(survey.questions);

    hideElement(loadingEl);
    hideElement(errorEl);
    showElement(surveyContainerEl);
}

// Handle form submission
async function handleSubmit(event) {
    event.preventDefault();
    hideStatus();

    // Get name
    const name = document.getElementById('name').value.trim();

    if (!name) {
        showStatus('Please enter your name.');
        return;
    }

    // Get all answers
    const answers = [];
    const textareas = questionsEl.querySelectorAll('textarea');

    for (let i = 0; i < textareas.length; i++) {
        const answer = textareas[i].value.trim();
        if (!answer) {
            showStatus(`Please answer question ${i + 1}.`);
            return;
        }
        answers.push(answer);
    }

    // Validate answers count
    if (answers.length !== survey.questions.length) {
        showStatus('Please answer all questions.');
        return;
    }

    // Disable submit button
    const submitBtn = surveyFormEl.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        // Submit to backend
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

        // Success
        showStatus('Thank you! Your feedback has been submitted.', true);

        // Clear form or disable it
        surveyFormEl.reset();
        submitBtn.textContent = 'Submitted';

    } catch (error) {
        console.error('Error submitting survey:', error);
        showStatus('Could not submit, please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
    }
}

// Event listeners
surveyFormEl.addEventListener('submit', handleSubmit);

// Initialize on page load
addTextareaStyles();
initSurvey();
