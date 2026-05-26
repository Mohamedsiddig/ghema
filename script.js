// ============ تحميل وحفظ البيانات ============
let products = [];
let orders = [];
let reviews = [];
let cart = [];
let currentFilter = "all";
let selectedPaymentMethod = "fawry_khartoum";
let nextOrderId = 1;
let pendingRecipientData = null;
let gpsLocation = { lat: null, lng: null };
let clickCount = 0;
let clickTimer = null;
let isLocating = false;

function loadData() {
    const savedProducts = localStorage.getItem("ghaima_products");
    const savedOrders = localStorage.getItem("ghaima_orders");
    const savedReviews = localStorage.getItem("ghaima_reviews");
    
    if (savedProducts) {
        products = JSON.parse(savedProducts);
    } else {
        products = [
            { id: 1, name: "بوكيه تخرج فاخر", category: "graduation", price: 8900, image: "🎓✨", imageData: null },
            { id: 2, name: "دعوة تخرج ذهبية", category: "graduation", price: 5900, image: "🏅📜", imageData: null },
            { id: 3, name: "بوكيه زواج كلاسيك", category: "wedding", price: 14900, image: "💍🌹", imageData: null },
            { id: 4, name: "عقد قران أنيق", category: "wedding", price: 12900, image: "📜💕", imageData: null },
            { id: 5, name: "دعوة خطوبة وردية", category: "wedding", price: 9900, image: "🌸💍", imageData: null },
            { id: 6, name: "بوكيه مولود جديد", category: "baby", price: 6900, image: "👶🍼", imageData: null },
            { id: 7, name: "بطاقة مولودة ساحرة", category: "baby", price: 4900, image: "🎀👼", imageData: null },
            { id: 8, name: "تصميم تخرج عصري", category: "graduation", price: 7900, image: "🎓🌟", imageData: null }
        ];
    }
    
    if (savedOrders) {
        orders = JSON.parse(savedOrders);
        if (orders.length > 0) {
            const maxId = Math.max(...orders.map(o => o.id));
            nextOrderId = maxId + 1;
        }
    } else {
        orders = [];
    }
    
    if (savedReviews) {
        reviews = JSON.parse(savedReviews);
    } else {
        reviews = [
            { id: 1, name: "نورة", stars: 5, comment: "تصاميم رائعة وجودة ممتازة", status: "approved", date: new Date().toISOString() },
            { id: 2, name: "أحمد", stars: 4, comment: "دعوات زواج جميلة وأنيقة", status: "approved", date: new Date().toISOString() },
            { id: 3, name: "سارة", stars: 5, comment: "خدمة ممتازة وسرعة في التوصيل", status: "pending", date: new Date().toISOString() }
        ];
    }
}

function saveData() {
    localStorage.setItem("ghaima_products", JSON.stringify(products));
    localStorage.setItem("ghaima_orders", JSON.stringify(orders));
    localStorage.setItem("ghaima_reviews", JSON.stringify(reviews));
}

function formatCurrency(amount) { return amount.toLocaleString() + " ج.س"; }
function getCategoryName(cat) { return { graduation:"تخرج", wedding:"زواج/خطوبة", baby:"مواليد" }[cat]; }
function escapeHtml(text) { if (!text) return ''; const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }

function showToast(msg, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.background = type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#2c2b28';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

function closeModal(id) { 
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active'); 
}

// ============ عرض المنتجات ============
function renderProducts() {
    const grid = document.getElementById("productsGrid");
    if (!grid) return;
    
    let filtered = currentFilter === "all" ? products : products.filter(p => p.category === currentFilter);
    
    if (filtered.length === 0) {
        grid.innerHTML = `<div class="no-products" style="text-align:center;padding:60px;"><i class="fas fa-box-open" style="font-size:3rem;color:#c8b29a;"></i><h3 style="margin-top:10px;">لا توجد منتجات</h3><p>لم نجد منتجات في هذا التصنيف</p></div>`;
        return;
    }
    
    const categoryNames = { graduation: { name: "تخرج", icon: "🎓" }, wedding: { name: "زواج / خطوبة", icon: "💍" }, baby: { name: "مواليد", icon: "👶" } };
    
    grid.innerHTML = filtered.map(p => {
        const cat = categoryNames[p.category] || { name: "", icon: "" };
        const hasImage = p.imageData;
        
        return `
            <div class="product-card">
                <div class="product-badge">${cat.icon} ${cat.name}</div>
                <div class="product-img">
                    ${hasImage ? `<img src="${p.imageData}" alt="${escapeHtml(p.name)}" loading="lazy">` : `<span style="font-size: 4rem;">${p.image || cat.icon}</span>`}
                </div>
                <div class="product-info">
                    <div class="product-category"><i class="fas fa-tag"></i><span>${cat.name}</span></div>
                    <h3 class="product-title">${escapeHtml(p.name)}</h3>
                    <div class="product-price">${formatCurrency(p.price)}<small>ج.س</small></div>
                    <div class="product-actions">
                        <button class="add-to-cart" onclick="addToCart(${p.id}, '${escapeHtml(p.name)}', ${p.price})"><i class="fas fa-cart-plus"></i> أضف للسلة</button>
                        <button class="product-quick-view" onclick="quickView(${p.id})" title="معاينة سريعة"><i class="fas fa-eye"></i></button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function quickView(productId) {
    const product = products.find(p => p.id === productId);
    if (product) showToast(`${product.name}\n${formatCurrency(product.price)}`, "info");
}

function renderCategories() {
    const cats = [{ id:"all", name:"جميع البوكيهات", icon:"🌸"},{ id:"graduation", name:"تخرج", icon:"🎓"},{ id:"wedding", name:"زواج / خطوبة", icon:"💍"},{ id:"baby", name:"مواليد", icon:"👶"}];
    const container = document.getElementById("categoriesContainer");
    if (!container) return;
    container.innerHTML = cats.map(c => `<button class="cat-btn ${currentFilter === c.id ? 'active' : ''}" data-cat="${c.id}">${c.icon} ${c.name}</button>`).join("");
    document.querySelectorAll(".cat-btn").forEach(btn => btn.addEventListener("click", () => { currentFilter = btn.dataset.cat; renderCategories(); renderProducts(); }));
}

// ============ سلة المشتريات ============
function addToCart(id, name, price) {
    let existing = cart.find(item => item.id === id);
    existing ? existing.quantity++ : cart.push({ id, name, price, quantity: 1 });
    updateCartUI();
    showToast("✓ تمت الإضافة", "success");
}

function updateCartUI() {
    let totalItems = cart.reduce((s, i) => s + i.quantity, 0);
    const cartCount = document.getElementById("cartCount");
    if (cartCount) cartCount.innerText = totalItems;
    
    const cartDiv = document.getElementById("cartItemsList");
    if (!cartDiv) return;
    
    if (!cart.length) { 
        cartDiv.innerHTML = "<div style='text-align:center;padding:40px;'>السلة فارغة 🤍</div>"; 
    } else {
        cartDiv.innerHTML = cart.map(i => `<div class="cart-item"><div><strong>${escapeHtml(i.name)}</strong><br>${formatCurrency(i.price)} × ${i.quantity}</div><button onclick="removeFromCart(${i.id})" style="background:none;border:none;font-size:1.2rem;cursor:pointer;">🗑️</button></div>`).join("");
    }
    let total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const cartTotal = document.getElementById("cartTotalPrice");
    if (cartTotal) cartTotal.innerHTML = `المجموع: ${formatCurrency(total)}`;
}

function removeFromCart(id) { 
    cart = cart.filter(i => i.id !== id); 
    updateCartUI(); 
    showToast("تمت الإزالة", "info"); 
}

// ============ التقييمات ============
function renderCustomerReviews() {
    const container = document.getElementById("reviewsList");
    if (!container) return;
    const approved = reviews.filter(r => r.status === 'approved');
    if (approved.length === 0) { 
        container.innerHTML = "<div style='text-align:center;padding:40px;'>لا توجد تقييمات بعد، كن أول من يقيم!</div>"; 
        return; 
    }
    container.innerHTML = approved.map(r => `<div class="review-card"><div class="review-stars">${'⭐'.repeat(r.stars)}</div><p>${escapeHtml(r.comment)}</p><strong>— ${escapeHtml(r.name)}</strong></div>`).join("");
}

function setupStarRating() {
    const stars = document.querySelectorAll('.stars-input i');
    const selectedStars = document.getElementById('selectedStars');
    if (!stars.length || !selectedStars) return;
    
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const value = parseInt(star.dataset.value);
            selectedStars.value = value;
            stars.forEach((s, index) => {
                if (index < value) { 
                    s.classList.add('active'); 
                    s.classList.remove('far'); 
                    s.classList.add('fas'); 
                } else { 
                    s.classList.remove('active'); 
                    s.classList.remove('fas'); 
                    s.classList.add('far'); 
                }
            });
        });
        star.addEventListener('mouseenter', () => {
            const value = parseInt(star.dataset.value);
            stars.forEach((s, index) => { s.style.color = index < value ? '#f5b342' : '#ddd'; });
        });
        star.addEventListener('mouseleave', () => {
            const currentValue = parseInt(selectedStars.value) || 0;
            stars.forEach((s, index) => { s.style.color = index < currentValue ? '#f5b342' : '#ddd'; });
        });
    });
}

document.getElementById("submitReviewBtn")?.addEventListener("click", () => {
    const name = document.getElementById("reviewerName").value.trim();
    const stars = parseInt(document.getElementById("selectedStars").value);
    const comment = document.getElementById("reviewComment").value.trim();
    if (!name) { showToast("يرجى إدخال اسمك", "error"); return; }
    if (stars === 0) { showToast("يرجى اختيار عدد النجوم", "error"); return; }
    if (!comment) { showToast("يرجى كتابة تعليقك", "error"); return; }
    const newId = Date.now();
    reviews.unshift({ id: newId, name, stars, comment, status: 'pending', date: new Date().toISOString() });
    saveData(); 
    renderCustomerReviews(); 
    showToast("شكراً لتقييمك! سيتم مراجعته قريباً", "success");
    document.getElementById("reviewerName").value = ""; 
    document.getElementById("reviewComment").value = ""; 
    document.getElementById("selectedStars").value = "";
    document.querySelectorAll('.stars-input i').forEach(s => { s.classList.remove('active', 'fas'); s.classList.add('far'); s.style.color = '#ddd'; });
});

// ============ نظام تحديد الموقع GPS ============
function getCurrentLocation() {
    const statusDiv = document.getElementById("gpsStatus");
    const gpsBtn = document.getElementById("getGpsBtn");
    const openMapBtn = document.getElementById("openMapBtn");
    
    if (!statusDiv) return;
    
    if (!navigator.geolocation) {
        statusDiv.innerHTML = "❌ متصفحك لا يدعم تحديد الموقع";
        statusDiv.style.color = "#dc3545";
        return;
    }
    
    if (isLocating) {
        showToast("جاري تحديد الموقع بالفعل...", "info");
        return;
    }
    
    isLocating = true;
    if (gpsBtn) gpsBtn.disabled = true;
    statusDiv.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> جاري تحديد الموقع...';
    statusDiv.style.color = "#2c7da0";
    
    const options = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            gpsLocation.lat = position.coords.latitude;
            gpsLocation.lng = position.coords.longitude;
            
            document.getElementById("gpsLat").value = gpsLocation.lat;
            document.getElementById("gpsLng").value = gpsLocation.lng;
            
            statusDiv.innerHTML = `<i class="fas fa-check-circle"></i> ✅ تم تحديد موقعك: ${gpsLocation.lat.toFixed(6)}, ${gpsLocation.lng.toFixed(6)}`;
            statusDiv.style.color = "#28a745";
            
            if (openMapBtn) openMapBtn.style.display = "inline-flex";
            
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${gpsLocation.lat}&lon=${gpsLocation.lng}&zoom=18&addressdetails=1`)
                .then(res => res.json())
                .then(data => {
                    if (data.display_name) {
                        const addressField = document.getElementById("recipientAddress");
                        if (addressField) addressField.value = data.display_name.substring(0, 200);
                        showToast("تم تعبئة العنوان تلقائياً", "success");
                    }
                })
                .catch(() => {});
            
            showToast("تم تحديد موقعك بنجاح!", "success");
            isLocating = false;
            if (gpsBtn) gpsBtn.disabled = false;
        },
        function(error) {
            let errorMessage = "";
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = "❌ تم رفض الوصول إلى الموقع. الرجاء السماح بالوصول";
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = "❌ معلومات الموقع غير متاحة حالياً";
                    break;
                case error.TIMEOUT:
                    errorMessage = "❌ انتهت مهلة تحديد الموقع. حاول مرة أخرى";
                    break;
                default:
                    errorMessage = "❌ حدث خطأ في تحديد الموقع";
                    break;
            }
            statusDiv.innerHTML = errorMessage;
            statusDiv.style.color = "#dc3545";
            showToast(errorMessage, "error");
            isLocating = false;
            if (gpsBtn) gpsBtn.disabled = false;
        },
        options
    );
}

function openMapManual() {
    const lat = document.getElementById("gpsLat").value;
    const lng = document.getElementById("gpsLng").value;
    if (lat && lng) {
        window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    } else {
        showToast("الرجاء تحديد الموقع أولاً", "error");
    }
}

function openRecipientModal() {
    if (cart.length === 0) { 
        showToast("السلة فارغة!", "error"); 
        return; 
    }
    document.getElementById("recipientModal").classList.add("active");
}

function proceedToPayment() {
    const fullName = document.getElementById("recipientFullName").value.trim();
    const phone = document.getElementById("recipientPhone").value.trim();
    const address = document.getElementById("recipientAddress").value.trim();
    const lat = document.getElementById("gpsLat").value;
    const lng = document.getElementById("gpsLng").value;
    
    if (!fullName) { 
        showToast("يرجى إدخال الاسم الكامل", "error"); 
        document.getElementById("recipientFullName").focus();
        return; 
    }
    if (!phone) { 
        showToast("يرجى إدخال رقم الهاتف", "error"); 
        document.getElementById("recipientPhone").focus();
        return; 
    }
    if (!address) { 
        showToast("يرجى إدخال العنوان التفصيلي", "error"); 
        document.getElementById("recipientAddress").focus();
        return; 
    }
    if (!lat || !lng) { 
        showToast("يرجى تحديد موقعك عبر GPS أولاً (اضغط على زر تحديد موقعي الحالي)", "error"); 
        return; 
    }
    
    pendingRecipientData = { 
        fullName: fullName,
        phone: phone, 
        email: document.getElementById("recipientEmail").value, 
        address: address, 
        gpsLat: parseFloat(lat), 
        gpsLng: parseFloat(lng), 
        notes: document.getElementById("recipientNotes").value 
    };
    
    closeModal('recipientModal');
    openPaymentModal();
}

function openPaymentModal() {
    const paymentModal = document.getElementById("paymentModal");
    if (!paymentModal) return;
    
    selectedPaymentMethod = "fawry_khartoum";
    document.querySelectorAll(".payment-method").forEach(m => m.classList.remove("selected"));
    const defaultMethod = document.querySelector('.payment-method[data-method="fawry_khartoum"]');
    if (defaultMethod) defaultMethod.classList.add("selected");
    updateBankDetails("fawry_khartoum");
    const bankSection = document.getElementById("proofUploadSection");
    if (bankSection) bankSection.style.display = "block";
    paymentModal.classList.add("active");
}

function updateBankDetails(method) {
    const detailsDiv = document.getElementById("bankDetailsMessage");
    const noteField = document.getElementById("bankTransferNote");
    if (!detailsDiv) return;
    
    if (method === "fawry_khartoum") { 
        detailsDiv.innerHTML = "🔹 فوري - بنك الخرطوم: 19623 | الحساب 100123456789"; 
        if (noteField) noteField.value = "دفع عبر فوري - الرقم: ********"; 
    }
    else if (method === "fawry_faisal") { 
        detailsDiv.innerHTML = "🔹 فوري - بنك فيصل الإسلامي: 7788990011"; 
        if (noteField) noteField.value = "دفع عبر فوري فيصل - كود: ********"; 
    }
    else if (method === "bank_khartoum") { 
        detailsDiv.innerHTML = "🏦 تحويل بنكي - بنك الخرطوم: 0123456789 | IBAN: SDNKH123456789"; 
        if (noteField) noteField.value = "تحويل بنك الخرطوم"; 
    }
    else if (method === "bank_omdurman_okash") { 
        detailsDiv.innerHTML = "📱 OKash: 0923456789"; 
        if (noteField) noteField.value = "دفع عبر OKash"; 
    }
    else if (method === "cod") { 
        detailsDiv.innerHTML = "🚚 الدفع عند الاستلام"; 
        if (noteField) noteField.value = "الدفع نقداً"; 
    }
}

function handlePaymentMethodChange(method) {
    selectedPaymentMethod = method;
    const bankSection = document.getElementById("proofUploadSection");
    if (bankSection) {
        if (method === "cod") {
            bankSection.style.display = "none";
        } else {
            bankSection.style.display = "block";
            updateBankDetails(method);
        }
    }
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => { 
        const reader = new FileReader(); 
        reader.onload = () => resolve(reader.result); 
        reader.onerror = reject; 
        reader.readAsDataURL(file); 
    });
}

async function processOrder() {
    if (!pendingRecipientData) { 
        showToast("حدث خطأ", "error"); 
        return; 
    }
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const itemsCount = cart.reduce((s, i) => s + i.quantity, 0);
    const itemsList = cart.map(i => `${i.name} (×${i.quantity})`).join(', ');
    let methodName = "", orderStatus = "";
    switch(selectedPaymentMethod) {
        case "fawry_khartoum": methodName = "فوري - بنك الخرطوم"; orderStatus = "تم الدفع عبر فوري"; break;
        case "fawry_faisal": methodName = "فوري - بنك فيصل الإسلامي"; orderStatus = "تم الدفع عبر فوري فيصل"; break;
        case "bank_khartoum": methodName = "تحويل بنكي - بنك الخرطوم"; orderStatus = "بانتظار المراجعة"; break;
        case "bank_omdurman_okash": methodName = "بنك أمدرمان - OKash"; orderStatus = "تم الدفع عبر OKash"; break;
        case "cod": methodName = "الدفع عند الاستلام"; orderStatus = "سيتم الدفع عند التوصيل"; break;
        default: methodName = "تحويل بنكي"; orderStatus = "تم الطلب";
    }
    let proofImage = null;
    if (selectedPaymentMethod !== "cod") {
        const fileInput = document.getElementById("transferProofImage");
        if (!fileInput || !fileInput.files || !fileInput.files[0]) { 
            showToast("يرجى رفع صورة الإشعار", "error"); 
            return; 
        }
        proofImage = await readFileAsDataURL(fileInput.files[0]);
    }
    const newOrder = { 
        id: nextOrderId++, 
        customerName: pendingRecipientData.fullName, 
        phone: pendingRecipientData.phone, 
        address: pendingRecipientData.address, 
        gpsLat: pendingRecipientData.gpsLat, 
        gpsLng: pendingRecipientData.gpsLng, 
        total: total, 
        paymentMethod: methodName, 
        status: orderStatus, 
        items: itemsList, 
        proofImage: proofImage, 
        date: new Date().toISOString() 
    };
    orders.unshift(newOrder); 
    saveData(); 
    cart = []; 
    pendingRecipientData = null; 
    updateCartUI(); 
    closeModal('paymentModal'); 
    showToast(`✅ تم إنشاء الطلب بنجاح!`, "success");
}

// ============ فتح لوحة التحكم (3 ضغطات على الشعار) ============
function setupAdminAccess() {
    const logo = document.getElementById("logoTrigger");
    if (!logo) return;
    
    logo.addEventListener("click", function(e) {
        clickCount++;
        clearTimeout(clickTimer);
        clickTimer = setTimeout(function() { clickCount = 0; }, 800);
        if (clickCount === 3) {
            clickCount = 0;
            window.open('admin.html', '_blank');
        }
    });
}

// ============ أحداث ============
document.getElementById("cartIconBtn")?.addEventListener("click", () => { 
    document.getElementById("cartSidebar").classList.add("open"); 
    document.getElementById("overlay").classList.add("active"); 
});
document.getElementById("closeCartBtn")?.addEventListener("click", () => { 
    document.getElementById("cartSidebar").classList.remove("open"); 
    document.getElementById("overlay").classList.remove("active"); 
});
document.getElementById("overlay")?.addEventListener("click", () => { 
    document.getElementById("cartSidebar").classList.remove("open"); 
    document.getElementById("overlay").classList.remove("active"); 
});
document.getElementById("checkoutBtn")?.addEventListener("click", openRecipientModal);
document.getElementById("getGpsBtn")?.addEventListener("click", getCurrentLocation);
document.getElementById("openMapBtn")?.addEventListener("click", openMapManual);
document.getElementById("proceedToPaymentBtn")?.addEventListener("click", proceedToPayment);
document.getElementById("confirmPaymentBtn")?.addEventListener("click", processOrder);

document.querySelectorAll(".payment-method").forEach(m => m.addEventListener("click", () => { 
    document.querySelectorAll(".payment-method").forEach(pm => pm.classList.remove("selected")); 
    m.classList.add("selected"); 
    handlePaymentMethodChange(m.dataset.method); 
}));

// ============ التهيئة ============
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    renderCategories();
    renderProducts();
    renderCustomerReviews();
    updateCartUI();
    setupStarRating();
    setupAdminAccess();
});