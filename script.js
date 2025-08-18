// Midjourney Video Prompt Builder - JavaScript

// DOM Elements
const basePromptInput = document.getElementById('base-prompt');
const additionalPromptInput = document.getElementById('additional-prompt');
const cameraMovementSelect = document.getElementById('camera-movement');
const styleRefInput = document.getElementById('style-ref');
const aspectRatioSelect = document.getElementById('aspect-ratio');
const additionalParamsInput = document.getElementById('additional-params');
const generateBtn = document.getElementById('generate-btn');
const clearBtn = document.getElementById('clear-btn');
const saveBtn = document.getElementById('save-btn');
const copyBtn = document.getElementById('copy-btn');
const outputDisplay = document.getElementById('output-display');
const promptPreview = document.getElementById('prompt-preview');
const savedPromptsList = document.getElementById('saved-prompts');

// Preset Templates
const presetTemplates = {
    cinematic: {
        basePrompt: 'cinematic shot of a mysterious figure',
        cameraMovement: 'dolly in',
        styleRef: '--sref 2720573889',
        aspectRatio: '--ar 21:9',
        additionalParams: '--v 6 --style raw'
    },
    portrait: {
        basePrompt: 'portrait of a person with dramatic lighting',
        cameraMovement: 'zoom in',
        styleRef: '--sref 1980491416',
        aspectRatio: '--ar 2:3',
        additionalParams: '--v 6'
    },
    landscape: {
        basePrompt: 'majestic mountain landscape at sunset',
        cameraMovement: 'pan right',
        styleRef: '--sref 3456789012',
        aspectRatio: '--ar 16:9',
        additionalParams: '--v 6 --q 2'
    },
    action: {
        basePrompt: 'dynamic action scene with motion blur',
        cameraMovement: 'rotate clockwise',
        styleRef: '--sref 9876543210',
        aspectRatio: '--ar 16:9',
        additionalParams: '--v 6 --chaos 50'
    }
};

// Load saved prompts from localStorage
let savedPrompts = JSON.parse(localStorage.getItem('savedPrompts')) || [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    displaySavedPrompts();
    attachEventListeners();
});

// Event Listeners
function attachEventListeners() {
    generateBtn.addEventListener('click', generatePrompt);
    clearBtn.addEventListener('click', clearAll);
    saveBtn.addEventListener('click', savePrompt);
    copyBtn.addEventListener('click', copyToClipboard);
    
    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const presetName = e.target.dataset.preset;
            loadPreset(presetName);
        });
    });
    
    // Real-time preview on input change
    [basePromptInput, additionalPromptInput, cameraMovementSelect, styleRefInput, aspectRatioSelect, additionalParamsInput].forEach(element => {
        element.addEventListener('input', updatePreview);
    });
}

// Generate Prompt Function
function generatePrompt() {
    const basePrompt = basePromptInput.value.trim();
    const additionalPrompt = additionalPromptInput.value.trim();
    
    if (!basePrompt) {
        showNotification('기본 프롬프트를 입력해주세요!', 'error');
        return;
    }
    
    // Build the prompt
    let finalPrompt = basePrompt;
    
    // Add additional prompt if provided
    if (additionalPrompt) {
        finalPrompt = `${finalPrompt}, ${additionalPrompt}`;
    }
    
    // Add camera movement if selected
    const cameraMovement = cameraMovementSelect.value;
    if (cameraMovement) {
        finalPrompt = `${finalPrompt}, ${cameraMovement}`;
    }
    
    // Add style reference if provided
    const styleRef = styleRefInput.value.trim();
    if (styleRef) {
        // Check if --sref is already included
        if (!styleRef.startsWith('--sref')) {
            finalPrompt = `${finalPrompt} --sref ${styleRef}`;
        } else {
            finalPrompt = `${finalPrompt} ${styleRef}`;
        }
    }
    
    // Add aspect ratio
    const aspectRatio = aspectRatioSelect.value;
    finalPrompt = `${finalPrompt} ${aspectRatio}`;
    
    // Add additional parameters if provided
    const additionalParams = additionalParamsInput.value.trim();
    if (additionalParams) {
        finalPrompt = `${finalPrompt} ${additionalParams}`;
    }
    
    // Display the generated prompt
    displayPrompt(finalPrompt);
    
    // Enable copy button
    copyBtn.disabled = false;
    
    // Show success notification
    showNotification('프롬프트가 성공적으로 생성되었습니다!', 'success');
    
    // Add animation
    outputDisplay.classList.add('pulse-animation');
    setTimeout(() => {
        outputDisplay.classList.remove('pulse-animation');
    }, 600);
}

// Display Prompt
function displayPrompt(prompt) {
    outputDisplay.innerHTML = `
        <div class="generated-prompt">
            <code>${prompt}</code>
        </div>
    `;
    
    // Store the prompt for copying
    outputDisplay.dataset.prompt = prompt;
}

// Update Preview
function updatePreview() {
    const components = [];
    
    if (basePromptInput.value.trim()) {
        components.push(`<span class="preview-block base">📝 ${basePromptInput.value.trim()}</span>`);
    }
    
    if (additionalPromptInput.value.trim()) {
        components.push(`<span class="preview-block additional">✨ ${additionalPromptInput.value.trim()}</span>`);
    }
    
    if (cameraMovementSelect.value) {
        components.push(`<span class="preview-block camera">🎥 ${cameraMovementSelect.value}</span>`);
    }
    
    if (styleRefInput.value.trim()) {
        components.push(`<span class="preview-block style">🎨 ${styleRefInput.value.trim()}</span>`);
    }
    
    if (aspectRatioSelect.value) {
        components.push(`<span class="preview-block ratio">📐 ${aspectRatioSelect.value}</span>`);
    }
    
    if (additionalParamsInput.value.trim()) {
        components.push(`<span class="preview-block params">⚙️ ${additionalParamsInput.value.trim()}</span>`);
    }
    
    promptPreview.innerHTML = components.join('');
}

// Clear All Fields
function clearAll() {
    basePromptInput.value = '';
    additionalPromptInput.value = '';
    cameraMovementSelect.value = '';
    styleRefInput.value = '';
    aspectRatioSelect.value = '--ar 9:16';
    additionalParamsInput.value = '';
    outputDisplay.innerHTML = '<p class="placeholder-text">Your generated prompt will appear here...</p>';
    promptPreview.innerHTML = '';
    copyBtn.disabled = true;
    showNotification('모든 필드가 지워졌습니다!', 'info');
}

// Save Prompt
function savePrompt() {
    const prompt = outputDisplay.dataset.prompt;
    
    if (!prompt) {
        showNotification('먼저 프롬프트를 생성해주세요!', 'error');
        return;
    }
    
    const promptName = prompt.substring(0, 50) + '...';
    const savedPrompt = {
        id: Date.now(),
        name: promptName,
        prompt: prompt,
        timestamp: new Date().toLocaleString()
    };
    
    savedPrompts.unshift(savedPrompt);
    
    // Keep only last 10 saved prompts
    if (savedPrompts.length > 10) {
        savedPrompts = savedPrompts.slice(0, 10);
    }
    
    localStorage.setItem('savedPrompts', JSON.stringify(savedPrompts));
    displaySavedPrompts();
    showNotification('프롬프트가 저장되었습니다!', 'success');
}

// Display Saved Prompts
function displaySavedPrompts() {
    if (savedPrompts.length === 0) {
        savedPromptsList.innerHTML = '<p class="no-saved">저장된 프롬프트가 없습니다</p>';
        return;
    }
    
    savedPromptsList.innerHTML = savedPrompts.map(item => `
        <div class="saved-item" data-id="${item.id}">
            <div class="saved-item-content">
                <p class="saved-name">${item.name}</p>
                <p class="saved-time">${item.timestamp}</p>
            </div>
            <div class="saved-actions">
                <button class="load-saved-btn" data-prompt="${encodeURIComponent(item.prompt)}">Load</button>
                <button class="delete-saved-btn" data-id="${item.id}">×</button>
            </div>
        </div>
    `).join('');
    
    // Attach event listeners to saved prompt buttons
    document.querySelectorAll('.load-saved-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const prompt = decodeURIComponent(e.target.dataset.prompt);
            displayPrompt(prompt);
            copyBtn.disabled = false;
            showNotification('저장된 프롬프트를 불러왔습니다!', 'success');
        });
    });
    
    document.querySelectorAll('.delete-saved-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            savedPrompts = savedPrompts.filter(item => item.id !== id);
            localStorage.setItem('savedPrompts', JSON.stringify(savedPrompts));
            displaySavedPrompts();
            showNotification('프롬프트가 삭제되었습니다!', 'info');
        });
    });
}

// Load Preset
function loadPreset(presetName) {
    const preset = presetTemplates[presetName];
    
    if (!preset) return;
    
    basePromptInput.value = preset.basePrompt;
    cameraMovementSelect.value = preset.cameraMovement;
    styleRefInput.value = preset.styleRef;
    aspectRatioSelect.value = preset.aspectRatio;
    additionalParamsInput.value = preset.additionalParams;
    
    updatePreview();
    const presetNames = {
        cinematic: '시네마틱',
        portrait: '인물',
        landscape: '풍경',
        action: '액션'
    };
    showNotification(`${presetNames[presetName]} 프리셋이 로드되었습니다!`, 'success');
}

// Copy to Clipboard
async function copyToClipboard() {
    const prompt = outputDisplay.dataset.prompt;
    
    if (!prompt) {
        showNotification('복사할 프롬프트가 없습니다!', 'error');
        return;
    }
    
    try {
        await navigator.clipboard.writeText(prompt);
        
        // Update button text temporarily
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = '<span class="copy-icon">✅</span><span class="copy-text">복사됨!</span>';
        copyBtn.classList.add('copied');
        
        setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
            copyBtn.classList.remove('copied');
        }, 2000);
        
        showNotification('프롬프트가 클립보드에 복사되었습니다!', 'success');
    } catch (err) {
        showNotification('프롬프트 복사에 실패했습니다!', 'error');
    }
}

// Show Notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to generate
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        generatePrompt();
    }
    
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        savePrompt();
    }
    
    // Ctrl/Cmd + Shift + C to copy
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        copyToClipboard();
    }
    
    // Escape to clear
    if (e.key === 'Escape') {
        clearAll();
    }
});