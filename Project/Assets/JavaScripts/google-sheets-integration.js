const API_URL = 'https://script.google.com/macros/s/AKfycbz55m0tpcmJ8DMhhEWoGdirKss0OOh4N2ERehA8zUdrXvLc3nQZIjqCcIHJrz7D_RSP/exec';

async function fetchWithRetry(url, options = {}, maxRetries = 3) {
    const fetchOptions = {
        ...options,
        mode: 'cors',
        credentials: 'omit',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    };

    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, fetchOptions);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn(`Attempt ${i + 1} failed:`, error);
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

async function checkApiConnection() {
    try {
        const result = await fetchWithRetry(API_URL + '?action=ping', {
            method: 'GET'
        });
        return result && result.status === 'ok';
    } catch (error) {
        console.error('API connection error:', error);
        return false;
    }
}

async function loadProductsFromSheet() {
    const existingError = document.querySelector('.products-error-message');
    if (existingError) {
        existingError.remove();
    }

    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'products-loading-message';
    loadingMessage.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <p>Loading products...</p>
        </div>
    `;
    document.querySelector('.products-container')?.appendChild(loadingMessage);

    try {
        const response = await fetchWithRetry(API_URL + '?sheet=Product');
        if (!response.success || !response.data) {
            throw new Error('Failed to load products. Please try again.');
        }
        
        loadingMessage.remove();
        
        displayProducts(response.data);
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('product-grid').innerHTML = 
            '<p class="text-center">Unable to load products at the moment. Please try again later.</p>';
    }
}

function displayProducts(products) {
  try {
    console.log('Products loaded successfully:', products);
    
    const productsByCategory = {};
    
    products.forEach(product => {
      const category = product.Category || 'Other';
      if (!productsByCategory[category]) {
        productsByCategory[category] = [];
      }
      productsByCategory[category].push(product);
    });
    
    Object.keys(productsByCategory).forEach(category => {
      const categoryId = category.toLowerCase().replace(/\s+/g, '-');
      const sectionElement = document.getElementById(categoryId);
      
      if (sectionElement) {
        const productGrid = sectionElement.querySelector('.product-grid');
        if (productGrid) {
          productGrid.innerHTML = ''; 
          
          productsByCategory[category].forEach(product => {
            const productId = (product['Product ID'] || 
                             `${product.Name}-${product.Category}`.replace(/\s+/g, '-').toLowerCase());
            
            const productDiv = document.createElement('div');
            productDiv.className = 'product';
            if (product['Tags']) {
              productDiv.dataset.tags = product['Tags'];
            }
            
            let priceDisplay = '';
            const premixPrice = product['Price(Premix)'];
            const bakedPrice = product['Price(Baked)'];
            const regularPrice = product['Price'];
            
            if (premixPrice && bakedPrice) {
              priceDisplay = `Premix (250g): ₹${premixPrice}<br>Baked (250g): ₹${bakedPrice}`;
            } else if (premixPrice) {
              priceDisplay = `Premix (250g): ₹${premixPrice}`;
            } else if (bakedPrice) {
              priceDisplay = `Baked (250g): ₹${bakedPrice}`;
            } else if (regularPrice) {
              priceDisplay = `₹${regularPrice}`;
            }
            
            const imgSrc = product['Image URL'] || 'assets/images/placeholder.jpg';
            
            productDiv.innerHTML = `
              <img src="${imgSrc}" alt="${product['Name']}" class="product-img" loading="lazy" onerror="this.src='assets/images/placeholder.jpg'">
              <div class="product-info">
                <h2>${product['Name']}</h2>
                <p>${product['Description'] || ''}</p>
                <div class="product-price">
                  <p>${priceDisplay}</p>
                </div>
                <div class="product-actions">
                  ${premixPrice ? `<button class="btn premix-btn" data-id="${productId}" data-name="${product['Name']}" data-type="Premix" data-price="${premixPrice}">Add Premix</button>` : ''}
                  ${bakedPrice ? `<button class="btn baked-btn" data-id="${productId}" data-name="${product['Name']}" data-type="Baked" data-price="${bakedPrice}">Add Baked</button>` : ''}
                  ${(!premixPrice && !bakedPrice && regularPrice) ? 
                    `<button class="btn" data-id="${productId}" data-name="${product['Name']}" data-type="Regular" data-price="${regularPrice}">Add to Cart</button>` : ''}
                </div>
              </div>
            `;
            
            productGrid.appendChild(productDiv);
            
            const buttons = productDiv.querySelectorAll('.btn');
            buttons.forEach(button => {
              button.addEventListener('click', function(e) {
                e.preventDefault();
                const id = this.dataset.id || productId;
                const name = this.dataset.name || product['Name'];
                const price = this.dataset.price;
                const type = this.dataset.type || 'Regular';
                
                if (typeof addToCart === 'function') {
                  addToCart(id, name, price, type);
                } else {
                  console.error('addToCart function not found');
                  alert('Unable to add to cart. Please try again later.');
                }
              });
            });
          });
        }
      }
    });
    
    if (typeof filterProducts === 'function') {
      filterProducts();
    }
    
  } catch (error) {
    console.error('Error displaying products:', error);
  }
}

async function sendOrderToServer(formData) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors', 
            body: formData
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to submit order:', error);
        throw error;
    }
}

window.API_URL = API_URL;