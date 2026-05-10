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
// Profile — carrusel de pasos
// =====================================================
const TOTAL_STEPS = 3;
let currentStep = 0;

const stepLabels = ['Identidad', 'Contacto', 'Confirmar'];

function buildStepIndicators() {
    const container = document.getElementById('step-indicators');
    if (!container) return;
    container.innerHTML = stepLabels.map((label, i) => `
        <div class="flex items-center gap-2" id="step-ind-${i}">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                        ${i === 0 ? 'bg-[#FF2D55] text-white shadow-[0_0_14px_rgba(255,45,85,0.5)]' : 'bg-white/10 text-gray-400'}"
                 id="step-circle-${i}">${i + 1}</div>
            <span class="text-xs font-semibold hidden sm:block ${i === 0 ? 'text-white' : 'text-gray-500'}"
                  id="step-label-${i}">${label}</span>
            ${i < TOTAL_STEPS - 1 ? '<div class="w-8 h-px bg-white/10 mx-1" id="step-line-' + i + '"></div>' : ''}
        </div>
    `).join('');
}

function updateStepIndicators() {
    stepLabels.forEach((_, i) => {
        const circle = document.getElementById(`step-circle-${i}`);
        const label  = document.getElementById(`step-label-${i}`);
        const line   = document.getElementById(`step-line-${i}`);
        if (!circle) return;

        if (i < currentStep) {
            // completado
            circle.className = 'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 bg-green-500 text-white';
            circle.innerHTML = '✓';
            if (label) label.className = 'text-xs font-semibold hidden sm:block text-green-400';
            if (line)  line.className  = 'w-8 h-px bg-green-500/50 mx-1';
        } else if (i === currentStep) {
            // activo
            circle.className = 'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 bg-[#FF2D55] text-white shadow-[0_0_14px_rgba(255,45,85,0.5)]';
            circle.innerHTML = i + 1;
            if (label) label.className = 'text-xs font-semibold hidden sm:block text-white';
        } else {
            // pendiente
            circle.className = 'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 bg-white/10 text-gray-400';
            circle.innerHTML = i + 1;
            if (label) label.className = 'text-xs font-semibold hidden sm:block text-gray-500';
        }
    });
}

function updateStepSlider() {
    const wrapper = document.getElementById('steps-wrapper');
    if (wrapper) wrapper.style.transform = `translateX(-${currentStep * 100}%)`;
}

function updateNavButtons() {
    const backBtn = document.getElementById('step-back-btn');
    const nextBtn = document.getElementById('step-next-btn');
    if (!backBtn || !nextBtn) return;

    backBtn.style.visibility = currentStep === 0 ? 'hidden' : 'visible';

    if (currentStep === TOTAL_STEPS - 1) {
        nextBtn.textContent = '¡Empezar a comprar!';
        nextBtn.style.background = '#22c55e';
        nextBtn.style.boxShadow  = '0 4px 15px rgba(34,197,94,0.35)';
    } else {
        nextBtn.textContent = 'Siguiente';
        nextBtn.style.background = '';
        nextBtn.style.boxShadow  = '';
    }
}

function profileStepNext() {
    if (currentStep === TOTAL_STEPS - 1) {
        // Último paso → guardar y redirigir
        saveProfile();
        return;
    }
    // Validación básica por paso
    if (!validateStep(currentStep)) return;

    // En paso 1 (confirmación), rellenar resumen
    if (currentStep === 1) fillSummary();

    currentStep++;
    updateStepSlider();
    updateStepIndicators();
    updateNavButtons();
}

function profileStepBack() {
    if (currentStep === 0) return;
    currentStep--;
    updateStepSlider();
    updateStepIndicators();
    updateNavButtons();
}

function validateStep(step) {
    const errors = [];
    if (step === 0) {
        if (!document.getElementById('profile-nombre').value.trim()) errors.push('El nombre es requerido.');
        if (!document.getElementById('profile-apellido').value.trim()) errors.push('El apellido es requerido.');
        if (!document.getElementById('profile-dni').value.trim()) errors.push('El DNI es requerido.');
    }
    if (step === 1) {
        if (!document.getElementById('profile-ciudad').value.trim()) errors.push('La ciudad es requerida.');
    }
    if (errors.length) {
        showToast('⚠️ ' + errors[0], '#FF2D55');
        return false;
    }
    return true;
}

function fillSummary() {
    const avatarEl    = document.getElementById('profile-avatar');
    const sumAvatar   = document.getElementById('summary-avatar');
    const sumAvatarPh = document.getElementById('summary-avatar-placeholder');

    if (avatarEl && !avatarEl.classList.contains('hidden') && avatarEl.src) {
        sumAvatar.src = avatarEl.src;
        sumAvatar.classList.remove('hidden');
        sumAvatarPh.classList.add('hidden');
    }

    const nombre   = document.getElementById('profile-nombre').value;
    const apellido = document.getElementById('profile-apellido').value;
    document.getElementById('summary-name').textContent  = [nombre, apellido].filter(Boolean).join(' ') || '—';
    document.getElementById('summary-email').textContent = document.getElementById('profile-correo').value || '—';
    document.getElementById('summary-dni').textContent        = document.getElementById('profile-dni').value        || '—';
    document.getElementById('summary-nacimiento').textContent = document.getElementById('profile-nacimiento').value || '—';
    document.getElementById('summary-ciudad').textContent     = document.getElementById('profile-ciudad').value     || '—';
    document.getElementById('summary-direccion').textContent  = document.getElementById('profile-direccion').value  || '—';
    document.getElementById('summary-genero').textContent     = document.getElementById('profile-genero').value     || '—';
}

function loadProfile() {
    if (!currentUser) return;

    // Reset al paso 1
    currentStep = 0;
    buildStepIndicators();
    updateStepSlider();
    updateStepIndicators();
    updateNavButtons();

    // Foto de Google
    const avatarEl = document.getElementById('profile-avatar');
    const placeholderEl = document.getElementById('profile-avatar-placeholder');
    if (currentUser.picture) {
        avatarEl.src = currentUser.picture;
        avatarEl.classList.remove('hidden');
        placeholderEl.classList.add('hidden');
    }

    // Correo autollenado (readonly)
    document.getElementById('profile-correo').value = currentUser.email || '';

    // Pre-rellenar nombre/apellido desde Google
    const nameParts = (currentUser.name || '').split(' ');
    document.getElementById('profile-nombre').value  = nameParts[0] || '';
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

    // Actualizar navbar
    const fullName = [data.nombre, data.apellido].filter(Boolean).join(' ');
    if (fullName) document.getElementById('user-name').textContent = data.nombre;

    showToast('✓ Perfil guardado. ¡Bienvenido!', '#22c55e');
    setTimeout(() => showSection('home'), 1400);
}

function showToast(message, color = '#22c55e') {
    const existing = document.getElementById('toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed; bottom: 32px; left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: ${color}; color: white;
        padding: 14px 32px; border-radius: 999px;
        font-weight: 700; font-size: 15px; z-index: 9999;
        box-shadow: 0 8px 30px ${color}66;
        opacity: 0; transition: all 0.35s ease; white-space: nowrap;
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    }));
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => toast.remove(), 400);
    }, 1300);
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
