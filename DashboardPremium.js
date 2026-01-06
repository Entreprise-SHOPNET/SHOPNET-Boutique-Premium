

// Configuration de l'API CORRIGÉE
// Configuration de l'API CORRIGÉE
const API_CONFIG = {
    // ✅ Serveur de production Render
    baseUrl: 'https://shopnet-backend.onrender.com/api/boutique/premium',
    
    // 🔹 Serveur local pour développement (décommenter si besoin)
    // baseUrl: 'http://100.64.134.89:5000/api/boutique/premium',
    
    endpoints: {
        pendingBoutiques: '/admin/en-attente',
        validatedBoutiques: '/admin/all-validees',
        changeBoutiqueStatus: (id) => `/admin/${id}/changer-statut`
    }
};


// État global
let currentBoutiques = [];
let filteredBoutiques = [];
let currentPage = 1;
const boutiquesPerPage = 10;
let currentBoutiqueId = null;
let currentBoutiqueData = null;
let activeFilter = 'all';

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 Dashboard Premium initialisé');
    initEventListeners();
    loadAllBoutiques(); // Charge par défaut les boutiques en attente
});

// Initialisation des événements
function initEventListeners() {
    // Recherche en temps réel
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchBoutiques();
            }
        });
        
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(searchBoutiques, 500);
        });
    }

    // Filtres
    const filterStatus = document.getElementById('filter-status');
    if (filterStatus) {
        filterStatus.addEventListener('change', applyFilters);
    }

    const filterPlan = document.getElementById('filter-plan');
    if (filterPlan) {
        filterPlan.addEventListener('change', applyFilters);
    }
    
    const filterDate = document.getElementById('filter-date');
    if (filterDate) {
        filterDate.addEventListener('change', applyFilters);
    }
    
    // Navigation sidebar
    document.querySelectorAll('.sidebar-nav li a').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const filter = this.parentElement.id.replace('nav-', '');
            loadFilteredBoutiques(filter);
        });
    });

    // Boutons de la modale
    document.getElementById('modal-close')?.addEventListener('click', closeModal);
    document.getElementById('image-modal-close')?.addEventListener('click', closeImageModal);
    document.getElementById('rejection-modal-close')?.addEventListener('click', closeRejectionModal);
    document.getElementById('rejection-cancel-btn')?.addEventListener('click', closeRejectionModal);
    document.getElementById('rejection-confirm-btn')?.addEventListener('click', () => rejectBoutique(currentBoutiqueId));
}

// Charger les boutiques selon le filtre
async function loadFilteredBoutiques(filter) {
    console.log(`🔍 Chargement du filtre: ${filter}`);
    
    switch(filter) {
        case 'all':
            await loadAllBoutiques();
            break;
        case 'pending':
            await loadPendingBoutiques();
            break;
        case 'active':
            await loadActiveBoutiques();
            break;
        case 'stats':
            await loadStats();
            break;
        default:
            await loadAllBoutiques();
    }
}

// ======================
// FONCTIONS DE CHARGEMENT DES DONNÉES - CORRIGÉES
// ======================

// Charger toutes les boutiques (en attente)
async function loadAllBoutiques() {
    try {
        showLoading();
        updateNavActive('nav-all');
        updatePageTitle('Demandes en attente', 'Validez ou rejetez les nouvelles demandes');
        
        console.log('🔄 Chargement des boutiques en attente...');
        
        // CORRECTION : Utilisation correcte de l'endpoint
        const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.pendingBoutiques}`, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Statut réponse:', response.status);
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 Données reçues:', data);
        
        if (data.success) {
            // CORRECTION : Vérification de la structure des données
            currentBoutiques = Array.isArray(data.boutiques) ? data.boutiques : [];
            console.log(`✅ Nombre de boutiques chargées: ${currentBoutiques.length}`);
            
            // Debug: afficher la première boutique si disponible
            if (currentBoutiques.length > 0) {
                console.log('🔍 Structure boutique exemple:', JSON.stringify(currentBoutiques[0], null, 2));
            }
            
            filteredBoutiques = [...currentBoutiques];
            renderBoutiques();
            updateStatsDisplay();
            
            showToast('Succès', `${currentBoutiques.length} demandes en attente`, 'success');
        } else {
            throw new Error(data.message || 'Erreur lors du chargement');
        }
    } catch (error) {
        console.error('❌ Erreur loadAllBoutiques:', error);
        showToast('Erreur', 'Impossible de charger les demandes: ' + error.message, 'error');
        currentBoutiques = [];
        filteredBoutiques = [];
        renderBoutiques();
    } finally {
        hideLoading();
    }
}

// Charger les demandes en attente - Fonction d'alias (même que loadAllBoutiques)
async function loadPendingBoutiques() {
    // Même fonction que loadAllBoutiques car même endpoint
    await loadAllBoutiques();
    updateNavActive('nav-pending');
    updatePageTitle('Demandes en attente', 'Validez ou rejetez les nouvelles demandes');
}

// Charger les boutiques actives (validées)
async function loadActiveBoutiques() {
    try {
        showLoading();
        updateNavActive('nav-active');
        updatePageTitle('Boutiques Premium Actives', 'Consultez les boutiques premium validées');
        
        console.log('🔄 Chargement des boutiques validées...');
        
        // CORRECTION : Utilisation de l'endpoint correct
        const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.validatedBoutiques}`, {
            headers: { 
                'Content-Type': 'application/json' 
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            currentBoutiques = Array.isArray(data.boutiques) ? data.boutiques : [];
            console.log(`✅ Nombre de boutiques actives: ${currentBoutiques.length}`);
            
            filteredBoutiques = [...currentBoutiques];
            renderBoutiques();
            updateStatsDisplay();
            
            showToast('Succès', `${currentBoutiques.length} boutiques actives`, 'success');
        } else {
            throw new Error(data.message || 'Erreur lors du chargement');
        }
    } catch (error) {
        console.error('❌ Erreur loadActiveBoutiques:', error);
        showToast('Erreur', 'Impossible de charger les boutiques actives: ' + error.message, 'error');
        currentBoutiques = [];
        filteredBoutiques = [];
        renderBoutiques();
    } finally {
        hideLoading();
    }
}

// Charger les statistiques
async function loadStats() {
    try {
        showLoading();
        updateNavActive('nav-stats');
        updatePageTitle('Statistiques Premium', 'Tableau de bord des boutiques premium');
        
        // Charger les données pour calculer les stats
        const pendingResponse = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.pendingBoutiques}`);
        const activeResponse = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.validatedBoutiques}`);
        
        let pendingData = { boutiques: [] };
        let activeData = { boutiques: [] };
        
        if (pendingResponse.ok) pendingData = await pendingResponse.json();
        if (activeResponse.ok) activeData = await activeResponse.json();
        
        // Calculer les statistiques
        const stats = {
            pending: pendingData.boutiques?.length || 0,
            active: activeData.boutiques?.length || 0,
            total: (pendingData.boutiques?.length || 0) + (activeData.boutiques?.length || 0)
        };
        
        displayStats(stats);
        
    } catch (error) {
        console.error('❌ Erreur loadStats:', error);
        showToast('Erreur', 'Impossible de charger les statistiques: ' + error.message, 'error');
        displayStats({ pending: 0, active: 0, total: 0 });
    } finally {
        hideLoading();
    }
}

// Afficher les statistiques
function displayStats(stats) {
    const statsHtml = `
        <div class="stats-grid">
            <div class="stat-card-large">
                <h3><i class="fas fa-chart-bar"></i> Statistiques Premium</h3>
                <div class="stat-item">
                    <span>Total des demandes :</span>
                    <strong>${stats.total || 0}</strong>
                </div>
                <div class="stat-item">
                    <span>En attente de validation :</span>
                    <strong class="pending">${stats.pending || 0}</strong>
                </div>
                <div class="stat-item">
                    <span>Boutiques actives :</span>
                    <strong class="active">${stats.active || 0}</strong>
                </div>
                <div class="stat-item">
                    <span>Taux d'activation :</span>
                    <strong>${stats.total ? Math.round((stats.active / stats.total) * 100) : 0}%</strong>
                </div>
            </div>
            
            <div class="stat-card-large">
                <h3><i class="fas fa-money-bill-wave"></i> Revenus estimés</h3>
                <div class="stat-item">
                    <span>Revenus mensuels :</span>
                    <strong>${formatCurrency((stats.active || 0) * 9.99)} USD</strong>
                </div>
                <div class="stat-item">
                    <span>Revenus annuels :</span>
                    <strong>${formatCurrency((stats.active || 0) * 9.99 * 12)} USD</strong>
                </div>
            </div>
        </div>
    `;
    
    const tableBody = document.getElementById('boutiques-body');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div style="padding: 20px;">
                        ${statsHtml}
                    </div>
                </td>
            </tr>
        `;
    }
    
    updateResultsCount('Statistiques affichées');
}

// ======================
// FONCTIONS D'AFFICHAGE ET RENDU - CORRIGÉES
// ======================

// Afficher les boutiques dans le tableau
function renderBoutiques() {
    const tableBody = document.getElementById('boutiques-body');
    
    if (!tableBody) {
        console.error('❌ Élément #boutiques-body non trouvé');
        return;
    }
    
    // Vérifier si currentBoutiques est défini
    if (!Array.isArray(currentBoutiques) || currentBoutiques.length === 0) {
        console.log('ℹ️ Aucune boutique à afficher');
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 50px;">
                    <div class="empty-state">
                        <i class="fas fa-store" style="font-size: 48px; margin-bottom: 20px; color: #999;"></i>
                        <p>Aucune demande trouvée</p>
                        <button onclick="refreshAll()" style="margin-top: 15px; padding: 8px 16px; background-color: #00182A; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            <i class="fas fa-sync-alt"></i> Réessayer
                        </button>
                    </div>
                </td>
            </tr>
        `;
        updatePagination();
        updateResultsCount('0 résultat');
        return;
    }
    
    // Calcul des éléments à afficher
    const startIndex = (currentPage - 1) * boutiquesPerPage;
    const endIndex = startIndex + boutiquesPerPage;
    const pageBoutiques = currentBoutiques.slice(startIndex, endIndex);
    
    console.log(`📊 Rendu de ${pageBoutiques.length} boutiques sur la page ${currentPage}`);
    
    // Génération du HTML
    let html = '';
    
    pageBoutiques.forEach(boutique => {
        // Gestion des propriétés avec valeurs par défaut
        const status = boutique.statut || 'pending_validation';
        const statusClass = getStatusClass(status);
        const statusText = getStatusText(status);
        
        // Propriétaire
        const ownerName = boutique.fullName || boutique.utilisateur_nom || 'Non spécifié';
        const ownerEmail = boutique.email || '';
        const ownerPhone = boutique.phone || '';
        
        // Paiement
        const transactionCode = boutique.transaction_id || boutique.reference || 'N/A';
        const montant = boutique.montant || 9.99;
        const devise = boutique.devise || 'USD';
        const operateur = boutique.operateur || 'Non spécifié';
        
        // Date
        const date = boutique.date_creation || boutique.created_at || new Date().toISOString();
        
        // Logo sécurisé
        const logoUrl = boutique.logo || '';
        const logoHtml = logoUrl ? 
            `<img src="${logoUrl}" class="boutique-avatar" alt="${boutique.nom || ''}" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"40\" height=\"40\" viewBox=\"0 0 40 40\"><rect width=\"40\" height=\"40\" fill=\"%23f0f0f0\"/><text x=\"20\" y=\"22\" font-size=\"16\" text-anchor=\"middle\" fill=\"%23999\">🏪</text></svg>'">` :
            `<div class="boutique-avatar"><i class="fas fa-store"></i></div>`;
        
        // Déterminer les actions disponibles
        let actionsHtml = '';
        if (status === 'pending_validation') {
            actionsHtml = `
                <button class="action-btn view-btn" onclick="viewBoutique('${boutique.id}')" title="Voir les détails">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn validate-btn-small" onclick="validateBoutique('${boutique.id}')" title="Valider">
                    <i class="fas fa-check"></i>
                </button>
                <button class="action-btn reject-btn-small" onclick="showRejectionModal('${boutique.id}')" title="Rejeter">
                    <i class="fas fa-times"></i>
                </button>
            `;
        } else if (status === 'validé') {
            actionsHtml = `
                <button class="action-btn view-btn" onclick="viewBoutique('${boutique.id}')" title="Voir les détails">
                    <i class="fas fa-eye"></i>
                </button>
            `;
        }
        
        html += `
            <tr>
                <td>${boutique.id || 'N/A'}</td>
                <td>
                    <div class="boutique-cell">
                        ${logoHtml}
                        <div class="boutique-info">
                            <span class="boutique-name">${boutique.nom || 'Sans nom'}</span>
                            <span class="boutique-category">${boutique.categorie || 'Non catégorisé'}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="owner-cell">
                        <span class="owner-name">${ownerName}</span>
                        <span class="owner-email">${ownerEmail}</span>
                        <span class="owner-phone">${ownerPhone}</span>
                    </div>
                </td>
                <td><span class="plan-badge premium">Premium</span></td>
                <td><strong>${formatCurrency(montant)} ${devise}</strong></td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${formatDate(date)}</td>
                <td>
                    <div class="actions-cell">
                        ${actionsHtml}
                    </div>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
    updatePagination();
    updateResultsCount(`${currentBoutiques.length} résultat${currentBoutiques.length > 1 ? 's' : ''}`);
}

// Rechercher des boutiques
function searchBoutiques() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (!searchTerm) {
        // Si la recherche est vide, réinitialiser
        filteredBoutiques = [...currentBoutiques];
        currentPage = 1;
        renderBoutiques();
        return;
    }
    
    try {
        showLoading();
        
        // Filtrage côté client
        filteredBoutiques = currentBoutiques.filter(boutique => {
            const nom = (boutique.nom || '').toLowerCase();
            const ownerName = (boutique.fullName || '').toLowerCase();
            const email = (boutique.email || '').toLowerCase();
            const phone = (boutique.phone || '');
            const categorie = (boutique.categorie || '').toLowerCase();
            
            return (
                nom.includes(searchTerm) ||
                ownerName.includes(searchTerm) ||
                email.includes(searchTerm) ||
                phone.includes(searchTerm) ||
                categorie.includes(searchTerm)
            );
        });
        
        currentPage = 1;
        renderBoutiques();
        
    } catch (error) {
        console.error('❌ Erreur searchBoutiques:', error);
        showToast('Erreur', 'Impossible de rechercher les boutiques', 'error');
    } finally {
        hideLoading();
    }
}

// Appliquer les filtres
function applyFilters() {
    const status = document.getElementById('filter-status')?.value;
    const plan = document.getElementById('filter-plan')?.value;
    const dateFilter = document.getElementById('filter-date')?.value;
    
    filteredBoutiques = currentBoutiques.filter(boutique => {
        // Filtre par statut
        if (status && status !== '') {
            if (boutique.statut !== status) {
                return false;
            }
        }
        
        // Filtre par plan (toujours premium)
        if (plan && plan !== 'premium') {
            return false;
        }
        
        // Filtre par date
        if (dateFilter && dateFilter !== '') {
            const boutiqueDate = new Date(boutique.date_creation || boutique.created_at);
            const now = new Date();
            
            switch(dateFilter) {
                case 'today':
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    if (boutiqueDate < today) return false;
                    break;
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    if (boutiqueDate < weekAgo) return false;
                    break;
                case 'month':
                    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                    if (boutiqueDate < monthAgo) return false;
                    break;
            }
        }
        
        return true;
    });
    
    currentPage = 1;
    renderBoutiques();
}

// ======================
// FONCTIONS DE GESTION DES BOUTIQUES
// ======================

// Voir les détails d'une boutique
async function viewBoutique(boutiqueId) {
    try {
        showLoading();
        
        const boutique = currentBoutiques.find(b => b.id == boutiqueId);
        
        if (boutique) {
            currentBoutiqueId = boutiqueId;
            currentBoutiqueData = boutique;
            populateModal(boutique);
            openModal();
        } else {
            showToast('Erreur', 'Boutique non trouvée', 'error');
        }
    } catch (error) {
        console.error('❌ Erreur viewBoutique:', error);
        showToast('Erreur', 'Impossible de charger les détails', 'error');
    } finally {
        hideLoading();
    }
}

// Remplir la modale avec les données
function populateModal(boutique) {
    console.log('📝 Remplissage modal avec:', boutique);
    
    // Informations de la boutique
    document.getElementById('modal-boutique-id').textContent = boutique.id || 'N/A';
    document.getElementById('modal-boutique-name-full').textContent = boutique.nom || 'Sans nom';
    document.getElementById('modal-boutique-name').textContent = boutique.nom || 'Sans nom';
    document.getElementById('modal-boutique-description').textContent = boutique.description || 'Non spécifié';
    document.getElementById('modal-boutique-category').textContent = boutique.categorie || 'Non catégorisé';
    document.getElementById('modal-boutique-plan').textContent = 'Premium';
    document.getElementById('modal-boutique-plan').className = 'plan-badge premium';
    document.getElementById('modal-boutique-created').textContent = formatDate(boutique.date_creation);
    
    // Informations du propriétaire
    document.getElementById('modal-owner-name').textContent = boutique.fullName || 'Non spécifié';
    document.getElementById('modal-owner-email').textContent = boutique.email || 'Non spécifié';
    document.getElementById('modal-owner-phone').textContent = boutique.phone || 'Non spécifié';
    document.getElementById('modal-owner-id').textContent = boutique.utilisateur_id || 'N/A';
    
    // Détails du paiement
    document.getElementById('modal-payment-amount').textContent = formatCurrency(boutique.montant || 9.99) + ' ' + (boutique.devise || 'USD');
    document.getElementById('modal-payment-currency').textContent = boutique.devise || 'USD';
    document.getElementById('modal-transaction-code').textContent = boutique.transaction_id || 'N/A';
    document.getElementById('modal-payment-operator').textContent = getOperatorText(boutique.operateur);
    document.getElementById('modal-payment-status').textContent = getPaymentStatusText(boutique.statut || 'pending');
    document.getElementById('modal-payment-status').className = `status-badge ${getPaymentStatusClass(boutique.statut || 'pending')}`;
    document.getElementById('modal-payment-date').textContent = formatDate(boutique.date_paiement);
    
    // Preuve de paiement
    const proofImg = document.getElementById('proof-img');
    const proofOverlay = document.querySelector('.proof-overlay');
    const paymentProofSection = document.getElementById('payment-proof-section');
    
    if (boutique.preuve_url) {
        proofImg.src = boutique.preuve_url;
        proofImg.style.display = 'block';
        if (proofOverlay) proofOverlay.style.display = 'flex';
        if (paymentProofSection) paymentProofSection.style.display = 'block';
    } else {
        proofImg.src = '';
        proofImg.style.display = 'none';
        if (proofOverlay) proofOverlay.style.display = 'none';
        if (paymentProofSection) paymentProofSection.style.display = 'none';
    }
    
    // Afficher/masquer la section de validation selon le statut
    const validationSection = document.getElementById('validation-section');
    const status = boutique.statut;
    
    if (status === 'pending_validation') {
        if (validationSection) validationSection.style.display = 'block';
        const notesField = document.getElementById('validation-notes');
        if (notesField) notesField.value = '';
    } else {
        if (validationSection) validationSection.style.display = 'none';
    }
    
    // Mettre à jour le statut actuel
    updateStatusSection(boutique);
}

// Valider une boutique
async function validateBoutique(boutiqueId = null) {
    const id = boutiqueId || currentBoutiqueId;
    if (!id) {
        showToast('Erreur', 'ID boutique manquant', 'error');
        return;
    }
    
    const notes = document.getElementById('validation-notes')?.value.trim() || 'Boutique validée par l\'admin';
    
    if (!confirm('Êtes-vous sûr de vouloir valider cette boutique premium ?')) {
        return;
    }
    
    try {
        showLoading();
        
        console.log(`✅ Validation de la boutique ${id}`);
        
        const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.changeBoutiqueStatus(id)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'valider',
                notes: notes
            })
        });
        
        console.log('📡 Réponse validation:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Succès', 'Boutique validée avec succès', 'success');
            closeModal();
            refreshAll();
        } else {
            throw new Error(data.message || 'Erreur lors de la validation');
        }
    } catch (error) {
        console.error('❌ Erreur validateBoutique:', error);
        showToast('Erreur', error.message || 'Impossible de valider la boutique', 'error');
    } finally {
        hideLoading();
    }
}

// Afficher la modale de rejet
function showRejectionModal(boutiqueId) {
    currentBoutiqueId = boutiqueId;
    const modal = document.getElementById('rejection-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Rejeter une boutique
async function rejectBoutique(boutiqueId = null) {
    const id = boutiqueId || currentBoutiqueId;
    if (!id) {
        showToast('Erreur', 'ID boutique manquant', 'error');
        return;
    }
    
    const notesElement = document.getElementById('rejection-notes');
    const notes = notesElement?.value.trim() || 'Boutique rejetée par l\'admin';
    
    if (!notes) {
        showToast('Erreur', 'Veuillez fournir une raison pour le rejet', 'error');
        return;
    }
    
    if (!confirm('Êtes-vous sûr de vouloir rejeter cette demande ?')) {
        return;
    }
    
    try {
        showLoading();
        
        console.log(`❌ Rejet de la boutique ${id}`);
        
        const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.changeBoutiqueStatus(id)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'rejeter',
                notes: notes
            })
        });
        
        console.log('📡 Réponse rejet:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Succès', 'Demande rejetée avec succès', 'warning');
            closeModal();
            closeRejectionModal();
            refreshAll();
        } else {
            throw new Error(data.message || 'Erreur lors du rejet');
        }
    } catch (error) {
        console.error('❌ Erreur rejectBoutique:', error);
        showToast('Erreur', error.message || 'Impossible de rejeter la demande', 'error');
    } finally {
        hideLoading();
        if (notesElement) notesElement.value = '';
    }
}

// Rafraîchir toutes les données
async function refreshAll() {
    console.log('🔄 Rafraîchissement des données');
    
    switch(activeFilter) {
        case 'all':
        case 'pending':
            await loadAllBoutiques();
            break;
        case 'active':
            await loadActiveBoutiques();
            break;
        case 'stats':
            await loadStats();
            break;
        default:
            await loadAllBoutiques();
    }
}

// Mettre à jour l'affichage des statistiques
function updateStatsDisplay() {
    try {
        // Calculer les statistiques depuis les données actuelles
        const pendingValidation = currentBoutiques.filter(b => b.statut === 'pending_validation').length;
        const active = currentBoutiques.filter(b => b.statut === 'validé').length;
        const total = currentBoutiques.length;
        
        // Mettre à jour les compteurs
        const totalPendingEl = document.getElementById('total-pending');
        const totalActiveEl = document.getElementById('total-active');
        const totalRevenueEl = document.getElementById('total-revenue');
        
        if (totalPendingEl) totalPendingEl.textContent = pendingValidation;
        if (totalActiveEl) totalActiveEl.textContent = active;
        if (totalRevenueEl) totalRevenueEl.textContent = formatCurrency(active * 9.99) + '$';
        
        // Mettre à jour le badge
        const pendingCountEl = document.getElementById('pending-count');
        if (pendingCountEl) pendingCountEl.textContent = pendingValidation;
        
    } catch (error) {
        console.error('❌ Erreur updateStatsDisplay:', error);
    }
}

// ======================
// FONCTIONS UTILITAIRES
// ======================

// Mise à jour de la pagination
function updatePagination() {
    const totalPages = Math.ceil(currentBoutiques.length / boutiquesPerPage);
    
    const pageInfo = document.getElementById('page-info');
    const prevPage = document.getElementById('prev-page');
    const nextPage = document.getElementById('next-page');
    
    if (pageInfo) pageInfo.textContent = `Page ${currentPage} sur ${totalPages}`;
    if (prevPage) prevPage.disabled = currentPage === 1;
    if (nextPage) nextPage.disabled = currentPage === totalPages || totalPages === 0;
}

// Changer de page
function changePage(direction) {
    const totalPages = Math.ceil(currentBoutiques.length / boutiquesPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderBoutiques();
    }
}

// Mettre à jour le compte de résultats
function updateResultsCount(text) {
    const resultsCount = document.getElementById('results-count');
    if (resultsCount) {
        resultsCount.textContent = text;
    }
}

// Mettre à jour le titre de la page
function updatePageTitle(title, subtitle) {
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');
    
    if (pageTitle) pageTitle.textContent = title;
    if (pageSubtitle) pageSubtitle.textContent = subtitle;
}

// Mettre à jour la navigation active
function updateNavActive(navId) {
    // Retirer la classe active de tous les éléments
    document.querySelectorAll('.sidebar-nav li').forEach(li => {
        li.classList.remove('active');
    });
    
    // Ajouter la classe active à l'élément sélectionné
    const navElement = document.getElementById(navId);
    if (navElement) {
        navElement.classList.add('active');
        activeFilter = navId.replace('nav-', '');
    }
}

// Fonctions de formatage
function formatCurrency(amount) {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0.00';
    
    return num.toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateString;
    }
}

// Fonctions de statut
function getStatusClass(status) {
    if (!status) return 'pending';
    
    const statutLower = status.toLowerCase();
    if (statutLower.includes('pending_validation') || statutLower.includes('pending')) return 'pending';
    if (statutLower.includes('validé') || statutLower.includes('active')) return 'active';
    if (statutLower.includes('rejeté') || statutLower.includes('rejected')) return 'rejected';
    return 'pending';
}

function getStatusText(status) {
    if (!status) return 'En attente';
    
    const statutLower = status.toLowerCase();
    if (statutLower.includes('pending_validation') || statutLower.includes('pending')) return 'En attente';
    if (statutLower.includes('validé') || statutLower.includes('active')) return 'Active';
    if (statutLower.includes('rejeté') || statutLower.includes('rejected')) return 'Rejetée';
    return status;
}

function getPaymentStatusClass(status) {
    if (!status) return 'pending';
    
    const statutLower = status.toLowerCase();
    if (statutLower.includes('pending')) return 'pending';
    if (statutLower.includes('validated') || statutLower.includes('paid')) return 'active';
    if (statutLower.includes('rejected')) return 'rejected';
    return 'pending';
}

function getPaymentStatusText(status) {
    if (!status) return 'En attente';
    
    const statutLower = status.toLowerCase();
    if (statutLower.includes('pending')) return 'En attente';
    if (statutLower.includes('validated') || statutLower.includes('paid')) return 'Validé';
    if (statutLower.includes('rejected')) return 'Rejeté';
    return status;
}

function getOperatorText(operator) {
    if (!operator) return 'Non spécifié';
    
    const op = operator.toLowerCase();
    if (op.includes('airtel')) return 'Airtel Money';
    if (op.includes('orange')) return 'Orange Money';
    if (op.includes('vodacom')) return 'Vodacom M-Pesa';
    if (op.includes('mpesa')) return 'M-Pesa';
    return operator;
}

// ======================
// GESTION DES MODALES
// ======================

function openModal() {
    const modal = document.getElementById('boutique-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modal = document.getElementById('boutique-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    currentBoutiqueId = null;
    currentBoutiqueData = null;
}

function closeRejectionModal() {
    const modal = document.getElementById('rejection-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        const notesElement = document.getElementById('rejection-notes');
        if (notesElement) notesElement.value = '';
    }
}

function viewFullImage() {
    const imgSrc = document.getElementById('proof-img').src;
    if (imgSrc) {
        const fullscreenImg = document.getElementById('fullscreen-image');
        const imageModal = document.getElementById('image-modal');
        
        if (fullscreenImg && imageModal) {
            fullscreenImg.src = imgSrc;
            imageModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }
}

function closeImageModal() {
    const imageModal = document.getElementById('image-modal');
    if (imageModal) {
        imageModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function downloadProof() {
    const imgSrc = document.getElementById('proof-img').src;
    if (imgSrc && imgSrc !== '') {
        const link = document.createElement('a');
        link.href = imgSrc;
        link.download = `preuve-paiement-${currentBoutiqueId || 'unknown'}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        showToast('Téléchargement', 'Aucune preuve de paiement disponible', 'warning');
    }
}

// Mettre à jour la section statut (pour la modale)
function updateStatusSection(boutique) {
    const statusIndicator = document.querySelector('.status-indicator');
    const statusHistoryList = document.getElementById('status-history-list');
    
    if (statusIndicator) {
        statusIndicator.className = `status-indicator ${getStatusClass(boutique.statut)}`;
        statusIndicator.innerHTML = `
            <i class="fas ${getStatusIcon(boutique.statut)}"></i>
            <span>${getStatusText(boutique.statut)}</span>
        `;
    }
    
    if (statusHistoryList) {
        statusHistoryList.innerHTML = `
            <li>
                <span>${getStatusText(boutique.statut)}</span>
                <span class="status-history-date">${formatDate(boutique.date_creation)}</span>
            </li>
        `;
    }
}

function getStatusIcon(status) {
    if (!status) return 'fa-clock';
    
    const statutLower = status.toLowerCase();
    if (statutLower.includes('pending_validation') || statutLower.includes('pending')) {
        return 'fa-clock';
    }
    if (statutLower.includes('validé') || statutLower.includes('active')) {
        return 'fa-check-circle';
    }
    if (statutLower.includes('rejeté') || statutLower.includes('rejected')) {
        return 'fa-times-circle';
    }
    return 'fa-question-circle';
}

// ======================
// NOTIFICATIONS ET CHARGEMENT
// ======================

function showToast(title, message, type = 'success') {
    const toast = document.getElementById('notification-toast');
    if (!toast) {
        console.warn('Toast notification element not found');
        return;
    }
    
    const icon = toast.querySelector('i');
    const messageSpan = toast.querySelector('.toast-message');
    
    let iconClass = 'fa-check-circle';
    if (type === 'error') iconClass = 'fa-times-circle';
    if (type === 'warning') iconClass = 'fa-exclamation-triangle';
    if (type === 'info') iconClass = 'fa-info-circle';
    
    if (icon) icon.className = `fas ${iconClass}`;
    if (messageSpan) messageSpan.textContent = `${title}: ${message}`;
    
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    // Masquage automatique
    setTimeout(() => {
        hideToast();
    }, 5000);
}

function hideToast() {
    const toast = document.getElementById('notification-toast');
    if (toast) {
        toast.classList.remove('show');
    }
}

function showLoading() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function hideLoading() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Déconnexion
function logout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        window.location.href = '/admin-login.html';
    }
}

// ======================
// EXPORT DES FONCTIONS GLOBALES
// ======================

window.loadAllBoutiques = loadAllBoutiques;
window.loadPendingBoutiques = loadPendingBoutiques;
window.loadActiveBoutiques = loadActiveBoutiques;
window.loadStats = loadStats;
window.searchBoutiques = searchBoutiques;
window.applyFilters = applyFilters;
window.refreshAll = refreshAll;
window.viewBoutique = viewBoutique;
window.validateBoutique = validateBoutique;
window.showRejectionModal = showRejectionModal;
window.rejectBoutique = rejectBoutique;
window.viewFullImage = viewFullImage;
window.downloadProof = downloadProof;
window.closeModal = closeModal;
window.closeRejectionModal = closeRejectionModal;
window.closeImageModal = closeImageModal;
window.hideToast = hideToast;
window.changePage = changePage;
window.logout = logout;