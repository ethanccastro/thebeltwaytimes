// Admin Dashboard JavaScript
let currentSection = 'dashboard';
let currentItem = null;
let categories = [];
let subcategories = [];

// Initialize the admin dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    loadCategories();
    loadSubcategories();
    loadArticles();
});

// Navigation functionality
function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });
}

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionName).classList.add('active');
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    
    currentSection = sectionName;
}

// API Functions
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`/admin/api/${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'API request failed');
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        showNotification(error.message, 'error');
        throw error;
    }
}

// Load data functions
async function loadCategories() {
    try {
        categories = await apiCall('categories');
        renderCategoriesTable();
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
}

async function loadSubcategories() {
    try {
        subcategories = await apiCall('subcategories');
        renderSubcategoriesTable();
    } catch (error) {
        console.error('Failed to load subcategories:', error);
    }
}

async function loadArticles() {
    try {
        const articles = await apiCall('articles');
        renderArticlesTable(articles);
    } catch (error) {
        console.error('Failed to load articles:', error);
    }
}

// Render table functions
function renderCategoriesTable() {
    const tbody = document.querySelector('#categories-table tbody');
    if (!tbody) return;
    
    if (categories.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <i class="fas fa-folder"></i>
                    <h3>No Categories Found</h3>
                    <p>Create your first category to get started.</p>
                    <button class="btn btn-primary" onclick="showCreateModal('category')">
                        <i class="fas fa-plus"></i> Create Category
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = categories.map(category => `
        <tr>
            <td>${category.category_name}</td>
            <td><code>${category.category_slug}</code></td>
            <td>${category.category_description || '-'}</td>
            <td>${category.subcategories ? category.subcategories.length : 0}</td>
            <td class="action-buttons-cell">
                <button class="btn btn-sm btn-secondary" onclick="editItem('category', '${category.category_rowguid}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteItem('category', '${category.category_rowguid}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderSubcategoriesTable() {
    const tbody = document.querySelector('#subcategories-table tbody');
    if (!tbody) return;
    
    if (subcategories.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <h3>No Subcategories Found</h3>
                    <p>Create your first subcategory to get started.</p>
                    <button class="btn btn-primary" onclick="showCreateModal('subcategory')">
                        <i class="fas fa-plus"></i> Create Subcategory
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = subcategories.map(subcategory => `
        <tr>
            <td>${subcategory.subcategory_name}</td>
            <td><code>${subcategory.subcategory_slug}</code></td>
            <td>${subcategory.category ? subcategory.category.category_name : '-'}</td>
            <td>${subcategory.subcategory_description || '-'}</td>
            <td class="action-buttons-cell">
                <button class="btn btn-sm btn-secondary" onclick="editItem('subcategory', '${subcategory.subcategory_rowguid}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteItem('subcategory', '${subcategory.subcategory_rowguid}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderArticlesTable(articles) {
    const tbody = document.querySelector('#articles-table tbody');
    if (!tbody) return;
    
    if (articles.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-newspaper"></i>
                    <h3>No Articles Found</h3>
                    <p>Create your first article to get started.</p>
                    <button class="btn btn-primary" onclick="showCreateModal('article')">
                        <i class="fas fa-plus"></i> Create Article
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = articles.map(article => `
        <tr>
            <td>
                <div>
                    <strong>${article.article_headline}</strong>
                    <br>
                    <small class="text-muted">${article.article_slug}</small>
                </div>
            </td>
            <td>${article.article_author}</td>
            <td>${article.article_categoryrowguid ? article.article_categoryrowguid.category_name : '-'}</td>
            <td>${new Date(article.article_publishedat).toLocaleDateString()}</td>
            <td>
                <span class="badge ${article.article_featured ? 'badge-success' : 'badge-warning'}">
                    ${article.article_featured ? 'Featured' : 'Regular'}
                </span>
            </td>
            <td class="action-buttons-cell">
                <button class="btn btn-sm btn-secondary" onclick="editItem('article', '${article.article_rowguid}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteItem('article', '${article.article_rowguid}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Modal functions
function showCreateModal(type) {
    currentItem = null;
    showModal(type, 'Create New ' + type.charAt(0).toUpperCase() + type.slice(1));
}

async function editItem(type, id) {
    try {
        currentItem = await apiCall(`${type}s/${id}`);
        showModal(type, 'Edit ' + type.charAt(0).toUpperCase() + type.slice(1));
    } catch (error) {
        console.error('Failed to load item for editing:', error);
    }
}

function showModal(type, title) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalForm = document.getElementById('modal-form');
    
    modalTitle.textContent = title;
    modalForm.innerHTML = generateFormHTML(type);
    
    if (currentItem) {
        populateForm(type, currentItem);
    }
    
    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    currentItem = null;
}

function generateFormHTML(type) {
    switch (type) {
        case 'category':
            return `
                <div class="form-group">
                    <label for="category_name">Category Name *</label>
                    <input type="text" id="category_name" name="category_name" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="category_slug">Slug *</label>
                    <input type="text" id="category_slug" name="category_slug" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="category_description">Description</label>
                    <textarea id="category_description" name="category_description" class="form-control"></textarea>
                </div>
                <div class="form-group">
                    <label for="category_color">Color</label>
                    <input type="color" id="category_color" name="category_color" class="form-control">
                </div>
            `;
        
        case 'subcategory':
            return `
                <div class="form-group">
                    <label for="subcategory_name">Subcategory Name *</label>
                    <input type="text" id="subcategory_name" name="subcategory_name" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="subcategory_slug">Slug *</label>
                    <input type="text" id="subcategory_slug" name="subcategory_slug" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="category_rowguid">Category *</label>
                    <select id="category_rowguid" name="category_rowguid" class="form-control" required>
                        <option value="">Select a category</option>
                        ${categories.map(cat => `<option value="${cat.category_rowguid}">${cat.category_name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="subcategory_description">Description</label>
                    <textarea id="subcategory_description" name="subcategory_description" class="form-control"></textarea>
                </div>
            `;
        
        case 'article':
            return `
                <div class="form-group">
                    <label for="article_headline">Headline *</label>
                    <input type="text" id="article_headline" name="article_headline" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="article_slug">Slug *</label>
                    <input type="text" id="article_slug" name="article_slug" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="article_excerpt">Excerpt</label>
                    <textarea id="article_excerpt" name="article_excerpt" class="form-control"></textarea>
                </div>
                <div class="form-group">
                    <label for="article_content">Content *</label>
                    <textarea id="article_content" name="article_content" class="form-control" required></textarea>
                </div>
                <div class="form-group">
                    <label for="article_author">Author *</label>
                    <input type="text" id="article_author" name="article_author" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="article_categoryrowguid">Category *</label>
                    <select id="article_categoryrowguid" name="article_categoryrowguid" class="form-control" required>
                        <option value="">Select a category</option>
                        ${categories.map(cat => `<option value="${cat.category_rowguid}">${cat.category_name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="article_subcategoryrowguid">Subcategory</label>
                    <select id="article_subcategoryrowguid" name="article_subcategoryrowguid" class="form-control">
                        <option value="">Select a subcategory (optional)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="article_publishedat">Published Date</label>
                    <input type="datetime-local" id="article_publishedat" name="article_publishedat" class="form-control">
                </div>
                <div class="form-group">
                    <label for="article_imageurl">Image URL</label>
                    <input type="url" id="article_imageurl" name="article_imageurl" class="form-control">
                </div>
                <div class="form-group">
                    <label for="article_readtime">Read Time (minutes)</label>
                    <input type="number" id="article_readtime" name="article_readtime" class="form-control" value="5" min="1">
                </div>
                <div class="form-group">
                    <label for="article_tags">Tags (JSON array)</label>
                    <input type="text" id="article_tags" name="article_tags" class="form-control" placeholder='["tag1", "tag2"]'>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="article_featured" name="article_featured"> Featured Article
                    </label>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="article_isopinion" name="article_isopinion"> Opinion Article
                    </label>
                </div>
            `;
        
        default:
            return '<p>Unknown form type</p>';
    }
}

function populateForm(type, item) {
    const form = document.getElementById('modal-form');
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        const fieldName = input.name;
        if (item[fieldName] !== undefined) {
            if (input.type === 'checkbox') {
                input.checked = item[fieldName];
            } else if (input.type === 'datetime-local') {
                const date = new Date(item[fieldName]);
                input.value = date.toISOString().slice(0, 16);
            } else if (fieldName === 'article_tags') {
                input.value = JSON.stringify(item[fieldName] || []);
            } else {
                input.value = item[fieldName];
            }
        }
    });
}

async function saveItem() {
    const form = document.getElementById('modal-form');
    const formData = new FormData(form);
    const data = {};
    
    formData.forEach((value, key) => {
        if (key === 'article_tags') {
            try {
                data[key] = JSON.parse(value);
            } catch {
                data[key] = [];
            }
        } else if (key === 'article_featured' || key === 'article_isopinion') {
            data[key] = form.querySelector(`[name="${key}"]`).checked;
        } else {
            data[key] = value;
        }
    });
    
    try {
        if (currentItem) {
            // Update existing item
            await apiCall(`${getItemType()}/${currentItem[getItemIdField()]}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            showNotification('Item updated successfully!', 'success');
        } else {
            // Create new item
            await apiCall(`${getItemTypePlural()}`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            showNotification('Item created successfully!', 'success');
        }
        
        closeModal();
        refreshData();
    } catch (error) {
        console.error('Failed to save item:', error);
    }
}

function getItemType() {
    const modalTitle = document.getElementById('modal-title').textContent.toLowerCase();
    if (modalTitle.includes('category')) return 'category';
    if (modalTitle.includes('subcategory')) return 'subcategory';
    if (modalTitle.includes('article')) return 'article';
    return 'unknown';
}

function getItemTypePlural() {
    const type = getItemType();
    switch (type) {
        case 'category': return 'categories';
        case 'subcategory': return 'subcategories';
        case 'article': return 'articles';
        default: return 'unknown';
    }
}

function getItemIdField() {
    const type = getItemType();
    switch (type) {
        case 'category': return 'category_rowguid';
        case 'subcategory': return 'subcategory_rowguid';
        case 'article': return 'article_rowguid';
        default: return 'id';
    }
}

function deleteItem(type, id) {
    currentItem = { [getItemIdField()]: id };
    document.getElementById('delete-modal').style.display = 'block';
}

function closeDeleteModal() {
    document.getElementById('delete-modal').style.display = 'none';
    currentItem = null;
}

async function confirmDelete() {
    if (!currentItem) return;
    
    try {
        const type = getItemTypePlural();
        await apiCall(`${type}/${currentItem[getItemIdField()]}`, {
            method: 'DELETE'
        });
        
        showNotification('Item deleted successfully!', 'success');
        closeDeleteModal();
        refreshData();
    } catch (error) {
        console.error('Failed to delete item:', error);
    }
}

function refreshData() {
    switch (currentSection) {
        case 'articles':
            loadArticles();
            break;
        case 'categories':
            loadCategories();
            break;
        case 'subcategories':
            loadSubcategories();
            break;
        default:
            loadCategories();
            loadSubcategories();
            loadArticles();
    }
}

// Utility functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    
    if (type === 'success') {
        notification.style.backgroundColor = '#28a745';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#dc3545';
    } else {
        notification.style.backgroundColor = '#17a2b8';
    }
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Close modals when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('modal');
    const deleteModal = document.getElementById('delete-modal');
    
    if (event.target === modal) {
        closeModal();
    }
    if (event.target === deleteModal) {
        closeDeleteModal();
    }
}

// Handle category selection for subcategories in article form
document.addEventListener('change', function(e) {
    if (e.target.name === 'article_categoryrowguid') {
        const subcategorySelect = document.getElementById('article_subcategoryrowguid');
        const categoryId = e.target.value;
        
        if (categoryId) {
            const categorySubcategories = subcategories.filter(sub => 
                sub.category && 
                sub.category.category_rowguid && 
                sub.category.category_rowguid === categoryId
            );
            subcategorySelect.innerHTML = '<option value="">Select a subcategory (optional)</option>' +
                categorySubcategories.map(sub => `<option value="${sub.subcategory_rowguid}">${sub.subcategory_name}</option>`).join('');
        } else {
            subcategorySelect.innerHTML = '<option value="">Select a subcategory (optional)</option>';
        }
    }
}); 