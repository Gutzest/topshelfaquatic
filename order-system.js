/**
 * Shopping Cart and Order Management System
 */

// Shopping cart state
let cart = [];

// API Base URL - use same origin for API calls
const API_BASE = '';

/**
 * API request helper
 */
async function apiRequest(method, endpoint, data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    const response = await fetch(API_BASE + endpoint, options);
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
}

/**
 * Load fish data from API
 */
async function loadFishFromAPI() {
    try {
        const fishes = await apiRequest('GET', '/api/fishes');
        return fishes;
    } catch (error) {
        console.error('Failed to load fish from API:', error);
        // Fallback to JSON file
        const response = await fetch('/fish-data.json');
        return await response.json();
    }
}

/**
 * Add item to cart
 */
function addToCart(fishId, fishData) {
    const existingItem = cart.find(item => item.fishId === fishId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            fishId: fishId,
            title: fishData.title,
            description: fishData.description,
            price: parseFloat(fishData.price.replace(' บาท', '')),
            image: fishData.image,
            quantity: 1
        });
    }
    
    updateCartUI();
    showNotification('เพิ่มลงตะกร้าแล้ว!', 'success');
}

/**
 * Remove item from cart
 */
function removeFromCart(fishId) {
    cart = cart.filter(item => item.fishId !== fishId);
    updateCartUI();
}

/**
 * Update cart quantity
 */
function updateCartQuantity(fishId, quantity) {
    const item = cart.find(item => item.fishId === fishId);
    if (item) {
        item.quantity = Math.max(1, quantity);
        updateCartUI();
    }
}

/**
 * Get cart total
 */
function getCartTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

/**
 * Update cart UI
 */
function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'block' : 'none';
    }
    
    if (cartItems) {
        cartItems.innerHTML = '';
        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <img src="${item.image}" alt="${item.title}" class="cart-item-image">
                <div class="cart-item-details">
                    <h4>${item.title}</h4>
                    <p>${item.price} บาท</p>
                    <div class="quantity-controls">
                        <button onclick="updateCartQuantity(${item.fishId}, ${item.quantity - 1})">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateCartQuantity(${item.fishId}, ${item.quantity + 1})">+</button>
                    </div>
                </div>
                <button onclick="removeFromCart(${item.fishId})" class="remove-item">×</button>
            `;
            cartItems.appendChild(cartItem);
        });
    }
    
    if (cartTotal) {
        cartTotal.textContent = `${getCartTotal().toLocaleString()} บาท`;
    }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 5px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

/**
 * Show cart modal
 */
function showCart() {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        modal.style.display = 'block';
        updateCartUI();
    }
}

/**
 * Hide cart modal
 */
function hideCart() {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Show checkout form
 */
function showCheckout() {
    if (cart.length === 0) {
        showNotification('ตะกร้าสินค้าว่างเปล่า', 'error');
        return;
    }
    
    hideCart();
    const checkoutModal = document.getElementById('checkout-modal');
    if (checkoutModal) {
        checkoutModal.style.display = 'block';
        
        // Update checkout summary
        const checkoutItems = document.getElementById('checkout-items');
        const checkoutTotal = document.getElementById('checkout-total');
        
        if (checkoutItems) {
            checkoutItems.innerHTML = '';
            cart.forEach(item => {
                const div = document.createElement('div');
                div.className = 'checkout-item';
                div.innerHTML = `
                    <span>${item.title} x${item.quantity}</span>
                    <span>${(item.price * item.quantity).toLocaleString()} บาท</span>
                `;
                checkoutItems.appendChild(div);
            });
        }
        
        if (checkoutTotal) {
            checkoutTotal.textContent = `${getCartTotal().toLocaleString()} บาท`;
        }
    }
}

/**
 * Hide checkout form
 */
function hideCheckout() {
    const modal = document.getElementById('checkout-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Submit order
 */
async function submitOrder(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const orderData = {
        customerName: formData.get('customerName'),
        customerEmail: formData.get('customerEmail'),
        customerPhone: formData.get('customerPhone'),
        customerAddress: formData.get('customerAddress'),
        notes: formData.get('notes'),
        totalAmount: getCartTotal(),
        orderItems: cart.map(item => ({
            fishId: item.fishId,
            title: item.title,
            price: item.price + ' บาท',
            quantity: item.quantity
        }))
    };
    
    try {
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'กำลังส่งคำสั่งซื้อ...';
        
        const result = await apiRequest('POST', '/api/orders', orderData);
        
        showNotification('สั่งซื้อสำเร็จ! เราจะติดต่อกลับไปเร็วที่สุด', 'success');
        
        // Clear cart and close modals
        cart = [];
        updateCartUI();
        hideCheckout();
        form.reset();
        
        // Show success message with order ID
        setTimeout(() => {
            alert(`คำสั่งซื้อของคุณได้รับการบันทึกแล้ว\nหมายเลขคำสั่งซื้อ: ${result.orderId}\n\nเราจะติดต่อกลับไปเพื่อยืนยันการสั่งซื้อในเร็วที่สุด`);
        }, 1000);
        
    } catch (error) {
        console.error('Order submission failed:', error);
        console.log('Order data being sent:', orderData);
        console.log('API Base URL:', API_BASE);
        
        // Show more specific error message
        let errorMessage = 'เกิดข้อผิดพลาดในการส่งคำสั่งซื้อ กรุณาลองใหม่';
        if (error.message.includes('Failed to fetch')) {
            errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
        } else if (error.message.includes('400')) {
            errorMessage = 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบข้อมูลและลองใหม่';
        } else if (error.message.includes('500')) {
            errorMessage = 'เซิร์ฟเวอร์มีปัญหา กรุณาลองใหม่ในภายหลัง';
        }
        
        showNotification(errorMessage, 'error');
    } finally {
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = 'ยืนยันการสั่งซื้อ';
    }
}

/**
 * Initialize order system
 */
function initializeOrderSystem() {
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .notification {
            animation: slideIn 0.3s ease;
        }
    `;
    document.head.appendChild(style);
    
    console.log('Order system initialized');
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeOrderSystem);
} else {
    initializeOrderSystem();
}