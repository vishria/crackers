document.addEventListener('DOMContentLoaded', async function () {
  const productContainer = document.getElementById('productContainer');
  const overlay = document.getElementById('overlay');
  const cartMenu = document.getElementById('cartMenu');
  const cartItems = document.getElementById('cartItems');
  const cartTotal = document.getElementById('cartTotal');
  const cartCount = document.querySelector('.cart-count');
  const checkoutPage = document.getElementById('checkoutPage');
  const checkoutItems = document.getElementById('checkoutItems');
  const checkoutTotal = document.getElementById('checkoutTotal');
  const shippingForm = document.getElementById('shippingForm');
  const backToShopping = document.getElementById('backToShopping');
  const searchToggle = document.getElementById('searchToggle');

  let total = 0;
  let itemCount = 0;
  let allCategoriesData = [];

  // ==================================================
  // FETCH PRODUCTS FROM BACKEND
  // ==================================================
  async function loadProducts() {
    try {
      const res = await fetch('https://krishnapattas.onrender.com/api/products');
      console.log('Fetch status:', res.status);
      const data = await res.json();
      console.log('Products data:', data);

      // Store categories for search functionality
      allCategoriesData = Object.keys(data);
      console.log('Categories extracted:', allCategoriesData);

      productContainer.innerHTML = '';

      for (const category in data) {
        const categoryProducts = data[category];

        const categoryTitle = document.createElement('h2');
        categoryTitle.classList.add('category');
        categoryTitle.textContent = category;
        productContainer.appendChild(categoryTitle);

        const productList = document.createElement('div');
        productList.classList.add('product-list');

        categoryProducts.forEach(product => {
          const productCard = document.createElement('div');
          productCard.classList.add('product-card');

          productCard.innerHTML = `
          <div class="product-image">
            <img src="${product.imageUrl || 'https://via.placeholder.com/300x300'}" alt="${product.name}">
          </div>
          <div class="product-info">
            <h3>${product.name}</h3>
            <p class="price">₹${product.price.toFixed(2)}</p>
            <div class="quantity-container">
              <div class="quantity">
                <button class="qty-minus">-</button>
                <input type="number" value="1" min="1">
                <button class="qty-plus">+</button>
              </div>
              <button class="add" data-id="${product._id}" data-name="${product.name}" data-price="${product.price}">Add to Cart</button>
            </div>
          </div>
        `;

          productList.appendChild(productCard);
        });

        productContainer.appendChild(productList);
      }

      attachCartLogic(); // re-attach after rendering
      
      // Initialize search after products are loaded
      setTimeout(initializeSearch, 100);
      // Initialize navigation arrows
      setTimeout(initializeNavigationArrows, 100);
    } catch (err) {
      console.error('Error fetching products:', err);
      productContainer.innerHTML = '<p>⚠️ Failed to load products.</p>';
    }
  }

  // ==================================================
  // SEARCH FUNCTIONALITY
  // ==================================================
  function initializeSearch() {
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.innerHTML = `
      <div class="search-bar">
        <input type="text" id="searchInput" placeholder="Search categories...">
      </div>
      <div class="search-results" id="searchResults"></div>
    `;
    
    // Insert search container in the header, not after header
    document.querySelector('header').appendChild(searchContainer);
    
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    
    let categories = [];
    let currentCategories = [];

    // Function to get categories from the loaded products data
    function getCategoriesFromDOM() {
      const categoryElements = document.querySelectorAll('.category');
      const categories = Array.from(categoryElements).map(cat => ({
        name: cat.textContent.trim(),
        element: cat
      }));
      
      console.log('Categories found in DOM:', categories);
      
      return categories;
    }

    // Function to filter categories based on search input
    function filterCategories(searchTerm) {
      return categories.filter(category => 
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Function to display search results
    function displayResults(results) {
      searchResults.innerHTML = '';
      
      if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item">No categories found</div>';
      } else {
        results.forEach((result, index) => {
          const resultItem = document.createElement('div');
          resultItem.className = 'search-result-item';
          resultItem.textContent = result.name;
          resultItem.addEventListener('click', () => {
            navigateToCategory(result);
            closeSearch();
          });
          searchResults.appendChild(resultItem);
        });
      }
      
      searchResults.classList.add('active');
    }

    // Function to show all available categories
    function showAllCategories() {
      categories = getCategoriesFromDOM();
      console.log('Showing categories:', categories);
      
      if (categories.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item">No categories available yet</div>';
        searchResults.classList.add('active');
      } else {
        displayResults(categories);
      }
    }

    // Function to navigate to a category
    function navigateToCategory(category) {
      let categoryElement = category.element;
      
      if (categoryElement) {
        // Scroll to the category
        const yOffset = -80;
        const y = categoryElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
        
        window.scrollTo({
          top: y,
          behavior: 'smooth'
        });
        
        // Add highlight effect
        categoryElement.style.transition = 'all 0.3s ease';
        categoryElement.style.color = 'var(--primary-color)';
        categoryElement.style.backgroundColor = 'rgba(255, 111, 0, 0.1)';
        categoryElement.style.padding = '0.5rem';
        categoryElement.style.borderRadius = '5px';
        
        setTimeout(() => {
          categoryElement.style.color = '';
          categoryElement.style.backgroundColor = '';
          categoryElement.style.padding = '';
          categoryElement.style.borderRadius = '';
        }, 2000);
      }
    }

    function openSearch() {
      console.log('Opening search...');
      searchContainer.classList.add('active');
      searchInput.focus();
      showAllCategories();
    }

    function closeSearch() {
      searchContainer.classList.remove('active');
      searchInput.value = '';
      searchResults.classList.remove('active');
    }

    // Event listeners for search functionality
    searchToggle.addEventListener('click', function(e) {
      e.stopPropagation(); // Prevent event bubbling
      openSearch();
    });

    // Real-time search when typing
    searchInput.addEventListener('input', function() {
      const searchTerm = this.value.trim();
      
      if (searchTerm.length === 0) {
        showAllCategories();
        return;
      }
      
      categories = getCategoriesFromDOM();
      currentCategories = filterCategories(searchTerm);
      displayResults(currentCategories);
    });

    // Close search when clicking outside
    document.addEventListener('click', function(event) {
      if (!searchContainer.contains(event.target) && event.target !== searchToggle) {
        closeSearch();
      }
    });

    // Handle keyboard navigation
    searchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeSearch();
      }
      
      if (e.key === 'Enter') {
        e.preventDefault();
        const searchTerm = this.value.trim();
        categories = getCategoriesFromDOM();
        
        if (searchTerm.length > 0) {
          currentCategories = filterCategories(searchTerm);
          if (currentCategories.length > 0) {
            navigateToCategory(currentCategories[0]);
            closeSearch();
          }
        } else {
          if (categories.length > 0) {
            navigateToCategory(categories[0]);
            closeSearch();
          }
        }
      }
    });

    console.log('Search functionality initialized');
  }

  // ==================================================
  // NAVIGATION ARROWS FUNCTIONALITY
  // ==================================================
  function initializeNavigationArrows() {
    const upArrow = document.getElementById('upArrow');
    const downArrow = document.getElementById('downArrow');

    upArrow.addEventListener('click', function() {
      // Scroll to first product
      const firstProduct = document.querySelector('.product-card');
      if (firstProduct) {
        const yOffset = -80;
        const y = firstProduct.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    downArrow.addEventListener('click', function() {
      // Scroll to last product or footer
      const footer = document.querySelector('footer');
      if (footer) {
        const y = footer.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    });
  }

  // ==================================================
  // CART & CHECKOUT LOGIC
  // ==================================================
  function attachCartLogic() {
    // Quantity controls
    document.querySelectorAll('.qty-minus').forEach(button => {
      button.addEventListener('click', function () {
        const input = this.nextElementSibling;
        if (parseInt(input.value) > 1) {
          input.value = parseInt(input.value) - 1;
        }
      });
    });

    document.querySelectorAll('.qty-plus').forEach(button => {
      button.addEventListener('click', function () {
        const input = this.previousElementSibling;
        input.value = parseInt(input.value) + 1;
      });
    });

    // Add to Cart
    document.querySelectorAll('.add').forEach(button => {
      button.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        const name = this.getAttribute('data-name');
        const price = parseFloat(this.getAttribute('data-price'));
        const quantity = parseInt(this.closest('.product-info').querySelector('input').value);

        // Remove empty message
        const emptyMsg = document.querySelector('.empty-cart-msg');
        if (emptyMsg) emptyMsg.remove();

        // Check if already in cart
        const existingItem = document.querySelector(`.cart-item[data-id="${id}"]`);
        if (existingItem) {
          const existingQty = parseInt(existingItem.getAttribute('data-quantity'));
          const newQty = existingQty + quantity;
          existingItem.setAttribute('data-quantity', newQty);
          existingItem.querySelector('.item-quantity').textContent = newQty;
          existingItem.querySelector('.item-price').textContent = `₹${(price * newQty).toFixed(2)}`;
        } else {
          const cartItem = document.createElement('div');
          cartItem.classList.add('cart-item');
          cartItem.setAttribute('data-id', id);
          cartItem.setAttribute('data-quantity', quantity);
          cartItem.setAttribute('data-price', price);
          cartItem.setAttribute('data-name', name);

          cartItem.innerHTML = `
            <div class="cart-item-info">
              <p>${name}</p>
              <p>₹${price.toFixed(2)} × <span class="item-quantity">${quantity}</span> = 
              <span class="item-price">₹${(price * quantity).toFixed(2)}</span></p>
            </div>
            <button class="remove-item">×</button>
          `;

          cartItems.appendChild(cartItem);

          // Remove item handler
          cartItem.querySelector('.remove-item').addEventListener('click', function () {
            const itemTotal = parseFloat(cartItem.querySelector('.item-price').textContent.replace('₹', ''));
            total -= itemTotal;
            itemCount -= parseInt(cartItem.getAttribute('data-quantity'));

            cartTotal.textContent = `₹${total.toFixed(2)}`;
            cartCount.textContent = itemCount;

            cartItem.remove();

            if (cartItems.children.length === 0) {
              cartItems.innerHTML = '<p class="empty-cart-msg">Your cart is empty</p>';
            }
          });
        }

        // Update totals
        total += price * quantity;
        itemCount += quantity;
        cartTotal.textContent = `₹${total.toFixed(2)}`;
        cartCount.textContent = itemCount;

        cartMenu.classList.add('active');
        overlay.style.display = 'block';
      });
    });

    // Checkout
    const checkoutBtn = document.querySelector('.checkout-btn');
    checkoutBtn.addEventListener('click', function () {
      if (total > 0) {
        checkoutItems.innerHTML = '';
        document.querySelectorAll('.cart-item').forEach(item => {
          const name = item.getAttribute('data-name');
          const price = parseFloat(item.getAttribute('data-price'));
          const quantity = parseInt(item.getAttribute('data-quantity'));

          const checkoutItem = document.createElement('div');
          checkoutItem.classList.add('checkout-item');
          checkoutItem.innerHTML = `
            <div class="checkout-item-info">
              <div class="checkout-item-name">${name}</div>
              <div class="checkout-item-price">₹${price.toFixed(2)} × ${quantity}</div>
            </div>
            <div>₹${(price * quantity).toFixed(2)}</div>
          `;
          checkoutItems.appendChild(checkoutItem);
        });

        checkoutTotal.textContent = `₹${total.toFixed(2)}`;
        checkoutPage.style.display = 'block';
        cartMenu.classList.remove('active');
        overlay.style.display = 'none';
      } else {
        alert('Your cart is empty!');
      }
    });
  }

  // ==================================================
  // ORDER SUBMISSION
  // ==================================================
  shippingForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const orderItems = [];
    document.querySelectorAll('.cart-item').forEach(item => {
      orderItems.push({
        product: item.getAttribute('data-id'),  // matches backend schema
        name: item.getAttribute('data-name'),
        price: parseFloat(item.getAttribute('data-price')),
        quantity: parseInt(item.getAttribute('data-quantity'))
      });
    });

    const orderData = {
      customerName: document.getElementById('fullName').value,
      customerPhone: document.getElementById('phone').value,
      shippingAddress:
        document.getElementById('address').value + ', ' +
        document.getElementById('city').value + ', ' +
        document.getElementById('state').value + ', ' +
        document.getElementById('zipCode').value + ', ' +
        document.getElementById('country').value,
      orderItems: orderItems,
      totalAmount: total
    };

    try {
      const res = await fetch('https://krishnapattas.onrender.com/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!res.ok) throw new Error('Failed to place order');
      const savedOrder = await res.json();

      alert(`✅ Thank you ${savedOrder.customerName}! Order #${savedOrder._id} placed successfully.`);

      // Reset cart
      cartItems.innerHTML = '<p class="empty-cart-msg">Your cart is empty</p>';
      total = 0;
      itemCount = 0;
      cartTotal.textContent = '₹0.00';
      cartCount.textContent = '0';
      checkoutPage.style.display = 'none';
    } catch (error) {
      console.error('Order failed:', error);
      alert('❌ Failed to place order. Please try again.');
    }
  });

  // ==================================================
  // UI CONTROLS
  // ==================================================
  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('mobileMenu').classList.add('active');
    overlay.style.display = 'block';
  });

  document.getElementById('closeMenu').addEventListener('click', () => {
    document.getElementById('mobileMenu').classList.remove('active');
    overlay.style.display = 'none';
  });

  document.getElementById('cartToggle').addEventListener('click', () => {
    cartMenu.classList.add('active');
    overlay.style.display = 'block';
  });

  document.getElementById('closeCart').addEventListener('click', () => {
    cartMenu.classList.remove('active');
    overlay.style.display = 'none';
  });

  overlay.addEventListener('click', () => {
    document.getElementById('mobileMenu').classList.remove('active');
    cartMenu.classList.remove('active');
    overlay.style.display = 'none';
  });

  backToShopping.addEventListener('click', function (e) {
    e.preventDefault();
    checkoutPage.style.display = 'none';
  });

  // ==================================================
  // INIT
  // ==================================================
  loadProducts();
});
