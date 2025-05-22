const SPREADSHEET_ID = '1btcXpLmm4hitAze1pZCox5uqgdS0CvyOBMcZMG-6Hn4'; 
const ORDER_SHEET_NAME = 'ORDER SHEET';
const PRODUCT_SHEET_NAME = 'PRODUCT SHEET';

function doGet(e) {
  try {
    const action = e.parameter.action;
    const sheet = e.parameter.sheet;
    
    // Handle ping requests for connection testing
    if (action === 'ping') {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (sheet === 'Product' || sheet === PRODUCT_SHEET) {
   return getProductData();
  }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Invalid request'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('doGet error:', error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}


function doPost(e) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ORDER_SHEET_NAME);
    if (!sheet) {
      throw new Error('ORDER SHEET not found');
    }

    // Get form data
    const formData = e.parameter;
    console.log('Received form data:', formData);
    
    // Parse cart data
    let cartData;
    try {
      cartData = JSON.parse(formData.cart || '{}');
    } catch (parseError) {
      throw new Error('Invalid cart data format');
    }
    
    const cartItems = cartData.items || [];
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      throw new Error('Cart is empty or invalid');
    }

    // Get customer info
    const customerName = formData['Customer Name'] || '';
    const email = formData['Email'] || '';
    const phone = formData['Phone'] || '';
    const address = formData['Address'] || '';
    const paymentMethod = formData['Payment Method'] || '';
    const notes = formData['Notes'] || '';
    const totalAmount = cartData.total || 0;

    // Validate required fields
    if (!customerName || !email || !phone || !address) {
      throw new Error('Missing required customer information');
    }

    // Generate Order ID and Customer ID
    const orderId = generateOrderId(sheet);
    const customerId = generateCustomerId(email, phone, address, sheet);
    const orderDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Initialize headers if sheet is empty
    initializeOrderSheetHeaders(sheet);

    // Add each cart item as a separate row
    cartItems.forEach(item => {
      const productNameWithType = `${item.name}(${item.type})`;
      const lineTotal = item.price * item.quantity;
      
      const row = [
        orderId,                    // Order ID
        orderDate,                  // Date
        customerId,                 // Customer ID
        customerName,               // Customer Name
        email,                      // Email
        phone,                      // Phone
        address,                    // Address
        productNameWithType,        // Product Name (with type)
        item.quantity,              // Quantities
        item.price,                 // Price
        lineTotal,                  // Line Total
        totalAmount,                // Total Amount
        paymentMethod,              // Payment Method
        'Pending',                  // Order Status
        '',                         // Delivery Date (empty for now)
        notes                       // Notes
      ];
      
      sheet.appendRow(row);
    });

    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      orderId: orderId,
      customerId: customerId,
      message: 'Order successfully submitted'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('doPost error:', error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Initialize ORDER SHEET headers if they don't exist
 */
function initializeOrderSheetHeaders(sheet) {
  const headers = [
    'Order ID', 'Date', 'Customer ID', 'Customer Name', 'Email', 'Phone', 
    'Address', 'Product Name', 'Quantities', 'Price', 'Line Total', 
    'Total Amount', 'Payment Method', 'Order Status', 'Delivery Date', 'Notes'
  ];
  
  const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const hasHeaders = firstRow.some(cell => cell !== '');
  
  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

/**
 * sequential Order ID
 */
function generateOrderId(sheet) {
  try {
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      // No orders yet (only headers or empty sheet)
      return 'ORD000001';
    }
    
    // Get the last order ID
    const lastOrderId = sheet.getRange(lastRow, 1).getValue();
    
    if (!lastOrderId || typeof lastOrderId !== 'string') {
      return 'ORD000001';
    }
    
    // Extract number from last order ID and increment
    const match = lastOrderId.match(/ORD(\d+)/);
    if (match) {
      const lastNumber = parseInt(match[1]);
      const newNumber = lastNumber + 1;
      return 'ORD' + String(newNumber).padStart(6, '0');
    }
    
    return 'ORD000001';
  } catch (error) {
    console.error('Error generating order ID:', error);
    return 'ORD' + String(Date.now()).slice(-6);
  }
}

/**
 * Generate or retrieve Customer ID based on email, phone, and address
 */
function generateCustomerId(email, phone, address, sheet) {
  try {
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return 'CUST-00001';
    }
    
    // Get all customer data to check for existing customer
    const data = sheet.getRange(2, 1, lastRow - 1, 16).getValues();
    
    // Look for existing customer by email, phone, or address
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const existingEmail = row[4]; // Email column (index 4)
      const existingPhone = row[5]; // Phone column (index 5)
      const existingAddress = row[6]; // Address column (index 6)
      const existingCustomerId = row[2]; // Customer ID column (index 2)
      
      // Check if customer exists (match by email or phone)
      if ((existingEmail && existingEmail.toLowerCase() === email.toLowerCase()) ||
          (existingPhone && existingPhone === phone)) {
        return existingCustomerId;
      }
    }
    
    const customerIds = data.map(row => row[2]).filter(id => id && typeof id === 'string');
    
    if (customerIds.length === 0) {
      return 'CUST-00001';
    }
    
    // Find the highest customer number
    let maxNumber = 0;
    customerIds.forEach(id => {
      const match = id.match(/CUST-(\d+)/);
      if (match) {
        const number = parseInt(match[1]);
        if (number > maxNumber) {
          maxNumber = number;
        }
      }
    });
    
    const newNumber = maxNumber + 1;
    return 'CUST-' + String(newNumber).padStart(5, '0');
    
  } catch (error) {
    console.error('Error generating customer ID:', error);
    return 'CUST-' + String(Date.now()).slice(-5);
  }
}

/**
 * Get product data from PRODUCT SHEET 
 */
function getProductData() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(PRODUCT_SHEET_NAME);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'PRODUCT SHEET not found'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        data: [],
        message: 'No products found'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    
    const products = data.map(row => {
      const product = {};
      headers.forEach((header, index) => {
        product[header] = row[index];
      });
      return product;
    });
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: products
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('Error getting product data:', error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
