(() => {
  const products = {
    bananas: { name: "Fresh Bananas", size: "6 pieces", price: 49, category: "produce" },
    tomatoes: { name: "Vine Tomatoes", size: "500 g", price: 39, category: "produce" },
    milk: { name: "Farm Fresh Milk", size: "1 L", price: 68, category: "dairy" },
    eggs: { name: "Brown Eggs", size: "Pack of 6", price: 72, category: "dairy" },
    bread: { name: "Whole Wheat Bread", size: "400 g", price: 55, category: "bakery" },
    juice: { name: "Orange Juice", size: "1 L", price: 129, category: "beverages" },
    almonds: { name: "Whole Almonds", size: "200 g", price: 199, category: "snacks" },
    soap: { name: "Dishwashing Liquid", size: "500 ml", price: 109, category: "household" }
  };

  const categoryNames = {
    produce: "Fruits & Vegetables",
    dairy: "Dairy & Eggs",
    bakery: "Bakery",
    beverages: "Beverages",
    snacks: "Snacks",
    household: "Household"
  };

  const cart = new Map();
  const money = val => "₹" + val.toLocaleString("en-IN");
  const $ = id => document.getElementById(id);
  let category = "all", submitting = false, lastFocus = null;
  const cards = [...document.querySelectorAll(".product-card")];
  const cartNodes = new Map();

  function filterProducts() {
    const term = $("product-search").value.trim().toLowerCase();
    let count = 0;
    cards.forEach(card => {
      const item = products[card.dataset.product];
      const visible = (category === "all" || item.category === category) &&
        (!term || (item.name + " " + item.size + " " + categoryNames[item.category]).toLowerCase().includes(term));
      card.hidden = !visible;
      if (visible) count++;
    });
    $("results-status").textContent = count + (count === 1 ? " product" : " products") + " found";
    $("no-results").classList.toggle("hidden", count !== 0);
    document.querySelectorAll("[data-category]").forEach(b => {
      if (b.matches("button")) b.setAttribute("aria-pressed", String(b.dataset.category === category));
    });
    $("clear-filter").setAttribute("aria-pressed", String(category === "all"));
  }

  function chooseCategory(next) {
    category = next;
    filterProducts();
    $("products").scrollIntoView({ behavior: "smooth" });
  }

  document.querySelectorAll("button[data-category]").forEach(btn => 
    btn.addEventListener("click", () => chooseCategory(btn.dataset.category))
  );

  $("clear-filter").addEventListener("click", () => {
    category = "all";
    $("product-search").value = "";
    filterProducts();
  });

  $("product-search").addEventListener("input", filterProducts);

  cards.forEach(card => {
    card.querySelector(".add-product").addEventListener("click", () => {
      const input = card.querySelector(".product-qty");
      const amount = Math.max(1, Math.min(99, Number.parseInt(input.value, 10) || 1));
      input.value = amount;
      const id = card.dataset.product;
      cart.set(id, Math.min(99, (cart.get(id) || 0) + amount));
      renderCart();
      openCart();
    });
  });

  function totals() {
    let subtotal = 0, count = 0;
    cart.forEach((qty, id) => { subtotal += products[id].price * qty; count += qty; });
    return { subtotal, fee: subtotal === 0 || subtotal >= 499 ? 0 : 39, count };
  }

  function renderCart() {
    const list = $("cart-items");
    cartNodes.forEach((node, id) => {
      if (!cart.has(id)) {
        node.remove();
        cartNodes.delete(id);
      }
    });

    cart.forEach((quantity, id) => {
      let node = cartNodes.get(id);
      if (!node) {
        node = $("cart-item-template").content.firstElementChild.cloneNode(true);
        node.dataset.id = id;
        node.querySelector(".cart-name").textContent = products[id].name;
        node.querySelector(".cart-detail").textContent = products[id].size + " · " + money(products[id].price) + " each";
        node.querySelector(".cart-remove").addEventListener("click", () => {
          cart.delete(id);
          renderCart();
        });
        node.querySelector(".cart-decrease").addEventListener("click", () => {
          const next = cart.get(id) - 1;
          if (next) cart.set(id, next);
          else cart.delete(id);
          renderCart();
        });
        node.querySelector(".cart-increase").addEventListener("click", () => {
          cart.set(id, Math.min(99, cart.get(id) + 1));
          renderCart();
        });
        list.appendChild(node);
        cartNodes.set(id, node);
      }
      node.querySelector(".cart-quantity").textContent = quantity;
      node.querySelector(".cart-item-price").textContent = money(quantity * products[id].price);
    });

    const { subtotal, fee, count } = totals();
    $("cart-count").textContent = count;
    $("cart-empty").hidden = count > 0;
    $("cart-bottom").hidden = count === 0;
    $("subtotal-value").textContent = money(subtotal);
    $("delivery-value").textContent = fee ? money(fee) : "Free";
    $("total-value").textContent = money(subtotal + fee);
  }

  function openCart() {
    lastFocus = document.activeElement;
    $("drawer-backdrop").hidden = false;
    $("cart-drawer").hidden = false;
    document.body.style.overflow = "hidden";
    $("close-cart").focus();
  }

  function closeCart() {
    $("drawer-backdrop").hidden = true;
    $("cart-drawer").hidden = true;
    document.body.style.overflow = "";
    if (lastFocus?.isConnected) lastFocus.focus();
  }

  $("open-cart").addEventListener("click", openCart);
  $("close-cart").addEventListener("click", closeCart);
  $("drawer-backdrop").addEventListener("click", closeCart);

  document.addEventListener("keydown", e => {
    if ($("cart-drawer").hidden) return;
    if (e.key === "Escape") closeCart();
  });

  $("continue-shopping").addEventListener("click", () => {
    $("confirmation-view").hidden = true;
    $("shopping-view").hidden = false;
    closeCart();
  });

  $("checkout-form").addEventListener("submit", async e => {
    e.preventDefault();
    if (submitting || !cart.size) return;
    const phone = $("customer-phone").value.trim();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      $("customer-phone").setCustomValidity("Enter a valid 10-digit Indian mobile number.");
      $("customer-phone").reportValidity();
      return;
    }
    $("customer-phone").setCustomValidity("");

    const { subtotal, fee } = totals();
    submitting = true;
    $("place-order").disabled = true;

    // Simulate order placement
    setTimeout(() => {
      $("confirmation-total").textContent = "Order total: " + money(subtotal + fee);
      cart.clear();
      renderCart();
      $("checkout-form").reset();
      $("shopping-view").hidden = true;
      $("confirmation-view").hidden = false;
      $("continue-shopping").focus();
      submitting = false;
      $("place-order").disabled = false;
    }, 600);
  });

  $("customer-phone").addEventListener("input", () => $("customer-phone").setCustomValidity(""));

  filterProducts();
  renderCart();
  if (window.lucide) lucide.createIcons();
})();