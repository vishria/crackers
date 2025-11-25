document.addEventListener('DOMContentLoaded', function () {
    // --- Existing DOM elements ---
    const loginForm = document.getElementById('login-form');
    const loginPage = document.getElementById('login-page');
    const mainPage = document.getElementById('main-page');
    const errorMessage = document.getElementById('error-message');
    const navButtons = document.querySelectorAll('.nav-btn');
    const contentSlides = document.querySelectorAll('.content-slide');
    const menuToggle = document.getElementById('menuToggle');
    const cartToggle = document.getElementById('cartToggle');
    const closeMenu = document.getElementById('closeMenu');
    const closeCart = document.getElementById('closeCart');
    const mobileMenu = document.getElementById('mobileMenu');
    const cartMenu = document.getElementById('cartMenu');
    const overlay = document.getElementById('overlay');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const messageDetail = document.getElementById('message-detail');
    const messageBack = document.getElementById('message-back');
    const detailAvatar = document.getElementById('detail-avatar');
    const detailSender = document.getElementById('detail-sender');
    const detailBody = document.getElementById('detail-body');
    const detailTime = document.getElementById('detail-time');
    const messageList = document.querySelector('.message-list');
    const dynamicOrderList = document.getElementById('dynamic-order-list');
    const refreshOrdersBtn = document.getElementById('refresh-orders-btn');

    // --- NEW UI ELEMENT SELECTORS ---
    const addCategoryModal = document.getElementById('addCategoryModal');
    const closeAddCategoryModal = document.getElementById('closeAddCategoryModal');
    const cancelAddCategory = document.getElementById('cancelAddCategory');
    const saveCategoryBtn = document.getElementById('saveCategory');
    const confirmModal = document.getElementById('confirmModal');
    const closeConfirmModal = document.getElementById('closeConfirmModal');
    const cancelConfirmBtn = document.getElementById('cancelConfirm');
    let confirmActionBtn = document.getElementById('confirmAction');
    const confirmMessage = document.getElementById('confirmMessage');

    // Modal elements
    const addProductModal = document.getElementById('addProductModal');
    const imageUploadModal = document.getElementById('imageUploadModal');
    const closeAddProductModal = document.getElementById('closeAddProductModal');
    const cancelAddProduct = document.getElementById('cancelAddProduct');
    const saveProduct = document.getElementById('saveProduct');
    const closeImageModal = document.getElementById('closeImageModal');
    const cancelImageUpload = document.getElementById('cancelImageUpload');
    const saveImage = document.getElementById('saveImage');
    const productImageInput = document.getElementById('productImage');
    const imageUploadInput = document.getElementById('imageUpload');
    const imageUrlInput = document.getElementById('imageUrl');
    const addImagePreview = document.getElementById('imagePreview');
    const uploadImagePreview = document.getElementById('uploadImagePreview');

    // --- Delete Order Button ---
    const messageDeleteBtn = document.getElementById('message-delete-btn');

    // --- State Variables ---
    let cart = [];
    let currentProductCard = null;
    let currentCategoryForAdd = null;

    const API_URL = 'https://krishnapattas.onrender.com/api';

    //==================================================================
    // 1. NEW UI HELPER FUNCTIONS
    //==================================================================

    function showSnackbar(message, type = 'success') {
        const snackbar = document.getElementById('snackbar');
        if (!snackbar) return;
        snackbar.textContent = message;
        snackbar.className = 'show';
        snackbar.classList.add(type); // 'success' or 'error'
        setTimeout(() => {
            snackbar.className = snackbar.className.replace('show', '');
        }, 3000);
    }

    function showConfirmation(message, onConfirm) {
        if (!confirmModal || !confirmMessage || !confirmActionBtn) return;
        confirmMessage.textContent = message;
        confirmModal.classList.add('active');

        const newConfirmBtn = confirmActionBtn.cloneNode(true);
        confirmActionBtn.parentNode.replaceChild(newConfirmBtn, confirmActionBtn);

        // This is the crucial line that fixes the bug
        confirmActionBtn = newConfirmBtn; 

        confirmActionBtn.addEventListener('click', () => {
            onConfirm();
            confirmModal.classList.remove('active');
        });
    }
    
    // Close confirmation modal listeners
    if(closeConfirmModal) closeConfirmModal.addEventListener('click', () => confirmModal.classList.remove('active'));
    if(cancelConfirmBtn) cancelConfirmBtn.addEventListener('click', () => confirmModal.classList.remove('active'));

    function createInlineEditor(element, currentValue, onSave, inputType = 'text') {
        // Prevent creating multiple editors for the same element
        if (element.nextElementSibling && element.nextElementSibling.classList.contains('inline-editor')) {
            return;
        }

        element.style.display = 'none';
        
        const editorWrapper = document.createElement('div');
        editorWrapper.className = 'inline-editor';

        const input = document.createElement('input');
        input.type = inputType;
        input.value = currentValue;
        if(inputType === 'number') {
            input.step = '0.01';
            input.min = '0';
        }

        const actions = document.createElement('div');
        actions.className = 'inline-editor-actions';

        const saveBtn = document.createElement('button');
        saveBtn.textContent = '✔';
        saveBtn.className = 'save';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '✖';
        cancelBtn.className = 'cancel';

        actions.append(saveBtn, cancelBtn);
        editorWrapper.append(input, actions);
        element.after(editorWrapper);
        input.focus();
        input.select();

        const closeEditor = () => {
            editorWrapper.remove();
            element.style.display = '';
        };

        saveBtn.addEventListener('click', () => {
            onSave(input.value);
            closeEditor();
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveBtn.click();
            } else if (e.key === 'Escape') {
                cancelBtn.click();
            }
        });

        cancelBtn.addEventListener('click', closeEditor);
    }

    //==================================================================
    // 2. API Communication Functions (Updated for new UI)
    //==================================================================

    async function fetchAndRenderProducts() {
        try {
            const response = await fetch(`${API_URL}/products`);
            if (!response.ok) throw new Error('Network response was not ok');
            const groupedProducts = await response.json();
            const shopMain = document.querySelector('.shop-main');
            if (!shopMain) return;
            shopMain.innerHTML = `<div style="padding: 20px 10px 0; text-align: center;"><button id="addCategoryBtn" class="modal-btn modal-btn-primary">Add New Category</button></div>`;
            const categories = groupedProducts && typeof groupedProducts === 'object' ? Object.keys(groupedProducts) : [];
            for (const category of categories) {
                const productsInCategory = groupedProducts[category] || [];
                const categoryContainer = document.createElement('div');
                categoryContainer.className = 'category-container';
                categoryContainer.innerHTML = `<h2 class="shop-category">${category}</h2><div class="category-actions"><button class="shop-icon-btn add-item-btn" title="Add Item">＋</button><button class="shop-icon-btn category-edit" title="Edit Category">✎</button><button class="shop-icon-btn category-delete" title="Delete Category">🗑️</button></div>`;
                shopMain.appendChild(categoryContainer);
                const productList = document.createElement('div');
                productList.className = 'product-list';
                productsInCategory.forEach(product => {
                    const safePrice = product.price !== undefined && product.price !== null ? parseFloat(product.price) : 0;
                    const safeName = product.name || 'Unnamed Product';
                    const safeImage = product.imageUrl || 'https://via.placeholder.com/200x200/2a2338/ffffff?text=No+Image';
                    const productCard = document.createElement('div');
                    productCard.className = 'product-card';
                    if (product._id) productCard.dataset.id = product._id;
                    productCard.dataset.category = product.category || category;
                    productCard.innerHTML = `<div class="product-image"><img src="${safeImage}" alt="${safeName}"><button class="product-image-upload" title="Change Image">📁</button></div><div class="product-info"><div class="product-header"><h3>${safeName}</h3><div style="display: flex; gap: 5px;"><button class="shop-icon-btn product-edit" title="Edit Product">✎</button><button class="shop-icon-btn product-delete" title="Delete Product">🗑️</button></div></div><div class="price-container"><p class="shop-price">₹${safePrice.toFixed(2)}</p><button class="shop-icon-btn price-edit" title="Edit Price">✎</button></div><div class="shop-quantity"><button class="qty-minus">-</button> <input type="number" value="1" min="1"> <button class="qty-plus">+</button></div><div class="shop-actions"><button class="add" data-name="${escapeHtml(safeName)}" data-price="${safePrice}">Add to Cart</button><button class="buy">Buy Now</button></div></div>`;
                    productList.appendChild(productCard);
                });
                shopMain.appendChild(productList);
            }
            attachAllEventListeners();
        } catch (error) {
            console.error('Error fetching products:', error);
            showSnackbar('Failed to load products. Is the server running?', 'error');
        }
    }

    async function createProduct(productData) {
        try {
            const response = await fetch(`${API_URL}/products`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(productData),
            });
            if (!response.ok) throw new Error(await response.text());
            showSnackbar(`Product "${productData.name}" created successfully!`);
            if (addProductModal) addProductModal.classList.remove('active');
            if (addCategoryModal) addCategoryModal.classList.remove('active');
            fetchAndRenderProducts();
        } catch (error) {
            console.error('Error creating product:', error);
            showSnackbar('Error: Could not create the product.', 'error');
        }
    }

    async function updateProduct(id, updates) {
        try {
            const response = await fetch(`${API_URL}/products/${id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates),
            });
            if (!response.ok) throw new Error(await response.text());
            showSnackbar(`Product updated successfully!`);
            if (imageUploadModal) imageUploadModal.classList.remove('active');
            fetchAndRenderProducts();
        } catch (error) {
            console.error('Error updating product:', error);
            showSnackbar('Error: Could not update the product.', 'error');
        }
    }

    async function deleteProduct(id) {
        showConfirmation('Are you sure you want to delete this product?', async () => {
             try {
                const response = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
                if (!response.ok) throw new Error(await response.text());
                showSnackbar(`Product deleted successfully!`);
                fetchAndRenderProducts();
            } catch (error) {
                console.error('Error deleting product:', error);
                showSnackbar('Error: Could not delete the product.', 'error');
            }
        });
    }

    async function updateCategory(oldName, newName) {
        try {
            const response = await fetch(`${API_URL}/categories/${encodeURIComponent(oldName)}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newName }),
            });
            if (!response.ok) throw new Error('Failed to update category');
            showSnackbar(`Category renamed to "${newName}" successfully!`);
            fetchAndRenderProducts();
        } catch (error) {
            console.error('Error updating category:', error);
            showSnackbar('Error: Could not rename the category.', 'error');
        }
    }

    async function deleteCategory(name) {
        const message = `Delete the "${name}" category? THIS WILL DELETE ALL PRODUCTS WITHIN IT.`;
        showConfirmation(message, async () => {
            try {
                const response = await fetch(`${API_URL}/categories/${encodeURIComponent(name)}`, { method: 'DELETE' });
                if (!response.ok) throw new Error('Failed to delete category');
                showSnackbar(`Category "${name}" deleted successfully!`);
                fetchAndRenderProducts();
            } catch (error) {
                console.error('Error deleting category:', error);
                showSnackbar('Error: Could not delete the category.', 'error');
            }
        });
    }

    //==================================================================
    // ORDER MANAGEMENT FUNCTIONS
    //==================================================================

    async function fetchAndRenderOrders() {
        const orderContainer = document.getElementById('dynamic-order-list');
        const btn = document.getElementById('refresh-orders-btn'); 
        if (!orderContainer) {
          console.error('Error: The container for orders (#dynamic-order-list) was not found.');
          return;
        }
        if (btn) btn.classList.add('refreshing'); 
        if (!document.getElementById('order-styles')) {
            const style = document.createElement('style');
            style.id = 'order-styles';
            style.innerHTML = `
            #dynamic-order-list { display: flex; flex-direction: column; gap: 12px; padding: 10px; } .message-item { display: flex; gap: 12px; padding: 12px 16px; background-color: #fff; border-radius: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); cursor: pointer; transition: transform 0.1s, box-shadow 0.2s; border-left: 4px solid transparent; } .message-item:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.12); } .message-avatar { width: 50px; height: 50px; flex-shrink: 0; border-radius: 50%; background-color: #007bff; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 20px; text-transform: uppercase; } .message-content { flex: 1; display: flex; flex-direction: column; justify-content: center; } .message-sender { display: flex; justify-content: space-between; font-weight: 600; font-size: 15px; margin-bottom: 4px; } .message-time { font-size: 13px; color: #555; display: flex; align-items: center; gap: 6px; } .message-preview { font-size: 14px; color: #333; margin-bottom: 4px; } .message-meta { font-size: 13px; color: #777; } .unread-dot { display: inline-block; color: red; font-size: 14px; margin-left: 6px; } .bill-items { margin-top: 15px; border-top: 1px solid #ddd; padding-top: 10px; } .bill-items ul { list-style: none; padding: 0; margin: 4px 0 0 0; } .bill-items li { display: flex; justify-content: space-between; font-size: 14px; padding: 4px 0; border-bottom: 1px dashed #eee; } .bill-items li:last-child { border-bottom: none; }
            .bill-total-row { border-top: 2px solid #333 !important; font-weight: bold; font-size: 16px !important; margin-top: 8px; padding-top: 8px; }
            @media (max-width: 480px) { .message-item { flex-direction: column; align-items: flex-start; } .message-avatar { margin-bottom: 8px; } .message-sender { flex-direction: column; align-items: flex-start; } .message-time { margin-top: 2px; } }
            `;
            document.head.appendChild(style);
        }
        try {
          const response = await fetch(`${API_URL}/orders`);
          if (!response.ok) throw new Error('Failed to fetch orders from server');
          let orders = await response.json();
          orderContainer.innerHTML = '';
          if (!orders || orders.length === 0) {
            orderContainer.innerHTML = '<p style="text-align:center; color:gray; padding: 20px 0;">No orders yet.</p>';
            return; 
          }
          orders.forEach(order => {
            const item = document.createElement('div');
            item.classList.add('message-item');
            const avatar = (order.customerName || 'U').charAt(0).toUpperCase();
            const orderTotal = (order.totalAmount || 0).toFixed(2);
            const itemCount = (order.orderItems || []).length;
            const orderTime = order.formattedTime ? order.formattedTime : new Date(order.createdAt || Date.now()).toLocaleString();
            item.dataset.sender = order.customerName || 'Unknown';
            item.dataset.avatar = avatar;
            item.dataset.time = order.createdAt || Date.now();
            item.dataset.address = order.shippingAddress || 'N/A';
            item.dataset.phone = order.customerPhone || 'N/A';
            item.dataset.total = orderTotal;
            item.dataset.itemsJson = JSON.stringify(order.orderItems || []);
            item.dataset.id = order._id;
            const unreadMarker = !order.isRead ? `<span class="unread-dot">●</span>` : '';
            item.innerHTML = `<div class="message-avatar">${avatar}</div><div class="message-content"><div class="message-sender"><span>${escapeHtml(order.customerName || 'Unknown')}</span><span class="message-time">${orderTime} ${unreadMarker}</span></div><div class="message-preview">Order for ₹${orderTotal} (${itemCount} items)</div><div class="message-meta">📞 ${escapeHtml(order.customerPhone || 'N/A')}<br></div></div>`;
            item.addEventListener('click', async function () {
                const orderId = this.dataset.id;
                const orderItems = JSON.parse(this.dataset.itemsJson);
                
                // Store the current order ID in the message detail for deletion
                if (messageDetail) {
                    messageDetail.dataset.currentOrderId = orderId;
                }
                
                if (detailAvatar) detailAvatar.textContent = this.dataset.avatar;
                if (detailSender) detailSender.textContent = this.dataset.sender;
                if (detailBody) {
                    detailBody.innerHTML = `<p><strong>Phone:</strong> ${escapeHtml(this.dataset.phone)}</p><p><strong>Address:</strong> ${escapeHtml(this.dataset.address)}</p><div class="bill-items"><strong>Items:</strong><ul>${orderItems.map(it => `<li><span>${escapeHtml(it.name || 'Item')} x ${it.quantity}</span><span>₹${((it.price || 0) * (it.quantity || 0)).toFixed(2)}</span></li>`).join('')}<li class="bill-total-row"><span>Total</span><span>₹${this.dataset.total}</span></li></ul></div>`;
                }
                if (detailTime) detailTime.textContent = new Date(this.dataset.time).toLocaleString();
                if (messageList) messageList.style.display = 'none';
                if (messageDetail) messageDetail.classList.add('active');
                
                try {
                    await fetch(`${API_URL}/orders/${orderId}/read`, { method: 'PUT' });
                } catch (err) {
                    console.warn("Failed to mark as read:", err);
                }
                
                const dot = this.querySelector('.unread-dot');
                if (dot) dot.remove();
            });
            orderContainer.appendChild(item);
          });
        } catch (err) {
          console.error('Error loading orders:', err);
          orderContainer.innerHTML = '<p style="text-align:center; color:red; padding: 20px 0;">Failed to load orders.</p>';
        } finally {
          if (btn) btn.classList.remove('refreshing'); 
        }
    }

    async function deleteOrder(orderId) {
        showConfirmation('Are you sure you want to delete this order? This action cannot be undone.', async () => {
            try {
                const response = await fetch(`${API_URL}/orders/${orderId}`, { 
                    method: 'DELETE' 
                });
                
                if (!response.ok) throw new Error('Failed to delete order');
                
                showSnackbar('Order deleted successfully!');
                
                // Close the detail view and refresh the order list
                if (messageDetail) messageDetail.classList.remove('active');
                if (messageList) messageList.style.display = 'block';
                
                // Refresh the order list
                fetchAndRenderOrders();
                
            } catch (error) {
                console.error('Error deleting order:', error);
                showSnackbar('Error: Could not delete the order.', 'error');
            }
        });
    }

    async function uploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);
        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) throw new Error('Failed to upload image');
        const data = await response.json();
        return data.imageUrl;
    }

    //==================================================================
    // 3. Event Listener Management
    //==================================================================

    function attachAllEventListeners() {
        document.querySelectorAll('.qty-minus, .qty-plus').forEach(btn => btn.addEventListener('click', handleQuantityChange));
        document.querySelectorAll('.add').forEach(btn => btn.addEventListener('click', handleAddToCart));
        document.querySelectorAll('.buy').forEach(btn => btn.addEventListener('click', handleBuyNow));
        document.querySelectorAll('.add-item-btn').forEach(btn => btn.addEventListener('click', handleShowAddModal));
        document.querySelectorAll('.product-edit').forEach(btn => btn.addEventListener('click', handleEditName));
        document.querySelectorAll('.price-edit').forEach(btn => btn.addEventListener('click', handleEditPrice));
        document.querySelectorAll('.product-image-upload').forEach(btn => btn.addEventListener('click', handleShowImageModal));
        document.querySelectorAll('.product-delete').forEach(btn => btn.addEventListener('click', handleDeleteProduct));
        
        const addCategoryBtn = document.getElementById('addCategoryBtn');
        if (addCategoryBtn) addCategoryBtn.addEventListener('click', handleAddCategory);
        
        document.querySelectorAll('.category-edit').forEach(btn => btn.addEventListener('click', handleEditCategory));
        document.querySelectorAll('.category-delete').forEach(btn => btn.addEventListener('click', handleDeleteCategory));
    }

    // --- EVENT HANDLER FUNCTIONS (Updated for new UI) ---

    function handleEditName(e) {
        const card = e.target.closest('.product-card');
        if (!card) return;
        const h3 = card.querySelector('h3');
        const currentName = h3.textContent;
        createInlineEditor(h3, currentName, (newName) => {
            if (newName && newName.trim() && newName.trim() !== currentName) {
                updateProduct(card.dataset.id, { name: newName.trim() });
            }
        });
    }

    function handleEditPrice(e) {
        const card = e.target.closest('.product-card');
        if (!card) return;
        const priceEl = card.querySelector('.shop-price');
        const currentPrice = parseFloat(priceEl.textContent.replace('₹', '').trim()) || 0;
        createInlineEditor(priceEl, currentPrice, (newPriceStr) => {
            const newPrice = parseFloat(newPriceStr);
            if (newPriceStr && !isNaN(newPrice) && newPrice >= 0 && newPrice !== currentPrice) {
                updateProduct(card.dataset.id, { price: newPrice });
            }
        }, 'number');
    }
    
    function handleEditCategory(e) {
        const h2 = e.target.closest('.category-container')?.querySelector('.shop-category');
        if (!h2) return;
        const oldName = h2.textContent;
        createInlineEditor(h2, oldName, (newName) => {
            if (newName && newName.trim() && newName.trim() !== oldName) {
                updateCategory(oldName, newName.trim());
            }
        });
    }
    
    function handleAddCategory() {
        if(addCategoryModal) addCategoryModal.classList.add('active');
        const categoryNameInput = document.getElementById('categoryName');
        if (categoryNameInput) categoryNameInput.value = '';
    }

    function handleDeleteProduct(e) {
        const id = e.target.closest('.product-card')?.dataset.id;
        if (id) deleteProduct(id);
    }
    
    function handleDeleteCategory(e) {
        const name = e.target.closest('.category-container')?.querySelector('.shop-category')?.textContent;
        if (name) deleteCategory(name);
    }
    
    // Original handlers that don't need changing
    function handleQuantityChange(e) {
        const input = e.target.parentElement.querySelector('input');
        if (!input) return;
        let value = parseInt(input.value, 10) || 1;
        if (e.target.classList.contains('qty-plus')) input.value = value + 1;
        else if (value > 1) input.value = value - 1;
    }

    function handleAddToCart(e) {
        const card = e.target.closest('.product-card');
        if (!card) return;
        const id = card.dataset.id || (Math.random() + '');
        const name = e.target.dataset.name || card.querySelector('h3')?.textContent || 'Item';
        const price = parseFloat(e.target.dataset.price) || 0;
        const qty = parseInt(card.querySelector('input')?.value, 10) || 1;
        addToCart(id, name, price, qty);
        if (!cartMenu.classList.contains('active')) toggleCart();
    }

    function handleBuyNow(e) {
        showSnackbar(`Proceeding to checkout for: ${e.target.closest('.product-card').querySelector('h3').textContent}`);
    }

    function handleShowAddModal(e) {
        currentCategoryForAdd = e.target.closest('.category-container')?.querySelector('.shop-category')?.textContent || '';
        document.getElementById('productName').value = '';
        document.getElementById('productPrice').value = '';
        document.getElementById('productImage').value = '';
        if (addImagePreview) addImagePreview.innerHTML = '<span>Image Preview</span>';
        if (addProductModal) addProductModal.classList.add('active');
    }

    function handleShowImageModal(e) {
        currentProductCard = e.target.closest('.product-card');
        document.getElementById('imageUpload').value = '';
        document.getElementById('imageUrl').value = '';
        if (uploadImagePreview) uploadImagePreview.innerHTML = '<span>Image Preview</span>';
        if (imageUploadModal) imageUploadModal.classList.add('active');
    }
    
    //==================================================================
    // 4. Modal and Image Handling Logic
    //==================================================================

    if (saveCategoryBtn) {
        saveCategoryBtn.addEventListener('click', () => {
            const newCategoryName = document.getElementById('categoryName')?.value;
             if (newCategoryName && newCategoryName.trim()) {
                const placeholderProduct = {
                    name: "New Item", price: 0.00, category: newCategoryName.trim(), imageUrl: null
                };
                createProduct(placeholderProduct);
            } else {
                showSnackbar('Please enter a category name.', 'error');
            }
        });
    }
    if (closeAddCategoryModal) closeAddCategoryModal.addEventListener('click', () => addCategoryModal.classList.remove('active'));
    if (cancelAddCategory) cancelAddCategory.addEventListener('click', () => addCategoryModal.classList.remove('active'));

    if (saveProduct) {
        saveProduct.addEventListener('click', async () => {
            try {
                const name = document.getElementById('productName')?.value;
                const price = document.getElementById('productPrice')?.value;
                if (!name || !price || !currentCategoryForAdd) {
                    return showSnackbar('Please fill in all fields.', 'error');
                }
                let imageUrl = null;
                if (productImageInput?.files[0]) {
                    imageUrl = await uploadImage(productImageInput.files[0]);
                }
                createProduct({ name: name.trim(), price: parseFloat(price), category: currentCategoryForAdd, imageUrl });
            } catch (err) {
                console.error('Error saving product:', err);
                showSnackbar('Failed to save product.', 'error');
            }
        });
    }

    if (saveImage) {
        saveImage.addEventListener('click', async () => {
            try {
                if (!currentProductCard) return;
                let imageUrl = null;
                if (imageUploadInput?.files[0]) {
                    imageUrl = await uploadImage(imageUploadInput.files[0]);
                } else if (imageUrlInput?.value.trim()) {
                    imageUrl = imageUrlInput.value.trim();
                }
                if (!imageUrl) return showSnackbar('Please select an image or provide a URL.', 'error');
                updateProduct(currentProductCard.dataset.id, { imageUrl });
            } catch (err) {
                console.error('Error saving image:', err);
                showSnackbar('Failed to save image.', 'error');
            }
        });
    }

    //==================================================================
    // 5. Delete Order Event Listener
    //==================================================================

    if (messageDeleteBtn) {
        messageDeleteBtn.addEventListener('click', function() {
            const currentOrderId = messageDetail.dataset.currentOrderId;
            if (currentOrderId) {
                deleteOrder(currentOrderId);
            } else {
                showSnackbar('No order selected to delete.', 'error');
            }
        });
    }

    //==================================================================
    // 6. Original Frontend Logic (Unaltered)
    //==================================================================

    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            if (document.getElementById('password')?.value === '123') {
                if (loginPage) loginPage.style.display = 'none';
                if (mainPage) mainPage.style.display = 'flex';
                fetchAndRenderOrders();
            } else {
                if (errorMessage) errorMessage.style.display = 'block';
                loginForm.style.animation = 'shake 0.5s';
                setTimeout(() => { loginForm.style.animation = ''; }, 500);
            }
        });
    }

    if (refreshOrdersBtn) {
        refreshOrdersBtn.addEventListener('click', fetchAndRenderOrders);
    }

    navButtons.forEach(button => {
        button.addEventListener('click', function () {
            const slideId = this.dataset.slide;
            navButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            contentSlides.forEach(slide => {
                slide.classList.remove('active');
                if (slide.id === slideId) {
                    slide.classList.add('active');
                }
            });
            if (slideId === 'edit-slide' && !document.querySelector('.product-card')) {
                fetchAndRenderProducts();
            }
            if (slideId === 'message-slide') {
                fetchAndRenderOrders();
            }
        });
    });

    const toggleMenu = () => { if (mobileMenu) mobileMenu.classList.toggle('active'); if (overlay) overlay.classList.toggle('active'); };
    const toggleCart = () => { if (cartMenu) cartMenu.classList.toggle('active'); if (overlay) overlay.classList.toggle('active'); };

    if (overlay) overlay.addEventListener('click', () => {
        if (mobileMenu) mobileMenu.classList.remove('active');
        if (cartMenu) cartMenu.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
    });

    if (menuToggle) menuToggle.addEventListener('click', toggleMenu);
    if (cartToggle) cartToggle.addEventListener('click', toggleCart);
    if (closeMenu) closeMenu.addEventListener('click', toggleMenu);
    if (closeCart) closeCart.addEventListener('click', toggleCart);
    if (closeAddProductModal) closeAddProductModal.addEventListener('click', () => addProductModal.classList.remove('active'));
    if (cancelAddProduct) cancelAddProduct.addEventListener('click', () => addProductModal.classList.remove('active'));
    if (closeImageModal) closeImageModal.addEventListener('click', () => imageUploadModal.classList.remove('active'));
    if (cancelImageUpload) cancelImageUpload.addEventListener('click', () => imageUploadModal.classList.remove('active'));

    function addToCart(id, name, price, quantity) {
        const existingItem = cart.find(item => item.id === id);
        if (existingItem) existingItem.quantity += quantity;
        else cart.push({ id, name, price, quantity });
        updateCartDisplay();
    }

    function removeFromCart(id) { cart = cart.filter(item => item.id !== id); updateCartDisplay(); }

    function updateCartQuantity(id, change) {
        const item = cart.find(item => item.id === id);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) removeFromCart(id);
            else updateCartDisplay();
        }
    }

    function updateCartDisplay() {
        if (!cartItems || !cartTotal) return;
        cartItems.innerHTML = '';
        if (cart.length === 0) {
            cartItems.innerHTML = '<p class="empty-cart-msg">Your cart is empty</p>';
            cartTotal.textContent = '0.00';
            return;
        }
        let total = 0;
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            const cartItem = document.createElement('div');
            cartItem.classList.add('cart-item');
            cartItem.innerHTML = `<div class="cart-item-info"><div class="cart-item-name">${escapeHtml(item.name)}</div><div class="cart-item-price">₹${item.price.toFixed(2)} x ${item.quantity} = ₹${itemTotal.toFixed(2)}</div></div><div class="cart-item-quantity"><button class="cart-item-minus" data-id="${item.id}">-</button> <span>${item.quantity}</span> <button class="cart-item-plus" data-id="${item.id}">+</button></div><button class="cart-item-remove" data-id="${item.id}">×</button>`;
            cartItems.appendChild(cartItem);
        });
        cartTotal.textContent = total.toFixed(2);
        document.querySelectorAll('.cart-item-minus').forEach(b => b.addEventListener('click', e => updateCartQuantity(e.target.dataset.id, -1)));
        document.querySelectorAll('.cart-item-plus').forEach(b => b.addEventListener('click', e => updateCartQuantity(e.target.dataset.id, 1)));
        document.querySelectorAll('.cart-item-remove').forEach(b => b.addEventListener('click', e => removeFromCart(e.target.dataset.id)));
    }

    updateCartDisplay();

    if (messageBack) {
        messageBack.addEventListener('click', function () {
            if (messageDetail) messageDetail.classList.remove('active');
            if (messageList) messageList.style.display = 'block';
        });
    }

    const style = document.createElement('style');
    style.textContent = `@keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); } 20%, 40%, 60%, 80% { transform: translateX(10px); } }`;
    document.head.appendChild(style);

    function escapeHtml(str) {
        if (typeof str !== 'string') return str;
        return str.replace(/[&<>"']/g, function (m) {
            switch (m) {
                case '&': return '&amp;';
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '"': return '&quot;';
                case "'": return '&#39;';
                default: return m;
            }
        });
    }

    // Initial data fetch
    fetchAndRenderOrders();
});
