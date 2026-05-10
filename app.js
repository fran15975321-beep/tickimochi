/* =====================================================
   TickiMochi — app.js
   ===================================================== */

let currentUser = null;

// =====================================================
// ⚠️  INSTRUCCIONES PARA CONFIGURAR GOOGLE OAUTH
// =====================================================
// 1. Ve a: https://console.cloud.google.com
// 2. Crea un proyecto → APIs & Services → Credentials
// 3. Crea un OAuth Client ID (tipo: Aplicación web)
// 4. En "Authorized JavaScript origins" agrega:
//       https://fran15975321-beep.github.io
// 5. Pega tu Client ID abajo reemplazando AQUI_TU_CLIENT_ID
// =====================================================
const CLIENT_ID = '563182274008-lvsvetetpqm1l48tiglhju0aroqod7ie.apps.googleusercontent.com';

// --- Mock Data ---
const eventsData = [
    { id: 1, name: "Reggaeton Lima Festival",  date: "Sábado 28 de Marzo",       venue: "Estadio Nacional",     img: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=2070", price: 150 },
    { id: 2, name: "Brightlight Music Fest",   date: "Viernes 12 de Junio",      venue: "Arena 1",              img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=2070", price: 200 },
    { id: 3, name: "Electronic Paradise",      date: "Sábado 05 de Julio",       venue: "Club Cultural",        img: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=2070", price: 180 },
    { id: 4, name: "Rock Symphony",            date: "Jueves 20 de Agosto",      venue: "Gran Teatro Nacional", img: "https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&q=80&w=2070", price: 120 },
    { id: 5, name: "K-Pop World Tour",         date: "Domingo 15 de Septiembre", venue: "Jockey Club",          img: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=2070", price: 350 },
    { id: 6, name: "Jazz Under the Moon",      date: "Viernes 02 de Octubre",    venue: "Barranco Arena",       img: "https://images.unsplash.com/photo-1514525253344-f814d074e015?auto=format&fit=crop&q=80&w=2070", price: 90  }
];

let currentEvent = null;
let cart = { platinum: 0, vip: 0, general: 0, occidente: 0, tribunaNorte: 0 };
const prices = { platinum: 5, vip: 3.5, general: 2.5, occidente: 3, tribunaNorte: 2 };

// =====================================================
// Google Sign-In
// =====================================================
function initializeGoogleSignIn() {
    if (typeof google === 'undefined') {
        setTimeout(initializeGoogleSignIn, 300);
        return;
    }

    google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: false
    });

    google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        {
            theme: 'outline',
            size: 'large',
            width: 280,
            text: 'signin_with',
            shape: 'pill',
            logo_alignment: 'left'
        }
    );
}

function handleCredentialResponse(response) {
    try {
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64).split('').map(c =>
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join('')
        );
        const userData = JSON.parse(jsonPayload);

        currentUser = {
            email:   userData.email,
            name:    userData.name,
            picture: userData.picture
        };

        localStorage.setItem('tickimochi_user', JSON.stringify(currentUser));
        updateUserUI();
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('login-error').style.display = 'none';
        showSection('profile');
        loadProfile();
    } catch (e) {
        document.getElementById('login-error').style.display = 'block';
    }
}

// =====================================================
// User UI
// =====================================================
function updateUserUI() {
    if (currentUser) {
        document.getElementById('connect-btn').classList.add('hidden');
        document.getElementById('user-menu').classList.remove('hidden');
        document.getElementById('user-avatar').src = currentUser.picture;
        document.getElementById('user-name').textContent = currentUser.name.split(' ')[0];
    } else {
        document.getElementById('connect-btn').classList.remove('hidden');
        document.getElementById('user-menu').classList.add('hidden');
    }
}

function toggleDropdown() {
    document.getElementById('user-menu').classList.toggle('active');
}

function logoutUser() {
    if (typeof google !== 'undefined') {
        google.accounts.id.disableAutoSelect();
    }
    currentUser = null;
    localStorage.removeItem('tickimochi_user');
    updateUserUI();
    showSection('home');
    document.getElementById('user-menu').classList.remove('active');
}

document.addEventListener('click', function (event) {
    if (!event.target.closest('.user-dropdown')) {
        document.getElementById('user-menu').classList.remove('active');
    }
});

// =====================================================
// Navigation
// =====================================================
function showSection(sectionId) {
    if (!currentUser && sectionId !== 'home' && sectionId !== 'events' && sectionId !== 'detail') {
        document.getElementById('loginScreen').classList.remove('hidden');
        return;
    }
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden-section'));
    document.getElementById(sectionId).classList.remove('hidden-section');
    window.scrollTo(0, 0);
    if (sectionId === 'profile') loadProfile();
}

function buyFeaturedTicket(id) {
    if (!currentUser) {
        document.getElementById('loginScreen').classList.remove('hidden');
        return;
    }
    currentEvent = eventsData.find(e => e.id === id);
    if (currentEvent) goToTickets();
}

// =====================================================
// Rendering
// =====================================================
function renderGrids() {
    document.getElementById('home-events-grid').innerHTML = eventsData.slice(0, 4).map(createCardHtml).join('');
    document.getElementById('all-events-grid').innerHTML = eventsData.map(createCardHtml).join('');
}

function createCardHtml(event) {
    return `
        <div class="event-card group cursor-pointer" onclick="viewDetail(${event.id})">
            <div class="h-64 overflow-hidden relative">
                <img src="${event.img}" class="w-full h-full object-cover transition duration-500 group-hover:scale-110" alt="${event.name}">
                <div class="absolute bottom-4 left-4 bg-[#FF2D55] text-white text-xs font-bold px-3 py-1 rounded-full">DESTACADO</div>
            </div>
            <div class="p-6">
                <p class="text-xs text-[#FF2D55] font-bold mb-1 uppercase tracking-tighter">${event.date}</p>
                <h3 class="text-xl font-bold mb-2 group-hover:text-[#FF2D55] transition">${event.name}</h3>
                <div class="flex items-center gap-2 text-gray-400 text-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    ${event.venue}
                </div>
            </div>
        </div>
    `;
}

function viewDetail(id) {
    currentEvent = eventsData.find(e => e.id === id);
    document.getElementById('event-detail-content').innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div class="rounded-[30px] overflow-hidden shadow-2xl">
                <img src="${currentEvent.img}" class="w-full h-full object-cover" alt="">
            </div>
            <div>
                <span class="text-[#FF2D55] font-bold tracking-widest text-sm uppercase">Concierto confirmado</span>
                <h1 class="text-5xl font-black mt-2 mb-6">${currentEvent.name}</h1>
                <div class="space-y-4 mb-8">
                    <div class="flex items-center gap-4 text-gray-300">
                        <div class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#FF2D55]">📅</div>
                        <div>
                            <p class="text-sm text-gray-500">Fecha y Hora</p>
                            <p class="font-semibold">${currentEvent.date}, 20:00</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-4 text-gray-300">
                        <div class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#FF2D55]">📍</div>
                        <div>
                            <p class="text-sm text-gray-500">Ubicación</p>
                            <p class="font-semibold">${currentEvent.venue}, Lima</p>
                        </div>
                    </div>
                </div>
                <div class="mb-10">
                    <h4 class="font-bold mb-2">Descripción</h4>
                    <p class="text-gray-400 leading-relaxed">Prepárate para una noche inolvidable. El festival más grande llega a la ciudad con los mejores artistas internacionales en una producción de nivel mundial. No te pierdas la preventa exclusiva.</p>
                </div>
                <div class="flex items-center gap-6">
                    <button onclick="goToTickets()" class="btn-primary flex-1 py-4 text-lg font-bold">COMPRAR ENTRADAS</button>
                    <button class="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition">❤️</button>
                </div>
            </div>
        </div>
    `;
    showSection('detail');
}

// =====================================================
// Cart
// =====================================================
function goToTickets() {
    if (!currentUser) {
        document.getElementById('loginScreen').classList.remove('hidden');
        return;
    }
    document.getElementById('ticket-event-name').innerText = currentEvent.name;
    resetCart();
    showSection('tickets');
}

function resetCart() {
    cart = { platinum: 0, vip: 0, general: 0, occidente: 0, tribunaNorte: 0 };
    updateCartDisplay();
}

function updateQty(type, delta) {
    cart[type] = Math.max(0, cart[type] + delta);
    updateCartDisplay();
}

function updateCartDisplay() {
    ['platinum', 'vip', 'general', 'occidente', 'tribunaNorte'].forEach(t => {
        document.getElementById(`qty-${t}`).innerText = cart[t];
    });
    const total = Object.keys(cart).reduce((sum, t) => sum + cart[t] * prices[t], 0);
    document.getElementById('total-price').innerText = `S/ ${total.toFixed(2)}`;
    document.getElementById('checkout-final-total').innerText = `S/ ${total.toFixed(2)}`;
}

function goToCheckout() {
    const total = Object.keys(cart).reduce((sum, t) => sum + cart[t] * prices[t], 0);
    if (total === 0) { alert("Selecciona al menos una entrada."); return; }

    document.getElementById('checkout-items').innerHTML = Object.keys(cart)
        .filter(t => cart[t] > 0)
        .map(t => `
            <div class="flex justify-between text-sm">
                <span class="text-gray-400">${cart[t]}x Entrada ${t.toUpperCase()}</span>
                <span>S/ ${(cart[t] * prices[t]).toFixed(2)}</span>
            </div>
        `).join('');
    showSection('checkout');
}

// =====================================================
// Payment
// =====================================================
function processPayment() {
    showSection('processing');
    setTimeout(() => {
        if (Math.random() < 0.8) {
            document.getElementById('qr-image').src = 'https://lh3.googleusercontent.com/d/1nVZZw3JqBKyHWYYatrgaWIvNMoOzpPJX=w220';
            document.getElementById('success-event-info').innerText = `${currentEvent.name} - ${currentEvent.date}`;
            showSection('success');
            localStorage.setItem('last_purchase', JSON.stringify({
                event: currentEvent.name,
                date: new Date().toLocaleDateString(),
                total: document.getElementById('checkout-final-total').innerText
            }));
        } else {
            showSection('error');
        }
    }, 3000);
}

function openSurvey() {
    window.open("https://docs.google.com/forms/d/e/1FAIpQLSdbT4Q5FvtCqOYUZCKknCnr1t1RJTyOiPUusaDfQSo9Z9mtpg/viewform?usp=header", "_blank");
}

// =====================================================
// Profile
// =====================================================
function loadProfile() {
    if (!currentUser) return;

    // Foto de Google o placeholder
    const avatarEl = document.getElementById('profile-avatar');
    const placeholderEl = document.getElementById('profile-avatar-placeholder');
    if (currentUser.picture) {
        avatarEl.src = currentUser.picture;
        avatarEl.classList.remove('hidden');
        placeholderEl.classList.add('hidden');
    }

    // Nombre completo y email en el encabezado
    document.getElementById('profile-full-name').textContent = currentUser.name || '';
    document.getElementById('profile-email-display').textContent = currentUser.email || '';

    // Correo autollenado (readonly)
    document.getElementById('profile-correo').value = currentUser.email || '';

    // Pre-rellenar nombre/apellido desde Google si están disponibles
    const nameParts = (currentUser.name || '').split(' ');
    document.getElementById('profile-nombre').value = nameParts[0] || '';
    document.getElementById('profile-apellido').value = nameParts.slice(1).join(' ') || '';

    // Cargar datos guardados previamente
    const saved = localStorage.getItem('tickimochi_profile');
    if (saved) {
        const data = JSON.parse(saved);
        if (data.nombre)     document.getElementById('profile-nombre').value     = data.nombre;
        if (data.apellido)   document.getElementById('profile-apellido').value   = data.apellido;
        if (data.dni)        document.getElementById('profile-dni').value         = data.dni;
        if (data.nacimiento) document.getElementById('profile-nacimiento').value  = data.nacimiento;
        if (data.ciudad)     document.getElementById('profile-ciudad').value      = data.ciudad;
        if (data.direccion)  document.getElementById('profile-direccion').value   = data.direccion;
        if (data.genero)     document.getElementById('profile-genero').value      = data.genero;
        if (data.avatarUrl) {
            avatarEl.src = data.avatarUrl;
            avatarEl.classList.remove('hidden');
            placeholderEl.classList.add('hidden');
        }
    }
}

function saveProfile() {
    const data = {
        nombre:     document.getElementById('profile-nombre').value,
        apellido:   document.getElementById('profile-apellido').value,
        dni:        document.getElementById('profile-dni').value,
        nacimiento: document.getElementById('profile-nacimiento').value,
        ciudad:     document.getElementById('profile-ciudad').value,
        direccion:  document.getElementById('profile-direccion').value,
        genero:     document.getElementById('profile-genero').value,
        avatarUrl:  document.getElementById('profile-avatar').src || ''
    };
    localStorage.setItem('tickimochi_profile', JSON.stringify(data));

    // Actualizar encabezado con nombre guardado
    const fullName = [data.nombre, data.apellido].filter(Boolean).join(' ');
    if (fullName) {
        document.getElementById('profile-full-name').textContent = fullName;
        document.getElementById('user-name').textContent = data.nombre;
    }

    // Feedback visual en el botón
    const btn = document.querySelector('#profile button[onclick="saveProfile()"]');
    const original = btn.textContent;
    btn.textContent = '✓ Guardado';
    btn.style.background = '#22c55e';
    setTimeout(() => {
        btn.textContent = original;
        btn.style.background = '';
    }, 2000);
}

function previewAvatar(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const avatarEl = document.getElementById('profile-avatar');
        avatarEl.src = e.target.result;
        avatarEl.classList.remove('hidden');
        document.getElementById('profile-avatar-placeholder').classList.add('hidden');
    };
    reader.readAsDataURL(file);
}

// =====================================================
// Init
// =====================================================
document.body.classList.add('loading');

window.onload = () => {
    renderGrids();
    initializeGoogleSignIn();

    const savedUser = localStorage.getItem('tickimochi_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUserUI();
        showSection('profile');
        loadProfile();
    }

    setTimeout(() => {
        document.getElementById('splash').remove();
        if (!currentUser) {
            document.getElementById('loginScreen').classList.remove('hidden');
        }
        document.body.classList.remove('loading');
    }, 2200);
};
