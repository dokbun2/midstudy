// Midjourney Video Prompt Builder - JavaScript

// Custom Dropdown Solution for Select Elements
function enhanceSelectDropdowns() {
    // Fix for all select dropdowns to prevent cutoff
    const selects = document.querySelectorAll('.builder-select');
    
    selects.forEach(select => {
        // Store original size
        const originalSize = select.size || 1;
        
        // On focus, expand the select to show options
        select.addEventListener('focus', function() {
            // Calculate number of options (max 8 for visibility)
            const optionCount = Math.min(this.options.length, 8);
            this.size = optionCount;
            
            // Add class for styling
            this.classList.add('expanded');
            
            // Ensure parent card has enough height
            const card = this.closest('.builder-card');
            if (card) {
                card.style.minHeight = '250px';
                card.style.zIndex = '9999';
                card.style.overflow = 'visible';
            }
        });
        
        // On blur or change, collapse back
        select.addEventListener('blur', function() {
            setTimeout(() => {
                this.size = originalSize;
                this.classList.remove('expanded');
                
                // Reset parent card
                const card = this.closest('.builder-card');
                if (card) {
                    card.style.minHeight = '';
                    card.style.zIndex = '';
                    card.style.overflow = '';
                }
            }, 200);
        });
        
        select.addEventListener('change', function() {
            this.size = originalSize;
            this.classList.remove('expanded');
            
            // Reset parent card
            const card = this.closest('.builder-card');
            if (card) {
                card.style.minHeight = '';
                card.style.zIndex = '';
                card.style.overflow = '';
            }
        });
    });
}

// DOM Elements
const basePromptInput = document.getElementById('base-prompt');
const basePromptDropdown = document.getElementById('base-prompt-dropdown');
const additionalPromptInput = document.getElementById('additional-prompt');
const cameraMovementSelect = document.getElementById('camera-movement');
const styleRefInput = document.getElementById('style-ref');
const styleRefDropdown = document.getElementById('style-ref-dropdown');
const aspectRatioSelect = document.getElementById('aspect-ratio');
const additionalParamsInput = document.getElementById('additional-params');
const generateBtn = document.getElementById('generate-btn');
const clearBtn = document.getElementById('clear-btn');
const saveBtn = document.getElementById('save-btn');
const copyBtn = document.getElementById('copy-btn');
const outputDisplay = document.getElementById('output-display');
const promptPreview = document.getElementById('prompt-preview');

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
    attachEventListeners();
    initAnimations();
    checkScrollPosition();
    enhanceSelectDropdowns(); // Initialize custom dropdown enhancement
});

// Event Listeners
function attachEventListeners() {
    generateBtn.addEventListener('click', generatePrompt);
    clearBtn.addEventListener('click', clearAll);
    saveBtn.addEventListener('click', savePrompt);
    copyBtn.addEventListener('click', copyToClipboard);
    
    // Base prompt dropdown handler
    basePromptDropdown.addEventListener('change', (e) => {
        const selectedValue = e.target.value;
        if (selectedValue) {
            const currentValue = basePromptInput.value.trim();
            if (currentValue) {
                // Add to existing value with comma
                basePromptInput.value = `${currentValue}, ${selectedValue}`;
            } else {
                // Set as new value
                basePromptInput.value = selectedValue;
            }
            // Reset dropdown to default option
            basePromptDropdown.value = '';
            // Trigger preview update
            updatePreview();
        }
    });
    
    // Style reference dropdown handler
    styleRefDropdown.addEventListener('change', (e) => {
        const selectedValue = e.target.value;
        if (selectedValue) {
            const currentValue = styleRefInput.value.trim();
            // Extract just the --sref number from selected value
            const selectedSref = selectedValue.match(/--sref\s+(\d+)/)[1];
            
            if (currentValue) {
                // Check if current value starts with --sref
                if (currentValue.startsWith('--sref')) {
                    // Extract existing numbers
                    const existingNumbers = currentValue.replace('--sref', '').trim();
                    // Add new number with comma
                    styleRefInput.value = `--sref ${existingNumbers}, ${selectedSref}`;
                } else {
                    // Add to existing non-sref value
                    styleRefInput.value = `${currentValue} ${selectedValue}`;
                }
            } else {
                // Set as new value
                styleRefInput.value = selectedValue;
            }
            // Reset dropdown to default option
            styleRefDropdown.value = '';
            // Trigger preview update
            updatePreview();
        }
    });
    
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
        shakeElement(basePromptInput);
        return;
    }
    
    // Build the prompt
    let finalPrompt = basePrompt;
    
    // Add additional prompt if provided (moved before camera movement)
    if (additionalPrompt) {
        finalPrompt = `${finalPrompt}, ${additionalPrompt}`;
    }
    
    // Add camera movement if selected (moved after additional prompt)
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
    
    // Add smooth animation
    outputDisplay.style.transform = 'scale(0.98)';
    outputDisplay.style.opacity = '0.8';
    setTimeout(() => {
        outputDisplay.style.transform = 'scale(1)';
        outputDisplay.style.opacity = '1';
    }, 150);
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
    basePromptDropdown.value = '';
    additionalPromptInput.value = '';
    cameraMovementSelect.value = '';
    styleRefInput.value = '';
    styleRefDropdown.value = '';
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
    showNotification('프롬프트가 저장되었습니다!', 'success');
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

// Initialize animations
function initAnimations() {
    // Add intersection observer for fade-in animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    // Observe all prompt blocks
    document.querySelectorAll('.prompt-block').forEach((block, index) => {
        block.style.opacity = '0';
        block.style.transform = 'translateY(20px)';
        block.style.transition = `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`;
        observer.observe(block);
    });

    // Add hover effects with smooth transitions
    document.querySelectorAll('.prompt-block').forEach(block => {
        block.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px) scale(1.01)';
        });
        block.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Smooth focus transitions for inputs
    document.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.01)';
        });
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    });
}

// Shake animation for validation errors
function shakeElement(element) {
    element.style.animation = 'shake 0.5s';
    setTimeout(() => {
        element.style.animation = '';
    }, 500);
}

// Add shake animation CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// Header scroll effect
function checkScrollPosition() {
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.72)';
            header.style.boxShadow = 'none';
        }
    });
}