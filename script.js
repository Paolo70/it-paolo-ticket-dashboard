// --- Mock Data ---
let tickets = [];
let translations = {};
let currentTicketId = null;

// --- DOM Elements ---
const tableBody = document.getElementById('ticketTableBody');
const statusFilter = document.getElementById('statusFilter');
const btnNewTicket = document.getElementById('btnNewTicket');
const navDashboard = document.getElementById('navDashboard');
const navSettings = document.getElementById('navSettings');
const userProfileTrigger = document.getElementById('userProfileTrigger');
const userDropdown = document.getElementById('userDropdown');
const btnLogout = document.getElementById('btnLogout');

// Views
const listView = document.getElementById('listView');
const detailView = document.getElementById('detailView');
const settingsView = document.getElementById('settingsView');
const btnBack = document.getElementById('btnBack');

// Detail Elements
const detailTitle = document.getElementById('detailTitle');
const detailId = document.getElementById('detailId');
const detailDesc = document.getElementById('detailDesc');
const detailStatus = document.getElementById('detailStatus');
const detailPriority = document.getElementById('detailPriority');
const detailAssigned = document.getElementById('detailAssigned');
const detailRequester = document.getElementById('detailRequester');
const detailDate = document.getElementById('detailDate');
const detailProgress = document.getElementById('detailProgress');
const detailProgressValue = document.getElementById('detailProgressValue');
const btnSave = document.getElementById('btnSave');
const btnSaveSettings = document.getElementById('btnSaveSettings');

// --- Functions ---

// CSV Parser: Converte il testo CSV in array di oggetti
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
        const values = [];
        let currentVal = '';
        let inQuotes = false;

        // Parsing robusto per gestire le virgole dentro le descrizioni
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(currentVal.trim());
                currentVal = '';
            } else {
                currentVal += char;
            }
        }
        values.push(currentVal.trim()); // Push ultimo valore

        // Crea oggetto mappando header -> valore
        const entry = {};
        headers.forEach((header, index) => {
            // Rimuovi eventuali virgolette residue dai valori
            let val = values[index] || '';
            entry[header] = val.replace(/^"|"$/g, ''); 
        });
        return entry;
    });
}

// Carica dati dal file esterno
async function loadTickets() {
    try {
        const response = await fetch('tickets.csv');
        if (!response.ok) throw new Error('Impossibile caricare il file CSV');
        const data = await response.text();
        tickets = parseCSV(data);
        renderTable(tickets);
    } catch (error) {
        console.error("Errore:", error);
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red; padding:2rem;">Errore caricamento dati (Usa Live Server): ${error.message}</td></tr>`;
    }
}

// Helper: Ottieni classe CSS per la priorità
function getPriorityClass(priority) {
    switch(priority) {
        case 'Alta': return 'prio-alta';
        case 'Media': return 'prio-media';
        case 'Bassa': return 'prio-bassa';
        default: return 'prio-bassa';
    }
}

// Helper: Ottieni classe CSS per lo stato (slugify semplice)
function getStatusClass(status) {
    return 'status-' + status.toLowerCase().replace(' ', '-');
}

// Helper: Mappa per ordinare le priorità correttamente
const priorityOrder = { 'Alta': 3, 'Media': 2, 'Bassa': 1 };
let currentSort = { column: null, direction: 'asc' };

// Funzione di ordinamento
function sortTable(column) {
    // Inverti direzione se clicchi sulla stessa colonna
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }

    // Aggiorna icone UI
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.classList.remove('asc', 'desc');
        if (th.dataset.sort === column) {
            th.classList.add(currentSort.direction);
        }
    });

    // Ordina l'array tickets
    tickets.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];

        // Gestione specifica per la priorità
        if (column === 'priority') {
            valA = priorityOrder[valA] || 0;
            valB = priorityOrder[valB] || 0;
        }

        if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Riapplica i filtri (che useranno l'array appena ordinato)
    filterTickets();
}

// Render Table
function renderTable(data) {
    tableBody.innerHTML = ''; // Pulisce il contenuto esistente

    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">Nessun ticket trovato</td></tr>';
        return;
    }

    data.forEach(ticket => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td style="font-family: monospace; font-weight: 600;">#${ticket.id}</td>
            <td style="font-weight: 500;">${ticket.title}</td>
            <td>${ticket.requester}</td>
            <td><span class="badge ${getStatusClass(ticket.status)}">${ticket.status}</span></td>
            <td>
                <div style="display:flex; align-items:center;">
                    <span class="priority-dot ${getPriorityClass(ticket.priority)}"></span>
                    ${ticket.priority}
                </div>
            </td>
            <td style="color: var(--text-muted);">${ticket.date}</td>
            <td>
                <div style="display:flex; align-items:center; gap:8px;">
                    <progress value="${ticket.progress || 0}" max="100" style="width: 60px; height: 8px;"></progress>
                    <span style="font-size: 0.8rem; min-width: 30px;">${ticket.progress || 0}%</span>
                </div>
            </td>
        `;
        
        // Aggiungi evento click alla riga
        row.addEventListener('click', () => openTicketDetail(ticket));
        
        tableBody.appendChild(row);
    });
}

// Filter Logic
function filterTickets() {
    const selectedStatus = statusFilter.value;
    
    if (selectedStatus === 'all') {
        renderTable(tickets);
    } else {
        const filtered = tickets.filter(t => t.status === selectedStatus);
        renderTable(filtered);
    }
}

// New Ticket Action (Mock)
function createNewTicket() {
    alert("Funzionalità 'Nuovo Ticket': Qui si aprirebbe una modale per l'inserimento dati.");
}

// Open Detail View
function openTicketDetail(ticket) {
    currentTicketId = ticket.id; // Memorizza l'ID del ticket corrente

    // Popola i campi
    detailTitle.textContent = ticket.title;
    detailId.textContent = '#' + ticket.id;
    detailDesc.value = ticket.description || '';
    detailStatus.value = ticket.status;
    detailPriority.value = ticket.priority;
    detailAssigned.value = ticket.assignedTo || '';
    detailRequester.value = ticket.requester;
    detailDate.value = ticket.date;
    detailProgress.value = ticket.progress || 0;
    detailProgressValue.textContent = (ticket.progress || 0) + '%';

    // Switch view
    listView.classList.add('hidden');
    detailView.classList.remove('hidden');
    settingsView.classList.add('hidden');
}

// Close Detail View
function closeTicketDetail() {
    detailView.classList.add('hidden');
    settingsView.classList.add('hidden');
    listView.classList.remove('hidden');
}

// Navigation Functions
function showDashboard(e) {
    if(e) e.preventDefault();
    listView.classList.remove('hidden');
    detailView.classList.add('hidden');
    settingsView.classList.add('hidden');
    
    navDashboard.classList.add('active');
    navSettings.classList.remove('active');
}

function showSettings(e) {
    if(e) e.preventDefault();
    listView.classList.add('hidden');
    detailView.classList.add('hidden');
    settingsView.classList.remove('hidden');

    navDashboard.classList.remove('active');
    navSettings.classList.add('active');
}

// Save Ticket & Update CSV
function saveTicketChanges() {
    const ticketIndex = tickets.findIndex(t => t.id === currentTicketId);
    
    if (ticketIndex > -1) {
        // 1. Aggiorna l'oggetto in memoria
        tickets[ticketIndex].description = detailDesc.value;
        tickets[ticketIndex].status = detailStatus.value;
        tickets[ticketIndex].priority = detailPriority.value;
        tickets[ticketIndex].assignedTo = detailAssigned.value;
        tickets[ticketIndex].progress = detailProgress.value;

        // 2. Aggiorna la tabella (UI)
        renderTable(tickets);

        // 3. Genera e scarica il nuovo CSV
        downloadCSV(tickets);

        alert('Modifiche salvate! Il file CSV aggiornato è stato scaricato.');
        closeTicketDetail();
    }
}

// Helper: Genera e scarica CSV
function downloadCSV(data) {
    const headers = ['id', 'title', 'requester', 'status', 'priority', 'date', 'assignedTo', 'description', 'progress'];
    
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
        const values = headers.map(header => {
            const val = (row[header] || '').toString().replace(/"/g, '""'); // Escape quotes
            return `"${val}"`; // Wrap in quotes
        });
        csvRows.push(values.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tickets.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}

// Load Translations
async function loadTranslations() {
    try {
        const response = await fetch('translations.json');
        translations = await response.json();
    } catch (e) {
        console.error("Errore caricamento traduzioni", e);
    }
}

// Apply Language
function applyLanguage(lang) {
    if (!translations[lang]) return;
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });
    
    // Gestione placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
    });
}

// Apply Theme Logic
function applyTheme(theme) {
    const body = document.body;
    body.classList.remove('dark-theme');
    
    if (theme === 'dark') {
        body.classList.add('dark-theme');
    } else if (theme === 'auto') {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            body.classList.add('dark-theme');
        }
    }
}

// Load Settings from JSON
async function loadSettings() {
    try {
        const response = await fetch('settings.json');
        if (!response.ok) throw new Error('Impossibile caricare settings.json');
        const settings = await response.json();

        // Applica i valori alla UI
        document.getElementById('setLang').value = settings.language || 'it';
        document.getElementById('setDate').value = settings.dateFormat || 'dmy';
        document.getElementById('setNum').value = settings.numberFormat || 'eu';
        document.getElementById('setTimezone').value = settings.timezone || 'rome';
        document.getElementById('setTheme').value = settings.theme || 'light';
        
        // Applica il tema caricato
        applyTheme(settings.theme || 'light');
        
        // Applica la lingua caricata
        applyLanguage(settings.language || 'it');
        
        // Gestione checkbox annidati
        document.getElementById('notifEmail').checked = settings.notifications?.email ?? true;
        document.getElementById('notifStatus').checked = settings.notifications?.statusChange ?? true;
    } catch (error) {
        console.error("Errore caricamento impostazioni:", error);
    }
}

// Save Settings to JSON
function saveSettings() {
    const settings = {
        language: document.getElementById('setLang').value,
        dateFormat: document.getElementById('setDate').value,
        numberFormat: document.getElementById('setNum').value,
        timezone: document.getElementById('setTimezone').value,
        theme: document.getElementById('setTheme').value,
        notifications: {
            email: document.getElementById('notifEmail').checked,
            statusChange: document.getElementById('notifStatus').checked
        }
    };

    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'settings.json';
    a.click();
    window.URL.revokeObjectURL(url);

    alert('Impostazioni salvate! Il file settings.json è stato scaricato.');
}

// --- Event Listeners ---
// Assicuriamoci che il DOM sia caricato prima di eseguire (anche se lo script è a fine body)
document.addEventListener('DOMContentLoaded', async () => {
    // Recupera l'utente dalla sessione
    const currentUser = localStorage.getItem('user');
    
    // Aggiorna il nome utente e l'avatar nell'interfaccia
    if (currentUser) {
        document.querySelector('.user-profile span').textContent = currentUser;
        // Genera iniziali (es. Mario Rossi -> MR)
        document.querySelector('.user-profile .avatar').textContent = currentUser.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }

    statusFilter.addEventListener('change', filterTickets);
    btnNewTicket.addEventListener('click', createNewTicket);
    btnBack.addEventListener('click', closeTicketDetail);
    btnSave.addEventListener('click', saveTicketChanges);
    navDashboard.addEventListener('click', showDashboard);
    navSettings.addEventListener('click', showSettings);
    btnSaveSettings.addEventListener('click', saveSettings);
    
    // User Dropdown Logic
    userProfileTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!userProfileTrigger.contains(e.target)) {
            userDropdown.classList.add('hidden');
        }
    });

    btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('user'); // Pulisce la sessione simulata
        window.location.href = 'login.html';
    });

    // Aggiornamento live del valore percentuale
    detailProgress.addEventListener('input', (e) => {
        detailProgressValue.textContent = e.target.value + '%';
    });
    
    // Cambio tema in tempo reale
    document.getElementById('setTheme').addEventListener('change', (e) => {
        applyTheme(e.target.value);
    });

    // Cambio lingua in tempo reale
    document.getElementById('setLang').addEventListener('change', (e) => {
        applyLanguage(e.target.value);
    });
    
    // Event listeners per l'ordinamento
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => sortTable(th.dataset.sort));
    });

    // Init: Carica i dati dal CSV
    await loadTranslations(); // Carica traduzioni prima di tutto
    loadTickets();
    loadSettings();
});
