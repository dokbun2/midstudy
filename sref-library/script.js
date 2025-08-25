// State Management
let srefLibrary = {
    cards: [],
    currentCategory: 'all',
    editMode: false,
    deleteMode: false,
    currentEditId: null
};

// Load data from localStorage on page load
function loadFromLocalStorage() {
    const saved = localStorage.getItem('srefLibrary');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            srefLibrary.cards = data.cards || [];
        } catch (e) {
            console.error('Error loading saved data:', e);
        }
    }
}

// Save data to localStorage
function saveToLocalStorage() {
    try {
        localStorage.setItem('srefLibrary', JSON.stringify({
            cards: srefLibrary.cards
        }));
    } catch (e) {
        console.error('Error saving data:', e);
        showToast('저장 중 오류가 발생했습니다', 'error');
    }
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Image handling with cache
function handleImageUpload(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject('No file provided');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            resolve(e.target.result);
        };
        reader.onerror = function() {
            reject('Error reading file');
        };
        reader.readAsDataURL(file);
    });
}

// Category management
function getCategoryName(category) {
    const names = {
        'all': '전체',
        'illustration': '일러스트',
        'cinematic': '시네마틱',
        'painting': '회화',
        'modern': '모던',
        'vintage': '빈티지',
        'anime': '애니메이션',
        'realistic': '사실적',
        'abstract': '추상',
        'other': '기타'
    };
    return names[category] || category;
}

// Update category counts
function updateCategoryCounts() {
    const counts = {
        all: srefLibrary.cards.length,
        illustration: 0,
        cinematic: 0,
        painting: 0,
        modern: 0,
        vintage: 0,
        anime: 0,
        realistic: 0,
        abstract: 0,
        other: 0
    };

    srefLibrary.cards.forEach(card => {
        if (counts.hasOwnProperty(card.category)) {
            counts[card.category]++;
        }
    });

    Object.keys(counts).forEach(category => {
        const element = document.getElementById(`count-${category}`);
        if (element) {
            element.textContent = counts[category];
        }
    });
}

// Render cards
function renderCards() {
    const container = document.getElementById('cards-container');
    container.innerHTML = '';

    let cardsToShow = srefLibrary.cards;
    if (srefLibrary.currentCategory !== 'all') {
        cardsToShow = srefLibrary.cards.filter(card => card.category === srefLibrary.currentCategory);
    }

    cardsToShow.forEach(card => {
        const cardElement = createCardElement(card);
        container.appendChild(cardElement);
    });

    updateCategoryCounts();
}

// Create card element
function createCardElement(card) {
    const div = document.createElement('div');
    div.className = 'sref-card';
    div.dataset.id = card.id;

    if (srefLibrary.editMode) {
        div.classList.add('edit-mode');
    }
    if (srefLibrary.deleteMode) {
        div.classList.add('delete-mode');
    }

    div.innerHTML = `
        <div class="card-image">
            ${card.image ? 
                `<img src="${card.image}" alt="${card.description}">` : 
                `<span class="no-image">🖼️</span>`
            }
        </div>
        <div class="card-content">
            <span class="card-category">${getCategoryName(card.category)}</span>
            <div class="card-description">${card.description || '설명 없음'}</div>
            <div class="card-sref">${card.sref}</div>
            <div class="card-actions">
                <button class="card-btn copy-btn" onclick="copySref('${card.sref}')">
                    📋 복사
                </button>
            </div>
        </div>
        ${srefLibrary.editMode ? '<div class="edit-overlay"><span class="edit-icon">✏️</span></div>' : ''}
        ${srefLibrary.deleteMode ? '<div class="delete-overlay"><span class="delete-icon">🗑️</span></div>' : ''}
    `;

    // Add click handlers for edit/delete modes
    if (srefLibrary.editMode) {
        div.addEventListener('click', () => editCard(card.id));
    } else if (srefLibrary.deleteMode) {
        div.addEventListener('click', () => deleteCard(card.id));
    }

    return div;
}

// Copy sref to clipboard
function copySref(sref) {
    navigator.clipboard.writeText(sref).then(() => {
        showToast('Sref가 클립보드에 복사되었습니다!', 'success');
    }).catch(() => {
        showToast('복사 실패. 수동으로 복사해주세요.', 'error');
    });
}

// Show/hide modal
function showModal(title = '새 카드 추가') {
    const modal = document.getElementById('card-modal');
    const modalTitle = document.getElementById('modal-title');
    modalTitle.textContent = title;
    modal.classList.add('active');
}

function hideModal() {
    const modal = document.getElementById('card-modal');
    modal.classList.remove('active');
    clearModalForm();
    srefLibrary.currentEditId = null;
}

// Clear modal form
function clearModalForm() {
    document.getElementById('modal-category').value = 'illustration';
    document.getElementById('modal-description').value = '';
    document.getElementById('modal-sref').value = '';
    const preview = document.getElementById('image-preview');
    preview.innerHTML = '<span class="upload-placeholder">이미지를 선택하세요</span>';
    preview.dataset.image = '';
}

// Save card (add or update)
async function saveCard() {
    const category = document.getElementById('modal-category').value;
    const description = document.getElementById('modal-description').value;
    const sref = document.getElementById('modal-sref').value;
    const imagePreview = document.getElementById('image-preview');
    const image = imagePreview.dataset.image || '';

    if (!sref) {
        showToast('Sref 코드를 입력해주세요', 'error');
        return;
    }

    const cardData = {
        category,
        description,
        sref,
        image
    };

    if (srefLibrary.currentEditId) {
        // Update existing card
        const index = srefLibrary.cards.findIndex(c => c.id === srefLibrary.currentEditId);
        if (index !== -1) {
            srefLibrary.cards[index] = { ...srefLibrary.cards[index], ...cardData };
            showToast('카드가 수정되었습니다', 'success');
        }
    } else {
        // Add new card
        cardData.id = generateId();
        srefLibrary.cards.push(cardData);
        showToast('새 카드가 추가되었습니다', 'success');
    }

    saveToLocalStorage();
    renderCards();
    hideModal();
}

// Edit card
function editCard(id) {
    const card = srefLibrary.cards.find(c => c.id === id);
    if (!card) return;

    srefLibrary.currentEditId = id;
    
    // Fill modal with card data
    document.getElementById('modal-category').value = card.category;
    document.getElementById('modal-description').value = card.description || '';
    document.getElementById('modal-sref').value = card.sref;
    
    const preview = document.getElementById('image-preview');
    if (card.image) {
        preview.innerHTML = `<img src="${card.image}" alt="Preview">`;
        preview.dataset.image = card.image;
    }
    
    showModal('카드 수정');
}

// Delete card
function deleteCard(id) {
    if (confirm('정말로 이 카드를 삭제하시겠습니까?')) {
        srefLibrary.cards = srefLibrary.cards.filter(c => c.id !== id);
        saveToLocalStorage();
        renderCards();
        showToast('카드가 삭제되었습니다', 'success');
    }
}

// Import JSON
function importJSON(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.cards && Array.isArray(data.cards)) {
                srefLibrary.cards = data.cards;
                saveToLocalStorage();
                renderCards();
                showToast('데이터를 성공적으로 가져왔습니다', 'success');
            } else {
                showToast('올바른 JSON 형식이 아닙니다', 'error');
            }
        } catch (error) {
            showToast('JSON 파일을 읽을 수 없습니다', 'error');
        }
    };
    reader.readAsText(file);
}

// Export JSON
function exportJSON() {
    const data = {
        cards: srefLibrary.cards,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sref-library-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('데이터를 내보냈습니다', 'success');
}

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    toast.className = 'toast';
    if (type === 'error') toast.classList.add('error');
    if (type === 'warning') toast.classList.add('warning');
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Initialize event listeners
function initializeEventListeners() {
    // Category tabs selection
    document.querySelectorAll('.tab-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.tab-item').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            srefLibrary.currentCategory = this.dataset.category;
            
            const currentCategoryTitle = document.getElementById('current-category');
            currentCategoryTitle.textContent = `${getCategoryName(srefLibrary.currentCategory)} 스타일`;
            
            renderCards();
        });
    });

    // Add card button
    document.getElementById('add-card-btn').addEventListener('click', () => {
        srefLibrary.currentEditId = null;
        showModal('새 카드 추가');
    });

    // Edit mode button
    document.getElementById('edit-mode-btn').addEventListener('click', function() {
        srefLibrary.editMode = !srefLibrary.editMode;
        srefLibrary.deleteMode = false;
        this.classList.toggle('active');
        document.getElementById('delete-mode-btn').classList.remove('active');
        renderCards();
    });

    // Delete mode button
    document.getElementById('delete-mode-btn').addEventListener('click', function() {
        srefLibrary.deleteMode = !srefLibrary.deleteMode;
        srefLibrary.editMode = false;
        this.classList.toggle('active');
        document.getElementById('edit-mode-btn').classList.remove('active');
        renderCards();
    });

    // Modal close buttons
    document.getElementById('close-modal').addEventListener('click', hideModal);
    document.getElementById('cancel-modal').addEventListener('click', hideModal);

    // Save card button
    document.getElementById('save-card').addEventListener('click', saveCard);

    // Image upload
    const imagePreview = document.getElementById('image-preview');
    const imageInput = document.getElementById('modal-image-input');
    
    if (imagePreview && imageInput) {
        imagePreview.addEventListener('click', () => {
            imageInput.click();
        });
    }

    if (imageInput) {
        imageInput.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (file) {
                try {
                    const imageData = await handleImageUpload(file);
                    imagePreview.innerHTML = `<img src="${imageData}" alt="Preview">`;
                    imagePreview.dataset.image = imageData;
                } catch (error) {
                    showToast('이미지 업로드 실패', 'error');
                }
            }
        });
    }

    // Import/Export buttons
    document.getElementById('import-btn').addEventListener('click', () => {
        document.getElementById('import-file').click();
    });

    document.getElementById('import-file').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            importJSON(file);
            this.value = ''; // Reset file input
        }
    });

    document.getElementById('export-btn').addEventListener('click', exportJSON);

    // Close modal on outside click
    document.getElementById('card-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            hideModal();
        }
    });
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadFromLocalStorage();
    renderCards();
    initializeEventListeners();
    
    // Add some sample data if empty
    if (srefLibrary.cards.length === 0) {
        srefLibrary.cards = [
            {
                id: generateId(),
                category: 'illustration',
                description: '배경깔끔, 심플 일러스트',
                sref: '--sref 589264756',
                image: ''
            },
            {
                id: generateId(),
                category: 'illustration',
                description: '그린, 차분, 일러스트',
                sref: '--sref 1980491416',
                image: ''
            },
            {
                id: generateId(),
                category: 'painting',
                description: '아르누보 회화 애니메이션',
                sref: '--sref 2387774453',
                image: ''
            },
            {
                id: generateId(),
                category: 'cinematic',
                description: '시네마틱 다크톤',
                sref: '--sref 2720573889',
                image: ''
            }
        ];
        saveToLocalStorage();
        renderCards();
    }
});