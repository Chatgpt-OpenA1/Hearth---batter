let cart = [];
try {
    const savedCart = localStorage.getItem('hearth_batter_cart');
    if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
      cart = parsed.filter(item => item.id && item.name && item.price);
    }
  }
} catch (e) {
  console.error('Corrupted cart data:', e);
  localStorage.removeItem('hearth_batter_cart');
}
let isCartOpen = false;

function showNotification(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.position = 'fixed';
  notification.style.bottom = '20px';
  notification.style.right = '20px';
  notification.style.background = 'var(--accent)';
  notification.style.color = 'white';
  notification.style.padding = '10px 20px';
  notification.style.borderRadius = '5px';
  notification.style.zIndex = '1000';
  document.body.appendChild(notification);

  setTimeout(() => {
    document.body.removeChild(notification);
  }, 2000);
}

function toggleCart() {
  const cartSidebar = document.getElementById('cart-sidebar');
  cartSidebar.classList.toggle('show');
}

function addToCart(productId, productName, price, type) {
  if (!productName || isNaN(parseFloat(price))) {
    console.error('Invalid product data:', { productId, productName, price, variant, type });
    return;
  }
  
  try {
    const uniqueId = `${productId}-${type}`;
    const existingItem = cart.find(item => item.uniqueId === uniqueId);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        uniqueId: uniqueId,
        id: productId,
        name: productName,
        price: parseFloat(price),
        type: type, 
        quantity: 1
      });
    }

    const cartCount = document.getElementById('cart-count');
    const cartCountBubble = document.getElementById('cart-count-bubble');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (cartCount) cartCount.textContent = totalItems;
    if (cartCountBubble) {
      cartCountBubble.textContent = totalItems;
      cartCountBubble.style.display = totalItems > 0 ? 'flex' : 'none';
    }

    try {
      localStorage.setItem('hearth_batter_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
    
    showNotification(`${productName} (${type}) added to cart!`);
    renderCart();
  } catch (error) {
    console.error('Error adding to cart:', error);
  }
}

function updateQuantity(uniqueId, change) {
  try {
    const item = cart.find(i => i.uniqueId === uniqueId);
    if (item) {
      item.quantity += change;
      if (item.quantity < 1) {
        cart = cart.filter(i => i.uniqueId !== uniqueId);
      }
      
      try {
        localStorage.setItem('hearth_batter_cart', JSON.stringify(cart));
      } catch (e) {
        console.error('Failed to save cart to localStorage:', e);
      }
      
      updateCartCount();
      renderCart();
    }
  } catch (error) {
    console.error('Error updating quantity:', error);
  }
}

function removeFromCart(uniqueId) {
  try {
    cart = cart.filter(i => i.uniqueId !== uniqueId);
    
    try {
      localStorage.setItem('hearth_batter_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
    
    updateCartCount();
    renderCart();
  } catch (error) {
    console.error('Error removing from cart:', error);
  }
}

function updateCartCount() {
  try {
    const cartCount = document.getElementById('cart-count');
    const cartCountBubble = document.getElementById('cart-count-bubble');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (cartCount) cartCount.textContent = totalItems;
    if (cartCountBubble) {
      cartCountBubble.textContent = totalItems;
      cartCountBubble.style.display = totalItems > 0 ? 'flex' : 'none';
    }
  } catch (error) {
    console.error('Error updating cart count:', error);
  }
}

function renderCart() {
  try {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    if (!cartItems || !cartTotal) return;

    cartItems.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
      cartItems.innerHTML = '<p>Your cart is empty</p>';
    } else {
      cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.setAttribute('aria-label', `${item.name}, ${item.quantity} items at ₹${item.price} each`);
        
        div.innerHTML = `
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="https://raw.githubusercontent.com/Sudo-gaurav/Hearth-And-Batter-Website/main/Assets/images/Hearth-and-Batter.png" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">
            <div>
              <h4>${item.name} (${item.type})</h4>
              <div>
                <button onclick="updateQuantity('${item.uniqueId}', -1)">-</button>
                <span>${item.quantity}</span>
                <button onclick="updateQuantity('${item.uniqueId}', 1)">+</button>
                <button onclick="removeFromCart('${item.uniqueId}')">×</button>
              </div>
            </div>
          </div>
        `;

        cartItems.appendChild(div);
      });
    }

    cartTotal.textContent = total.toFixed(2);
  } catch (error) {
    console.error('Error rendering cart:', error);
  }
}

function checkout() {
    console.log('Checkout clicked');
        
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
  
    const checkoutForm = createCheckoutForm();
    const form = checkoutForm.querySelector('#order-form');

    if (!checkoutForm || !form) {
        console.error('Checkout form elements not found:', {
            checkoutForm: !!checkoutForm,
            form: !!form
        });
        return;
    }

    try {
        const orderId = `ORD${String(Date.now()).padStart(10, '0')}`;
        const customerId = `CUST-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        form.querySelector('#orderId').value = orderId;
        form.querySelector('#customerId').value = customerId;
        form.querySelector('#orderDate').value = new Date().toISOString();
        form.querySelector('#orderTotal').value = total;
        form.querySelector('#cart').value = JSON.stringify({
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            type: item.type,
            quantity: item.quantity
          })),
           total: total
          });         
    
        checkoutForm.classList.add('show');
        form.onsubmit = handleOrderSubmit;
        
        const cartSidebar = document.getElementById('cart-sidebar');
        if (cartSidebar && cartSidebar.classList.contains('show')) {
            cartSidebar.classList.remove('show');
        }
        
        console.log('Checkout form displayed');
    } catch (error) {
        console.error('Error in checkout:', error);
    }
}

function handleOrderSubmit(e) {
    e.preventDefault();
    const form = document.getElementById('order-form');
    const submitButton = form.querySelector('button[type="submit"]');
    
    try {
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Processing...';
        }

        const formData = new FormData(form);
        const cartData = JSON.parse(formData.get('cart'));
      
        const successOverlay = document.createElement('div');
        successOverlay.className = 'success-overlay';
        successOverlay.innerHTML = `
            <div class="success-content" style="
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                text-align: center;
                max-width: 400px;
            ">
                <h3>Processing Order...</h3>
                <p>Please wait while we submit your order...</p>
            </div>
        `;
        Object.assign(successOverlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '1000'
        });
        document.body.appendChild(successOverlay);

        fetch(form.action, {
            method: 'POST',
            mode: 'no-cors',
            body: formData,
        })
        .then(response => {
            console.log('Order submitted successfully');
        })
        .catch(error => {
            console.error('Error submitting order:', error);
            throw error; 
        });
        
        setTimeout(() => {
            cart = [];
            localStorage.removeItem('hearth_batter_cart');
            updateCartCount();
            renderCart();
        }, 1000);
        
        toggleCheckout(false);
        
        const successContent = successOverlay.querySelector('.success-content');
        if (successContent) {
            successContent.innerHTML = `
                <h3 style="color: #4caf50; margin-bottom: 15px;">Order Placed Successfully! 🎉</h3>
                <p style="margin-bottom: 10px;">Thank you for shopping with Hearth & Batter.</p>
                <p style="margin-bottom: 20px;">You will receive a confirmation email shortly.</p>
                <button onclick="this.closest('.success-overlay').remove()" 
                        style="background: #4caf50; color: white; border: none; padding: 8px 16px; 
                               border-radius: 4px; cursor: pointer;">Close</button>
            `;
        }
        
        setTimeout(() => {
            if (document.body.contains(successOverlay)) {
                successOverlay.remove();
            }
        }, 7000);
    } catch (error) {
        console.error('Order submission failed:', error);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'order-error-message';
        errorDiv.innerHTML = `
            <div style="background-color: #ffebee; color: #c62828; padding: 15px; border-radius: 4px; 
                        margin-top: 10px; text-align: center; border: 1px solid #ffcdd2;">
                <p style="margin: 0;">Failed to submit order. Please try again.</p>
                <p style="margin: 5px 0 0 0; font-size: 0.9em;">${error.message || ''}</p>
            </div>
        `;
        form.appendChild(errorDiv);
        
        setTimeout(() => {
            if (form.contains(errorDiv)) {
                errorDiv.remove();
            }
        }, 5000);
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Place Order';
        }
    }
}

function toggleCheckout(show = true) {
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.classList.toggle('show', show);
    }
}

function handleOrderSuccess() {
    cart = [];
    localStorage.removeItem('hearth_batter_cart');
    
    updateCartCount();
    renderCart();
    toggleCheckout(false);
    
    const successMessage = document.createElement('div');
    successMessage.className = 'order-success-message';
    successMessage.innerHTML = `
        <div class="success-content">
            <h3>Order Placed Successfully! 🎉</h3>
            <p>Thank you for shopping with Hearth & Batter.</p>
            <p>You will receive a confirmation email shortly.</p>
        </div>
    `;
    document.body.appendChild(successMessage);
    
    setTimeout(() => {
        successMessage.remove();
    }, 3000);
}

function setupMobileMenu() {
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', function() {
      this.classList.toggle('active');
      navLinks.classList.toggle('active');
      
      const spans = this.querySelectorAll('.hamburger-line');
      if (this.classList.contains('active')) {
        spans[0].style.transform = 'rotate(45deg) translate(8px, 6px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(8px, -6px)';
      } else {
        spans[0].style.transform = '';
        spans[1].style.opacity = '1';
        spans[2].style.transform = '';
      }
    });
  }
}

function setupCategoryLinks() {
  const categoryLinks = document.querySelectorAll('.category-link');
  if (categoryLinks.length > 0) {
    categoryLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          window.scrollTo({
            top: targetElement.offsetTop - 80, 
            behavior: 'smooth'
          });
          
          categoryLinks.forEach(link => link.classList.remove('active'));
          this.classList.add('active');
          
          const navLinks = document.querySelector('.nav-links');
          const menuToggle = document.querySelector('.mobile-menu-toggle');
          if (navLinks && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            if (menuToggle) {
              menuToggle.classList.remove('active');
              const spans = menuToggle.querySelectorAll('.hamburger-line');
              spans[0].style.transform = '';
              spans[1].style.opacity = '1';
              spans[2].style.transform = '';
            }
          }
        }
      });
    });
  }
}

function filterProducts() {
  
  if (typeof window.filterProducts === 'function') {
    window.filterProducts();
  } else {
    try {
      const activeFilter = document.querySelector('.filter-btn.active');
      const searchInput = document.getElementById('productSearch');
      
      if (!activeFilter) return;
      
      const filterValue = activeFilter.dataset.filter;
      const searchValue = searchInput ? searchInput.value.toLowerCase() : '';
      
      const products = document.querySelectorAll('.product');
      
      products.forEach(product => {
        const tags = (product.dataset.tags || '').toLowerCase();
        const productName = product.querySelector('h2').textContent.toLowerCase();
        const productDesc = product.querySelector('p').textContent.toLowerCase();
        
        const matchesTag = filterValue === 'all' || tags.includes(filterValue);
        const matchesSearch = !searchValue || 
                             productName.includes(searchValue) || 
                             productDesc.includes(searchValue);
        
        if (matchesTag && matchesSearch) {
          product.style.display = 'block';
        } else {
          product.style.display = 'none';
        }
      });
    } catch (error) {
      console.error('Error filtering products:', error);
    }
  }
}

function initializeCartAndProducts() {
    try {
        setupMobileMenu();
        setupCartEventListeners(); 
        
        try {
            const savedCart = localStorage.getItem('hearth_batter_cart');
            if (savedCart) {
                cart = JSON.parse(savedCart);
            }
        } catch (e) {
            console.error('Failed to load cart from localStorage:', e);
            cart = [];
        }
        
        updateCartCount();
        renderCart();

        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                filterProducts();
            });
        });

        const productSearch = document.getElementById('productSearch');
        if (productSearch) {
            productSearch.addEventListener('input', filterProducts);
        }

        const allFilterBtn = document.querySelector('.filter-btn[data-filter="all"]');
        if (allFilterBtn) {
            allFilterBtn.classList.add('active');
        }

        setupCategoryLinks();
    } catch (error) {
        console.error('Error initializing cart and products:', error);
    }
}

function setupCartEventListeners() {
    console.log('Setting up cart event listeners');
    
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            console.log('Checkout button clicked');
            checkout();
        });
    }

    const cancelBtn = document.querySelector('.checkout-cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            console.log('Cancel button clicked');
            toggleCheckout(false);
        });
    }

    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('click', function(e) {
            if (e.target === this) {
                toggleCheckout(false);
            }
        });
    }

    document.addEventListener('click', function(event) {
        const button = event.target.closest('.btn[onclick*="addToCart"]');
        if (button) {
            event.preventDefault();
            const onclick = button.getAttribute('onclick');
            const match = onclick.match(/addToCart\('([^']+)',\s*'([^']+)',\s*(\d+),\s*'([^']+)'\)/);
            if (match) {
                const [_, productId, productName, price, type] = match;
                addToCart(productId, productName, parseInt(price), type);
            }
        }
    });
}

function createCheckoutForm() {
    let checkoutForm = document.getElementById('checkout-form');
    if (!checkoutForm) {
        checkoutForm = document.createElement('div');
        checkoutForm.id = 'checkout-form';
        checkoutForm.innerHTML = `
            <div class="checkout-box">
                <h2>Checkout</h2>
                <form id="order-form" action="https://script.google.com/macros/s/AKfycbz55m0tpcmJ8DMhhEWoGdirKss0OOh4N2ERehA8zUdrXvLc3nQZIjqCcIHJrz7D_RSP/exec" method="POST" target="hidden-iframe">
                    <input type="hidden" name="Order ID" id="orderId">
                    <input type="hidden" name="Date" id="orderDate">
                    <input type="hidden" name="Customer ID" id="customerId">
                    <input type="hidden" name="cart" id="cart">
                    <input type="hidden" name="Total Amount" id="orderTotal">
                    <input type="hidden" name="Order Status" value="Pending">
                    <input type="hidden" name="Delivery Date" value="">

                    <label for="customerName">Name</label>
                    <input type="text" id="customerName" name="Customer Name" required>

                    <label for="email">Email</label>
                    <input type="email" id="email" name="Email" required>

                    <label for="phone">Phone</label>
                    <input type="tel" id="phone" name="Phone" required>

                    <label for="address">Address</label>
                    <textarea id="address" name="Address" rows="3" required></textarea>

                    <label for="payment">Payment Method</label>
                    <select id="payment" name="Payment Method" required>
                        <option value="COD">Cash on Delivery</option>
                        <option value="UPI">UPI</option>
                    </select>

                    <label for="notes">Additional Notes</label>
                    <textarea id="notes" name="Notes" rows="2"></textarea>

                    <div class="checkout-buttons">
                        <button type="submit" class="btn">Place Order</button>
                        <button type="button" class="btn checkout-cancel-btn" onclick="toggleCheckout(false)">Cancel</button>
                    </div>
                </form>
                <iframe name="hidden-iframe" style="display:none;"></iframe>
            </div>
        `;
        document.body.appendChild(checkoutForm);
    }
    return checkoutForm;
}

document.addEventListener('DOMContentLoaded', initializeCartAndProducts);