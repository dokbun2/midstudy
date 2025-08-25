// Linear-style Sref Library JavaScript

// State Management
let styles = JSON.parse(localStorage.getItem('srefStyles')) || [];
let currentFilter = 'all';
let currentSort = 'recent';
let currentLayout = 'landscape'; // Default layout
let editingId = null;

// DOM Elements
const cardsGrid = document.getElementById('cards-grid');
const emptyState = document.getElementById('empty-state');
const modal = document.getElementById('style-modal');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadStyles();
    
    // Restore saved layout preference
    const savedLayout = localStorage.getItem('preferredLayout');
    if (savedLayout) {
        currentLayout = savedLayout;
        // Update active button
        document.querySelectorAll('.layout-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.layout === currentLayout) {
                btn.classList.add('active');
            }
        });
    }
    
    renderStyles();
    updateStats();
    initializeEventListeners();
    updateGridLayout();
    
    // Add sample styles if empty
    if (styles.length === 0) {
        addSampleStyles();
    }
});

// Event Listeners
function initializeEventListeners() {
    // Add new style
    document.getElementById('add-new-btn').addEventListener('click', openModal);
    
    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentFilter = e.currentTarget.dataset.filter;
            renderStyles();
        });
    });
    
    // Layout toggle buttons
    document.querySelectorAll('.layout-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentLayout = e.currentTarget.dataset.layout;
            updateGridLayout();
        });
    });
    
    // Search
    searchInput?.addEventListener('input', debounce(() => {
        renderStyles();
    }, 300));
    
    // Sort
    sortSelect?.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderStyles();
    });
    
    // Image upload
    const imageUpload = document.getElementById('image-upload');
    const imageInput = document.getElementById('image-input');
    const uploadArea = document.getElementById('upload-area');
    const uploadPreview = document.getElementById('upload-preview');
    
    uploadArea?.addEventListener('click', () => imageInput?.click());
    
    imageInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadPreview.src = e.target.result;
                uploadPreview.style.display = 'block';
                uploadArea.style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Cmd/Ctrl + K for search
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            searchInput?.focus();
        }
        
        // Escape to close modal
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}

// Modal Functions
function openModal(styleId = null) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    if (styleId) {
        editingId = styleId;
        const style = styles.find(s => s.id === styleId);
        if (style) {
            document.getElementById('modal-title').textContent = '스타일 편집';
            document.getElementById('sref-input').value = style.sref;
            document.getElementById('category-select').value = style.category;
            document.getElementById('description-input').value = style.description || '';
            document.getElementById('tags-input').value = style.tags?.join(', ') || '';
            
            if (style.image) {
                document.getElementById('upload-preview').src = style.image;
                document.getElementById('upload-preview').style.display = 'block';
                document.getElementById('upload-area').style.display = 'none';
            }
        }
    } else {
        editingId = null;
        document.getElementById('modal-title').textContent = '새 스타일 추가';
        resetModal();
    }
}

function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    editingId = null;
    resetModal();
}

function resetModal() {
    document.getElementById('sref-input').value = '';
    document.getElementById('category-select').value = 'illustration';
    document.getElementById('description-input').value = '';
    document.getElementById('tags-input').value = '';
    document.getElementById('upload-preview').style.display = 'none';
    document.getElementById('upload-area').style.display = 'flex';
    document.getElementById('image-input').value = '';
}

// Save Style
function saveStyle() {
    const sref = document.getElementById('sref-input').value.trim();
    const category = document.getElementById('category-select').value;
    const description = document.getElementById('description-input').value.trim();
    const tags = document.getElementById('tags-input').value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag);
    const image = document.getElementById('upload-preview').src;
    
    if (!sref) {
        showToast('Sref 코드를 입력해주세요', 'error');
        return;
    }
    
    const styleData = {
        sref,
        category,
        description,
        tags,
        image: image && image !== window.location.href ? image : null,
        createdAt: editingId ? styles.find(s => s.id === editingId).createdAt : Date.now(),
        favorite: editingId ? styles.find(s => s.id === editingId).favorite : false
    };
    
    if (editingId) {
        // Edit existing style
        const index = styles.findIndex(s => s.id === editingId);
        styles[index] = { ...styles[index], ...styleData };
        showToast('스타일이 수정되었습니다');
    } else {
        // Add new style
        const newStyle = {
            id: Date.now().toString(),
            ...styleData
        };
        styles.unshift(newStyle);
        showToast('새 스타일이 추가되었습니다');
    }
    
    saveStyles();
    renderStyles();
    updateStats();
    closeModal();
}

// Delete Style
function deleteStyle(id) {
    if (confirm('이 스타일을 삭제하시겠습니까?')) {
        styles = styles.filter(s => s.id !== id);
        saveStyles();
        renderStyles();
        updateStats();
        showToast('스타일이 삭제되었습니다');
    }
}

// Toggle Favorite
function toggleFavorite(id) {
    const style = styles.find(s => s.id === id);
    if (style) {
        style.favorite = !style.favorite;
        saveStyles();
        renderStyles();
        updateStats();
    }
}

// Copy Sref
function copySref(sref) {
    navigator.clipboard.writeText(sref).then(() => {
        showToast('Sref 코드가 복사되었습니다');
    });
}

// Render Styles
function renderStyles() {
    let filteredStyles = [...styles];
    
    // Apply search filter
    const searchTerm = searchInput?.value.toLowerCase() || '';
    if (searchTerm) {
        filteredStyles = filteredStyles.filter(style => 
            style.sref.toLowerCase().includes(searchTerm) ||
            style.description?.toLowerCase().includes(searchTerm) ||
            style.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) ||
            style.category.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply category filter
    if (currentFilter !== 'all') {
        if (currentFilter === 'favorites') {
            filteredStyles = filteredStyles.filter(style => style.favorite);
        } else {
            filteredStyles = filteredStyles.filter(style => style.category === currentFilter);
        }
    }
    
    // Apply sorting
    switch (currentSort) {
        case 'name':
            filteredStyles.sort((a, b) => a.sref.localeCompare(b.sref));
            break;
        case 'category':
            filteredStyles.sort((a, b) => a.category.localeCompare(b.category));
            break;
        case 'favorites':
            filteredStyles.sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));
            break;
        case 'recent':
        default:
            filteredStyles.sort((a, b) => b.createdAt - a.createdAt);
    }
    
    // Update filter counts
    updateFilterCounts();
    
    // Render cards
    if (filteredStyles.length === 0) {
        cardsGrid.style.display = 'none';
        emptyState.style.display = 'flex';
    } else {
        cardsGrid.style.display = 'grid';
        emptyState.style.display = 'none';
        
        cardsGrid.innerHTML = filteredStyles.map(style => `
            <div class="style-card animate-slideUp" data-id="${style.id}">
                <div class="card-image">
                    ${style.image ? 
                        `<img src="${style.image}" alt="${style.sref}">` :
                        `<div style="display: flex; align-items: center; justify-content: center; height: 100%; background: var(--bg-tertiary); color: var(--text-quaternary);">
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5">
                                <rect x="8" y="8" width="32" height="32" rx="4"/>
                                <circle cx="18" cy="18" r="3"/>
                                <path d="M8 32L20 20L32 32"/>
                                <path d="M28 28L36 20L44 28"/>
                            </svg>
                        </div>`
                    }
                    <button class="card-favorite ${style.favorite ? 'active' : ''}" onclick="toggleFavorite('${style.id}')">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="${style.favorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.5">
                            <path d="M8 2L10 6L14 7L11 10L12 14L8 12L4 14L5 10L2 7L6 6L8 2Z"/>
                        </svg>
                    </button>
                </div>
                <div class="card-content">
                    <div class="card-header">
                        <div>
                            <div class="card-sref">${style.sref}</div>
                        </div>
                        <div class="card-category">${getCategoryLabel(style.category)}</div>
                    </div>
                    ${style.description ? `<div class="card-description">${style.description}</div>` : ''}
                    ${style.tags && style.tags.length > 0 ? `
                        <div class="card-tags">
                            ${style.tags.map(tag => `<span class="card-tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                    <div class="card-actions">
                        <button class="card-action" onclick="copySref('${style.sref}')">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" style="display: inline-block; margin-right: 4px;">
                                <rect x="4" y="4" width="8" height="8" rx="1"/>
                                <path d="M2 2H8V2C8 2 8 2 8 2V8"/>
                            </svg>
                            복사
                        </button>
                        <button class="card-action" onclick="openModal('${style.id}')">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" style="display: inline-block; margin-right: 4px;">
                                <path d="M10 2L12 4L5 11L2 12L3 9L10 2Z"/>
                            </svg>
                            편집
                        </button>
                        <button class="card-action" onclick="deleteStyle('${style.id}')">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" style="display: inline-block; margin-right: 4px;">
                                <path d="M4 4L10 10M10 4L4 10"/>
                            </svg>
                            삭제
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// Update Grid Layout
function updateGridLayout() {
    if (!cardsGrid) return;
    
    // Remove all layout classes
    cardsGrid.classList.remove('layout-landscape', 'layout-square', 'layout-portrait');
    
    // Add the current layout class
    if (currentLayout !== 'landscape') {
        cardsGrid.classList.add(`layout-${currentLayout}`);
    }
    
    // Save layout preference
    localStorage.setItem('preferredLayout', currentLayout);
}

// Update Stats
function updateStats() {
    document.getElementById('total-styles').textContent = styles.length;
    document.getElementById('recent-styles').textContent = styles.filter(s => 
        Date.now() - s.createdAt < 7 * 24 * 60 * 60 * 1000
    ).length;
    document.getElementById('categories-count').textContent = 
        [...new Set(styles.map(s => s.category))].length;
    document.getElementById('favorites-count').textContent = 
        styles.filter(s => s.favorite).length;
}

// Update Filter Counts
function updateFilterCounts() {
    const counts = {
        all: styles.length,
        illustration: styles.filter(s => s.category === 'illustration').length,
        cinematic: styles.filter(s => s.category === 'cinematic').length,
        painting: styles.filter(s => s.category === 'painting').length,
        modern: styles.filter(s => s.category === 'modern').length,
        vintage: styles.filter(s => s.category === 'vintage').length,
        anime: styles.filter(s => s.category === 'anime').length,
        realistic: styles.filter(s => s.category === 'realistic').length,
        favorites: styles.filter(s => s.favorite).length
    };
    
    document.querySelectorAll('.filter-tab').forEach(tab => {
        const filter = tab.dataset.filter;
        const countEl = tab.querySelector('.filter-count');
        if (countEl) {
            countEl.textContent = counts[filter] || 0;
        }
    });
}

// Get Category Label
function getCategoryLabel(category) {
    const labels = {
        illustration: '일러스트',
        cinematic: '시네마틱',
        painting: '회화',
        modern: '모던',
        vintage: '빈티지',
        anime: '애니메이션',
        realistic: '사실적',
        other: '기타'
    };
    return labels[category] || category;
}

// Storage Functions
function saveStyles() {
    localStorage.setItem('srefStyles', JSON.stringify(styles));
}

function loadStyles() {
    const saved = localStorage.getItem('srefStyles');
    if (saved) {
        styles = JSON.parse(saved);
    }
}

// Toast Notification
function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    
    const icon = toast.querySelector('.toast-icon');
    if (type === 'error') {
        icon.innerHTML = '<path d="M12 4L4 12M4 4L12 12"/>';
        icon.style.color = 'var(--accent-red)';
    } else {
        icon.innerHTML = '<path d="M4 8L7 11L12 5"/>';
        icon.style.color = 'var(--accent-green)';
    }
    
    toast.classList.add('active');
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add Sample Styles
function addSampleStyles() {
    const sampleStyles = [
        {
            id: '1',
            sref: '--sref 589264756',
            category: 'illustration',
            description: '심플하고 깔끔한 일러스트 스타일',
            tags: ['심플', '미니멀', '일러스트'],
            favorite: true,
            createdAt: Date.now() - 1000000
        },
        {
            id: '2',
            sref: '--sref 1980491416',
            category: 'modern',
            description: '차분한 그린톤의 모던한 스타일',
            tags: ['그린', '차분한', '모던'],
            favorite: false,
            createdAt: Date.now() - 2000000
        },
        {
            id: '3',
            sref: '--sref 2387774453',
            category: 'vintage',
            description: '아르누보 빈티지 스타일',
            tags: ['아르누보', '빈티지', '클래식'],
            favorite: true,
            createdAt: Date.now() - 3000000
        },
        {
            id: '4',
            sref: '--sref 2720573889',
            category: 'cinematic',
            description: '다크 시네마틱 무드',
            tags: ['다크', '시네마틱', '무드'],
            favorite: false,
            createdAt: Date.now() - 4000000
        }
    ];
    
    styles = sampleStyles;
    saveStyles();
    renderStyles();
    updateStats();
}

// Make functions globally accessible
window.openModal = openModal;
window.closeModal = closeModal;
window.saveStyle = saveStyle;
window.deleteStyle = deleteStyle;
window.toggleFavorite = toggleFavorite;
window.copySref = copySref;