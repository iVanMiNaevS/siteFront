
const API_URL = 'http://localhost:3000/api';

let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.textContent = message;
        notification.style.backgroundColor = type === 'success' ? '#27ae60' : '#e74c3c';
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        showNotification('Не удалось загрузить товары', 'error');
    }
}

function displayProducts(products) {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;
    
    productsGrid.innerHTML = '';
    
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
  
        const isInFavorites = currentUser?.favorites?.some(f => f.id === product.id);
        const heartIcon = isInFavorites ? '❤️' : '🤍';
        
       card.innerHTML = `
    <div class="product-image">
        <img src="http://localhost:3000${product.image}" alt="${product.name}" loading="lazy"> 
    </div>
            <div class="product-title">${product.name}</div>
            <div class="product-price">${product.price.toLocaleString()} ₽</div>
            ${!product.inStock ? '<div style="color: red; margin-bottom: 10px; font-weight: bold;">Нет в наличии</div>' : ''}
            <div class="product-actions">
                <button class="btn btn-primary" onclick="window.location.href='product.html?id=${product.id}'">Подробнее</button>
                ${product.inStock ? 
                    `<button class="btn btn-success" onclick="addToCart(${product.id})">В корзину</button>` : 
                    '<button class="btn btn-success" disabled style="opacity: 0.5;">Нет в наличии</button>'
                }
                <button class="btn-favorite" onclick="toggleFavorite(${product.id})">${heartIcon}</button>
            </div>
        `;
        productsGrid.appendChild(card);
    });
}

async function login(email, password) {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data;
            localStorage.setItem('currentUser', JSON.stringify(data));
            showNotification('Вход выполнен!');
            window.location.href = 'index.html';
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        showNotification('Ошибка соединения с сервером', 'error');
    }
}

async function register(name, email, password) {
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Регистрация успешна!');
            window.location.href = 'login.html';
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        showNotification('Ошибка соединения с сервером', 'error');
    }
}

async function addToCart(productId) {
    if (!currentUser) {
        showNotification('Сначала войдите в систему', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/cart/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, productId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser.cart = data.cart;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateCartCount();
            showNotification('Товар добавлен в корзину!');
        }
    } catch (error) {
        showNotification('Ошибка', 'error');
    }
}

async function removeFromCart(productId) {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_URL}/cart/remove`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, productId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser.cart = data.cart;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateCartCount();
            showNotification('Товар удален из корзины');
            
            if (window.location.pathname.includes('cart.html')) {
                displayCart(currentUser.cart);
            }
        }
    } catch (error) {
        showNotification('Ошибка', 'error');
    }
}

async function toggleFavorite(productId) {
    if (!currentUser) {
        showNotification('Сначала войдите в систему', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    const isInFavorites = currentUser.favorites?.some(f => f.id === productId);
    const url = isInFavorites ? `${API_URL}/favorites/remove` : `${API_URL}/favorites/add`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, productId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser.favorites = data.favorites;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateFavoritesCount();
           
            if (window.location.pathname.includes('index.html')) {
                loadProducts();
            }
            if (window.location.pathname.includes('favorites.html')) {
                displayFavorites(currentUser.favorites);
            }
            if (window.location.pathname.includes('product.html')) {
                loadProductPage();
            }
            
            showNotification(isInFavorites ? 'Удалено из избранного' : 'Добавлено в избранное');
        }
    } catch (error) {
        showNotification('Ошибка', 'error');
    }
}

function loadCart() {
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    displayCart(currentUser.cart || []);
}

function loadFavorites() {
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    displayFavorites(currentUser.favorites || []);
}

function loadProfile() {
    const profileContainer = document.getElementById('profile-container');
    if (!profileContainer) return;
    
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    profileContainer.innerHTML = `
        <div class="profile-header">
            <h2>${currentUser.name}</h2>
        </div>
        
        <div class="user-info">
            <p><strong>Имя:</strong> ${currentUser.name}</p>
            <p><strong>Email:</strong> ${currentUser.email}</p>
            <p><strong>ID пользователя:</strong> ${currentUser.id}</p>
        </div>
        
        <div class="profile-field">
            <label>Статистика:</label>
            <div class="field-value">
                <p>✅ В корзине: ${currentUser.cart?.length || 0} товаров</p>
                <p>❤️ В избранном: ${currentUser.favorites?.length || 0} товаров</p>
            </div>
        </div>
        
        <button class="btn btn-primary" style="width: 100%;" onclick="showNotification('Данные сохранены!')">Сохранить изменения</button>
        <button class="logout-btn" onclick="logout()">Выйти из аккаунта</button>
    `;
}

async function loadProductPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id')) || 1;
    
    try {
        const response = await fetch(`${API_URL}/products/${productId}`);
        const product = await response.json();
        
        if (product) {
            document.title = `ShoeStore - ${product.name}`;
      
            const imageContainer = document.getElementById('product-image-container');
            if (imageContainer) {
                const imageUrl = `http://localhost:3000${product.image}`;
                imageContainer.innerHTML = `<img src="${imageUrl}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">`;
            }
            
            const infoContainer = document.getElementById('product-info-container');
            if (infoContainer) {
                const characteristicsList = product.characteristics ? 
                    product.characteristics.map(char => `<li>${char}</li>`).join('') : 
                    '<li>Характеристики уточняйте у продавца</li>';
                
                const isInFavorites = currentUser?.favorites?.some(f => f.id === product.id);
                const heartIcon = isInFavorites ? '❤️' : '🤍';
                
                infoContainer.innerHTML = `
                    <h1>${product.name}</h1>
                    <div class="price">${product.price.toLocaleString()} ₽</div>
                    
                    <div class="product-description">
                        <h3>Описание:</h3>
                        <p>${product.fullDescription || product.description}</p>
                        
                        <h3>Характеристики:</h3>
                        <ul>
                            ${characteristicsList}
                        </ul>
                        
                        <h3>Наличие:</h3>
                        <p style="color: ${product.inStock ? '#27ae60' : '#e74c3c'}; font-weight: bold;">
                            ${product.inStock ? '✅ В наличии' : '❌ Нет в наличии'}
                        </p>
                    </div>
                    
                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        ${product.inStock ? 
                            `<button class="btn btn-primary" style="flex: 1;" onclick="addToCart(${product.id})">Добавить в корзину</button>` :
                            '<button class="btn btn-primary" style="flex: 1; opacity: 0.5;" disabled>Нет в наличии</button>'
                        }
                        <button class="btn-favorite" style="flex: 0 0 auto; width: 54px; height: 54px; font-size: 24px;" onclick="toggleFavorite(${product.id})">${heartIcon}</button>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки товара:', error);
        showNotification('Не удалось загрузить товар', 'error');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showNotification('Вы вышли из системы');
    window.location.href = 'index.html';
}


function updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        cartCount.textContent = currentUser?.cart?.length || 0;
        cartCount.style.display = (currentUser?.cart?.length || 0) > 0 ? 'inline' : 'none';
    }
}

function updateFavoritesCount() {
    const favCount = document.getElementById('favorites-count');
    if (favCount) {
        favCount.textContent = currentUser?.favorites?.length || 0;
        favCount.style.display = (currentUser?.favorites?.length || 0) > 0 ? 'inline' : 'none';
    }
}


function displayCart(cart) {
    const cartContainer = document.getElementById('cart-container');
    if (!cartContainer) return;
    
    if (cart.length === 0) {
        cartContainer.innerHTML = '<div class="empty-message">Корзина пуста</div>';
        return;
    }
    
    let totalPrice = 0;
    let tableHTML = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Товар</th>
                        <th>Цена</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    cart.forEach(item => {
        totalPrice += item.price;
        tableHTML += `
            <tr>
                <td>${item.name}</td>
                <td>${item.price.toLocaleString()} ₽</td>
                <td>
                    <button class="btn btn-danger" onclick="removeFromCart(${item.id})">Удалить</button>
                </td>
            </tr>
        `;
    });
    
    tableHTML += `
                </tbody>
                <tfoot>
                    <tr>
                        <td><strong>Итого:</strong></td>
                        <td><strong>${totalPrice.toLocaleString()} ₽</strong></td>
                        <td>
                            <button class="btn btn-success" onclick="showNotification('Заказ оформлен!')">Оформить заказ</button>
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;
    
    cartContainer.innerHTML = tableHTML;
}

function displayFavorites(favorites) {
    const favoritesContainer = document.getElementById('favorites-container');
    if (!favoritesContainer) return;
    
    if (favorites.length === 0) {
        favoritesContainer.innerHTML = '<div class="empty-message">Список избранного пуст</div>';
        return;
    }
    
    let tableHTML = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Товар</th>
                        <th>Цена</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    favorites.forEach(item => {
        tableHTML += `
            <tr>
                <td>${item.name}</td>
                <td>${item.price.toLocaleString()} ₽</td>
                <td>
                    <button class="btn btn-success" onclick="addToCart(${item.id})">В корзину</button>
                    <button class="btn btn-danger" onclick="toggleFavorite(${item.id})">Удалить</button>
                </td>
            </tr>
        `;
    });
    
    tableHTML += `
                </tbody>
            </table>
        </div>
    `;
    
    favoritesContainer.innerHTML = tableHTML;
}

async function searchProducts() {
    const searchInput = document.getElementById('search-input');
    const filterSelect = document.getElementById('filter-select');
    
    if (!searchInput || !filterSelect) return;
    
    try {
        const response = await fetch(`${API_URL}/products`);
        let products = await response.json();
        
        const searchTerm = searchInput.value.toLowerCase();
        const filterValue = filterSelect.value;
        
        const filteredProducts = products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm);
            const matchesFilter = filterValue === 'all' || product.category === filterValue;
            return matchesSearch && matchesFilter;
        });
        
        displayProducts(filteredProducts);
    } catch (error) {
        console.error('Ошибка поиска:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
  
    if (!document.getElementById('notification')) {
        const notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
  
    updateCartCount();
    updateFavoritesCount();
 
    if (document.getElementById('products-grid')) {
        loadProducts();
    }
    
    if (document.getElementById('cart-container')) {
        loadCart();
    }
    
    if (document.getElementById('favorites-container')) {
        loadFavorites();
    }
    
    if (window.location.pathname.includes('product.html')) {
        loadProductPage();
    }
    
    if (window.location.pathname.includes('profile.html')) {
        loadProfile();
    }
    
   
    const searchInput = document.getElementById('search-input');
    const filterSelect = document.getElementById('filter-select');
    
    if (searchInput) {
        searchInput.addEventListener('input', searchProducts);
    }
    
    if (filterSelect) {
        filterSelect.addEventListener('change', searchProducts);
    }
});