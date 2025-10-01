
let products = JSON.parse(localStorage.getItem("products")) || [
  { id: 1, 
    name: "Crime and Punishment", 
    price: 9, brand: "book", 
    type: "book", stock: 10, 
    image: "./assets/images/book-1.jpg", 
    category: "book", 
    description: "its aboutcrime which people do and get punishment." 
  },
  { id: 2, 
    name: "To kill a Mocking Bird", 
    price: 8, brand: "book", 
    type: "book", 
    stock: 8, 
    image: "./assets/images/book-2.jpg", 
    category: "book", 
    description: "its about the bird who mock everyday and people want to kill that bird" 
  },
  { id: 3, 
    name: "Pride & Prejudice", 
    price: 5, brand: "book", 
    type: "book", 
    stock: 20, 
    image: "./assets/images/book-3.jpg", 
    category: "book", 
    description: "its about pride and prejudice" 
  },
  { id: 4, 
    name: "The Stranger", 
    price: 5, 
    brand: "book", 
    type: "book", 
    stock: 15, 
    image: "./assets/images/book-4.png", 
    category: "book", 
    description: "its about that one guy which i dont know" 
  }
];

let cart = JSON.parse(localStorage.getItem("cart")) || [];
function saveProducts() {
  localStorage.setItem("products", JSON.stringify(products));
}

function loadProducts() {
  const productList = document.getElementById("product-list");
  if (!productList) return;

  productList.innerHTML = "";
  products.forEach(product => {
    productList.innerHTML += `
      <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
        <div class="card h-100">
          <img src="${product.image}" class="card-img-top" alt="${product.name}">
          <div class="card-body">
            <h5 class="card-title">${product.name}</h5>
            <p class="text-muted">$${product.price}</p>
            <button class="btn btn-primary w-100 mb-2" onclick="addToCart(${product.id})">Add to Cart</button>
            <a href="product.html?id=${product.id}" class="btn btn-outline-dark w-100">View Product</a>
          </div>
        </div>
      </div>`;
  });
  updateCartCount();
}
function addToCart(id) {
  const product = products.find(p => p.id === id);
  cart.push(product);
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  alert(`${product.name} is in cart`);
}

function updateCartCount() {
  const count = document.getElementById("cart-count");
  if (count) count.innerText = cart.length;
}

function loadCart() {
  const cartItems = document.getElementById("cart-items");
  if (!cartItems) return;

  cartItems.innerHTML = "";
  let total = 0;
  cart.forEach((item, index) => {
    total += item.price;
    cartItems.innerHTML += `
      <tr>
        <td><img src="${item.image}" width="60"></td>
        <td>${item.name}</td>
        <td>$${item.price}</td>
        <td><button class="btn btn-danger btn-sm" onclick="removeFromCart(${index})">Remove</button></td>
      </tr>`;
  });
  document.getElementById("cart-total").innerText = total;
}

function removeFromCart(index) {
  cart.splice(index, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  loadCart();
  updateCartCount();
}
function loadProductDetail() {
  const detail = document.getElementById("product-detail");
  if (!detail) return;

  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get("id"));
  const product = products.find(p => p.id === id);

  if (product) {
    detail.innerHTML = `
      <div class="card p-4">
      <div class="text-center mb-3">
      <a href="./index.html" class="btn btn-outline-dark btn-sm">Home</a>
      <a href="./cart.html" class="btn btn-dark btn-sm">Cart (<span id="cart-count">0</span>)</a>
      <a href="./manage.html" class="btn btn-outline-primary btn-sm">Manage Products</a>
    </div>
        <img src="${product.image}" class="img-fluid mx-auto d-block mb-3" style="max-width:300px;">
        <h3>${product.name}</h3>
        <p class="text-muted">$${product.price}</p>
        <p><b>Brand:</b> ${product.brand}</p>
        <p><b>Type:</b> ${product.type}</p>
        <p><b>Stock:</b> ${product.stock}</p>
        <p>${product.description}</p>
        <button class="btn btn-primary" onclick="addToCart(${product.id})">Add to Cart</button>
      </div>`;
  }
}
function loadManageProducts() {
  const table = document.getElementById("manage-products");
  if (!table) return;

  table.innerHTML = "";
  products.forEach((p, i) => {
    table.innerHTML += `
      <tr>
        <td>${p.id}</td>
        <td><img src="${p.image}" width="50"></td>
        <td>${p.name}</td>
        <td>$${p.price}</td>
        <td>${p.brand}</td>
        <td>${p.type}</td>
        <td>${p.stock}</td>
        <td>
          <button class="btn btn-warning btn-sm" onclick="editProduct(${i})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteProduct(${i})">Delete</button>
        </td>
      </tr>`;
  });
}

function resetForm() {
  document.getElementById("product-form").reset();
  document.getElementById("form-title").innerText = "Add New Product";
  document.getElementById("product-id").value = "";
}

document.getElementById("product-form")?.addEventListener("submit", function(e) {
  e.preventDefault();

  let id = document.getElementById("product-id").value;
  const newProduct = {
    id: id ? parseInt(id) : Date.now(),
    name: document.getElementById("name").value,
    price: parseFloat(document.getElementById("price").value),
    brand: document.getElementById("brand").value,
    type: document.getElementById("type").value,
    stock: parseInt(document.getElementById("stock").value),
    image: document.getElementById("image").value,
    description: document.getElementById("description").value
  };

  if (id) {
    const index = products.findIndex(p => p.id == id);
    products[index] = newProduct;
  } else {
    products.push(newProduct);
  }

  saveProducts();
  loadManageProducts();
  resetForm();
});

function editProduct(i) {
  const p = products[i];
  document.getElementById("form-title").innerText = "Edit Product";
  document.getElementById("product-id").value = p.id;
  document.getElementById("name").value = p.name;
  document.getElementById("price").value = p.price;
  document.getElementById("brand").value = p.brand;
  document.getElementById("type").value = p.type;
  document.getElementById("stock").value = p.stock;
  document.getElementById("image").value = p.image;
  document.getElementById("description").value = p.description;
}

function deleteProduct(i) {
  if (confirm("Are you sure you want to delete this product?")) {
    products.splice(i, 1);
    saveProducts();
    loadManageProducts();
  }
}
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  loadCart();
  loadProductDetail();
  loadManageProducts();
});
