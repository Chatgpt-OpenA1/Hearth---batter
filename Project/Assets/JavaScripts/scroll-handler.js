let lastScrollPosition = window.scrollY;

function handleAddToCartClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    lastScrollPosition = window.scrollY;
    
    const button = e.target;
    const id = button.dataset.id;
    const name = button.dataset.name;
    const price = button.dataset.price;
    const type = button.dataset.type || 'Regular';
    
    if (typeof addToCart === 'function') {
        addToCart(id, name, price, type);
        
        setTimeout(() => {
            window.scrollTo({
                top: lastScrollPosition,
                behavior: 'instant'
            });
        }, 50);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', function(e) {
        const addToCartButton = e.target.closest('.btn[data-id]');
        if (addToCartButton) {
            handleAddToCartClick(e);
        }
    });
});
