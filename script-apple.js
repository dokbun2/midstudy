// Midjourney Prompt Builder - Apple Developer Style JavaScript

// DOM Elements
const elements = {
    basePrompt: document.getElementById('base-prompt'),
    baseDropdown: document.getElementById('base-prompt-dropdown'),
    additionalPrompt: document.getElementById('additional-prompt'),
    cameraMovement: document.getElementById('camera-movement'),
    styleRef: document.getElementById('style-ref'),
    styleDropdown: document.getElementById('style-ref-dropdown'),
    aspectRatio: document.getElementById('aspect-ratio'),
    additionalParams: document.getElementById('additional-params'),
    generateBtn: document.getElementById('generate-btn'),
    clearBtn: document.getElementById('clear-btn'),
    saveBtn: document.getElementById('save-btn'),
    copyBtn: document.getElementById('copy-btn'),
    outputDisplay: document.getElementById('output-display'),
    promptPreview: document.getElementById('prompt-preview'),
    themeToggle: document.getElementById('theme-toggle')
};

// Theme Management
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'auto';
        this.init();
    }

    init() {
        this.applyTheme();
        this.setupListeners();
        this.updateIcon();
    }

    applyTheme() {
        if (this.currentTheme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            document.documentElement.setAttribute('data-theme', this.currentTheme);
        }
    }

    toggle() {
        const themes = ['light', 'dark', 'auto'];
        const currentIndex = themes.indexOf(this.currentTheme);
        this.currentTheme = themes[(currentIndex + 1) % themes.length];
        localStorage.setItem('theme', this.currentTheme);
        this.applyTheme();
        this.updateIcon();
        this.showNotification(`테마: ${this.getThemeLabel()}`, 'info');
    }

    getThemeLabel() {
        const labels = {
            'light': '라이트 모드',
            'dark': '다크 모드',
            'auto': '자동'
        };
        return labels[this.currentTheme];
    }

    updateIcon() {
        const sunIcon = elements.themeToggle.querySelector('.sun-icon');
        const moonIcon = elements.themeToggle.querySelector('.moon-icon');
        
        if (this.currentTheme === 'dark' || 
            (this.currentTheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        } else {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        }
    }

    setupListeners() {
        elements.themeToggle?.addEventListener('click', () => this.toggle());
        
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (this.currentTheme === 'auto') {
                this.applyTheme();
                this.updateIcon();
            }
        });
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 68px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 10px;
            background: ${type === 'info' ? 'var(--blue)' : 'var(--green)'};
            color: white;
            font-size: 14px;
            font-weight: 500;
            z-index: 1000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
}

// Prompt Builder Class
class PromptBuilder {
    constructor() {
        this.presetTemplates = {
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
        
        this.savedPrompts = JSON.parse(localStorage.getItem('savedPrompts')) || [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupAnimations();
        this.setupSmoothScroll();
    }

    setupEventListeners() {
        // Main buttons
        elements.generateBtn?.addEventListener('click', () => this.generatePrompt());
        elements.clearBtn?.addEventListener('click', () => this.clearAll());
        elements.saveBtn?.addEventListener('click', () => this.savePrompt());
        elements.copyBtn?.addEventListener('click', () => this.copyToClipboard());
        
        // Dropdowns
        elements.baseDropdown?.addEventListener('change', (e) => this.handleDropdownSelection(e, elements.basePrompt));
        elements.styleDropdown?.addEventListener('change', (e) => this.handleStyleSelection(e));
        
        // Real-time preview
        const inputs = [
            elements.basePrompt,
            elements.additionalPrompt,
            elements.cameraMovement,
            elements.styleRef,
            elements.aspectRatio,
            elements.additionalParams
        ];
        
        inputs.forEach(input => {
            input?.addEventListener('input', () => this.updatePreview());
        });
        
        // Preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.currentTarget.dataset.preset;
                this.loadPreset(preset);
            });
        });
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Cmd/Ctrl + Enter to generate
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                this.generatePrompt();
            }
            
            // Cmd/Ctrl + S to save
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                this.savePrompt();
            }
            
            // Cmd/Ctrl + C to copy (when output is focused)
            if ((e.metaKey || e.ctrlKey) && e.key === 'c' && elements.outputDisplay.dataset.prompt) {
                e.preventDefault();
                this.copyToClipboard();
            }
            
            // Escape to clear
            if (e.key === 'Escape') {
                this.clearAll();
            }
        });
    }

    handleDropdownSelection(e, targetInput) {
        const value = e.target.value;
        if (value) {
            const current = targetInput.value.trim();
            targetInput.value = current ? `${current}, ${value}` : value;
            e.target.value = '';
            this.updatePreview();
        }
    }

    handleStyleSelection(e) {
        const value = e.target.value;
        if (value) {
            const current = elements.styleRef.value.trim();
            if (current && current.startsWith('--sref')) {
                const numbers = current.replace('--sref', '').trim();
                const newNumber = value.match(/--sref\s+(\d+)/)[1];
                elements.styleRef.value = `--sref ${numbers}, ${newNumber}`;
            } else {
                elements.styleRef.value = value;
            }
            e.target.value = '';
            this.updatePreview();
        }
    }

    generatePrompt() {
        const basePrompt = elements.basePrompt.value.trim();
        
        if (!basePrompt) {
            this.showNotification('기본 프롬프트를 입력해주세요!', 'error');
            this.shakeElement(elements.basePrompt);
            return;
        }
        
        let prompt = basePrompt;
        
        // Add additional prompt
        const additional = elements.additionalPrompt.value.trim();
        if (additional) {
            prompt += `, ${additional}`;
        }
        
        // Add camera movement
        const camera = elements.cameraMovement.value;
        if (camera) {
            prompt += `, ${camera}`;
        }
        
        // Add style reference
        const style = elements.styleRef.value.trim();
        if (style) {
            prompt += ` ${style.startsWith('--sref') ? style : `--sref ${style}`}`;
        }
        
        // Add aspect ratio
        prompt += ` ${elements.aspectRatio.value}`;
        
        // Add additional parameters
        const params = elements.additionalParams.value.trim();
        if (params) {
            prompt += ` ${params}`;
        }
        
        this.displayPrompt(prompt);
        elements.copyBtn.disabled = false;
        this.showNotification('프롬프트가 생성되었습니다!', 'success');
        this.animateOutput();
    }

    displayPrompt(prompt) {
        elements.outputDisplay.innerHTML = `
            <code style="color: var(--text-primary); font-size: 14px; line-height: 1.5;">
                ${prompt}
            </code>
        `;
        elements.outputDisplay.dataset.prompt = prompt;
    }

    updatePreview() {
        const pills = [];
        
        if (elements.basePrompt.value.trim()) {
            pills.push(this.createPill('📝', elements.basePrompt.value.trim(), '#5856d6'));
        }
        
        if (elements.additionalPrompt.value.trim()) {
            pills.push(this.createPill('✨', elements.additionalPrompt.value.trim(), '#ff2d55'));
        }
        
        if (elements.cameraMovement.value) {
            pills.push(this.createPill('🎥', elements.cameraMovement.value, '#34c759'));
        }
        
        if (elements.styleRef.value.trim()) {
            pills.push(this.createPill('🎨', elements.styleRef.value.trim(), '#ff9500'));
        }
        
        if (elements.aspectRatio.value) {
            pills.push(this.createPill('📐', elements.aspectRatio.value, '#5ac8fa'));
        }
        
        if (elements.additionalParams.value.trim()) {
            pills.push(this.createPill('⚙️', elements.additionalParams.value.trim(), '#af52de'));
        }
        
        elements.promptPreview.innerHTML = pills.join('');
    }

    createPill(icon, text, color) {
        return `
            <span class="pill" style="background: ${color}; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                ${icon} ${text}
            </span>
        `;
    }

    clearAll() {
        elements.basePrompt.value = '';
        elements.baseDropdown.value = '';
        elements.additionalPrompt.value = '';
        elements.cameraMovement.value = '';
        elements.styleRef.value = '';
        elements.styleDropdown.value = '';
        elements.aspectRatio.value = '--ar 9:16';
        elements.additionalParams.value = '';
        elements.outputDisplay.innerHTML = '<p style="color: var(--text-tertiary); font-style: italic;">생성된 프롬프트가 여기에 표시됩니다...</p>';
        elements.promptPreview.innerHTML = '';
        elements.copyBtn.disabled = true;
        this.showNotification('모든 필드가 초기화되었습니다', 'info');
    }

    savePrompt() {
        const prompt = elements.outputDisplay.dataset.prompt;
        
        if (!prompt) {
            this.showNotification('저장할 프롬프트가 없습니다', 'error');
            return;
        }
        
        const saved = {
            id: Date.now(),
            prompt: prompt,
            timestamp: new Date().toLocaleString('ko-KR')
        };
        
        this.savedPrompts.unshift(saved);
        if (this.savedPrompts.length > 10) {
            this.savedPrompts = this.savedPrompts.slice(0, 10);
        }
        
        localStorage.setItem('savedPrompts', JSON.stringify(this.savedPrompts));
        this.showNotification('프롬프트가 저장되었습니다', 'success');
    }

    async copyToClipboard() {
        const prompt = elements.outputDisplay.dataset.prompt;
        
        if (!prompt) {
            this.showNotification('복사할 프롬프트가 없습니다', 'error');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(prompt);
            const original = elements.copyBtn.innerHTML;
            elements.copyBtn.innerHTML = '<span>✅</span><span>복사됨!</span>';
            elements.copyBtn.style.background = 'var(--green)';
            
            setTimeout(() => {
                elements.copyBtn.innerHTML = original;
                elements.copyBtn.style.background = '';
            }, 2000);
            
            this.showNotification('클립보드에 복사되었습니다', 'success');
        } catch (err) {
            this.showNotification('복사 실패', 'error');
        }
    }

    loadPreset(presetName) {
        const preset = this.presetTemplates[presetName];
        if (!preset) return;
        
        elements.basePrompt.value = preset.basePrompt;
        elements.cameraMovement.value = preset.cameraMovement;
        elements.styleRef.value = preset.styleRef;
        elements.aspectRatio.value = preset.aspectRatio;
        elements.additionalParams.value = preset.additionalParams;
        
        this.updatePreview();
        this.showNotification(`${presetName} 프리셋이 로드되었습니다`, 'success');
    }

    setupAnimations() {
        // Intersection Observer for fade-in animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });
        
        document.querySelectorAll('.animate-fadeIn').forEach(el => {
            observer.observe(el);
        });
        
        // Card hover effects
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-4px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = '';
            });
        });
    }

    setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    animateOutput() {
        elements.outputDisplay.style.opacity = '0';
        elements.outputDisplay.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            elements.outputDisplay.style.transition = 'all 0.3s ease';
            elements.outputDisplay.style.opacity = '1';
            elements.outputDisplay.style.transform = 'scale(1)';
        }, 10);
    }

    shakeElement(element) {
        element.classList.add('shake');
        setTimeout(() => element.classList.remove('shake'), 500);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        const colors = {
            success: 'var(--green)',
            error: 'var(--red)',
            info: 'var(--blue)'
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 68px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 10px;
            background: ${colors[type]};
            color: white;
            font-size: 14px;
            font-weight: 500;
            z-index: 1000;
            transform: translateX(400px);
            transition: transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });
        
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Add shake animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
        20%, 40%, 60%, 80% { transform: translateX(4px); }
    }
    
    .shake {
        animation: shake 0.5s;
    }
    
    .visible {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
    new PromptBuilder();
});