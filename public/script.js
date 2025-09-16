// --- Firebase Configuration (REPLACE WITH YOURS) ---
const firebaseConfig = {
  apiKey: "AIzaSyCBz7D-nh2obYjPnjwynjoX6gEkR2z_nM8",
  authDomain: "ticket-system-test1.firebaseapp.com",
  databaseURL: "https://ticket-system-test1-default-rtdb.firebaseio.com",
  projectId: "ticket-system-test1",
  storageBucket: "ticket-system-test1.firebasestorage.app",
  messagingSenderId: "79590086119",
  appId: "1:79590086119:web:b7cccdf7ee3e4aab8a1942",
  measurementId: "G-RNPFLSEVC7"
};

// --- Firebase Initialization ---
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- Global State and DOM Elements ---
let state = {
    user: null,
    userData: null,
    tickets: [],
    loading: true,
    selectedTicket: null
};

const dom = {
    appContainer: document.getElementById('app-container'),
    authPage: document.getElementById('auth-page'),
    dashboardPage: document.getElementById('dashboard-page'),
    loadingSpinner: document.getElementById('loading-spinner'),
    authForm: document.getElementById('auth-form'),
    authError: document.getElementById('auth-error'),
    userEmailSpan: document.getElementById('user-email'),
    signOutBtn: document.getElementById('sign-out-btn'),
    createTicketBtn: document.getElementById('create-ticket-btn'),
    ticketLists: document.getElementById('ticket-lists'),
    createModal: document.getElementById('create-modal'),
    detailModal: document.getElementById('detail-modal'),
    dashboardTitle: document.getElementById('dashboard-title')
};

// --- Helper Functions ---
function showLoading() {
    dom.loadingSpinner.classList.remove('hidden');
    dom.authPage.classList.add('hidden');
    dom.dashboardPage.classList.add('hidden');
}

function hideLoading() {
    dom.loadingSpinner.classList.add('hidden');
}

function renderUI() {
    hideLoading();
    if (state.userData) {
        dom.authPage.classList.add('hidden');
        dom.dashboardPage.classList.remove('hidden');
        renderDashboard();
    } else {
        dom.authPage.classList.remove('hidden');
        dom.dashboardPage.classList.add('hidden');
    }
}

function renderDashboard() {
    dom.userEmailSpan.textContent = state.userData.email;
    dom.dashboardTitle.textContent = state.userData.role === 'worker' ? 'Worker Dashboard' : 'User Dashboard';
    if (state.userData.role === 'user') {
        dom.createTicketBtn.classList.remove('hidden');
    } else {
        dom.createTicketBtn.classList.add('hidden');
    }
    renderTicketLists();
}

function renderTicketLists() {
    let ticketsHTML = '';
    if (state.userData.role === 'worker') {
        const openTickets = state.tickets.filter(t => t.status === 'Open');
        const myTickets = state.tickets.filter(t => t.assignedToWorker === state.user.uid && t.status === 'In Progress');
        const closedTickets = state.tickets.filter(t => t.status === 'Closed');

        ticketsHTML = `
            <div class="ticket-column">
                <h2 class="ticket-column-title">Open Tickets (${openTickets.length})</h2>
                <div class="ticket-list">${renderTicketCards(openTickets)}</div>
            </div>
            <div class="ticket-column">
                <h2 class="ticket-column-title">My Active Tickets (${myTickets.length})</h2>
                <div class="ticket-list">${renderTicketCards(myTickets)}</div>
            </div>
            <div class="ticket-column">
                <h2 class="ticket-column-title">Closed Tickets (${closedTickets.length})</h2>
                <div class="ticket-list">${renderTicketCards(closedTickets)}</div>
            </div>
        `;
    } else {
        ticketsHTML = `
            <div class="ticket-column w-full">
                <h2 class="ticket-column-title">My Submitted Tickets (${state.tickets.length})</h2>
                <div class="ticket-list">${renderTicketCards(state.tickets)}</div>
            </div>
        `;
    }
    dom.ticketLists.innerHTML = ticketsHTML;
}

function renderTicketCards(tickets) {
    if (tickets.length === 0) {
        return `<p class="no-tickets-message">No tickets here.</p>`;
    }
    return tickets.map(ticket => `
        <div class="ticket-card" data-ticket-id="${ticket.id}">
            <div class="ticket-card-header">
                <h3 class="ticket-title truncate">${ticket.title}</h3>
                <span class="ticket-status status-${ticket.status.toLowerCase().replace(' ', '')}">${ticket.status}</span>
            </div>
            <p class="text-gray-600 mt-2 text-sm">Created by: <span class="font-medium">${ticket.createdByUserEmail}</span></p>
            ${ticket.assignedToWorkerEmail ? `<p class="text-gray-600 mt-1 text-sm">Assigned to: <span class="font-medium">${ticket.assignedToWorkerEmail}</span></p>` : ''}
            <p class="text-gray-500 mt-3 text-xs">Opened on: ${ticket.createdAt.toDate().toLocaleString()}</p>
        </div>
    `).join('');
}

function renderDetailModal(ticket) {
    state.selectedTicket = ticket;
    const body = dom.detailModal.querySelector('#detail-modal-body');
    const commentsHTML = ticket.comments.map(c => `
        <div class="text-sm">
            <p class="font-bold">${c.authorEmail} <span class="text-xs font-normal text-gray-500">(${c.authorRole})</span></p>
            <p class="text-gray-800">${c.text}</p>
            <p class="text-xs text-gray-400 mt-1">${c.createdAt.toDate().toLocaleString()}</p>
        </div>
    `).join('');

    body.innerHTML = `
        <p><span class="font-semibold">Status:</span> ${ticket.status}</p>
        <p><span class="font-semibold">User:</span> ${ticket.createdByUserEmail}</p>
        ${ticket.assignedToWorkerEmail ? `<p><span class="font-semibold">Worker:</span> ${ticket.assignedToWorkerEmail}</p>` : ''}
        
        <div class="border-t pt-4">
            <h4 class="font-semibold mb-2">Description:</h4>
            <p class="bg-gray-50 p-3 rounded-md text-gray-700 whitespace-pre-wrap">${ticket.description}</p>
        </div>

        <div class="border-t pt-4">
            <h4 class="font-semibold mb-2">Conversation History</h4>
            <div class="max-h-48 overflow-y-auto space-y-3 bg-gray-50 p-3 rounded-md">
                ${commentsHTML.length > 0 ? commentsHTML : '<p class="text-gray-500">No comments yet.</p>'}
            </div>
        </div>

        ${ticket.status !== 'Closed' ? `
            <form id="add-comment-form" class="border-t pt-4 space-y-2">
                <textarea id="comment-input" placeholder="Add a comment..." rows="3"></textarea>
                <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Add Comment</button>
            </form>
        ` : ''}

        <div class="flex justify-end space-x-3 pt-4 border-t">
            ${state.userData.role === 'worker' && ticket.status === 'Open' ? `
                <button id="take-ticket-btn" class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">Take Ticket</button>
            ` : ''}
            ${state.userData.role === 'worker' && ticket.status === 'In Progress' ? `
                <button id="close-ticket-btn" class="bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-800">Mark as Closed</button>
            ` : ''}
            <button class="modal-cancel-btn bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Close</button>
        </div>
    `;

    document.getElementById('detail-modal-title').textContent = `Ticket: ${ticket.title}`;
    dom.detailModal.classList.remove('hidden');

    // Add event listeners for buttons that just got rendered
    document.getElementById('take-ticket-btn')?.addEventListener('click', () => handleTakeTicket(ticket.id));
    document.getElementById('close-ticket-btn')?.addEventListener('click', () => handleCloseTicket(ticket.id));
    document.getElementById('add-comment-form')?.addEventListener('submit', handleAddComment);
}

// --- Firebase and Data Logic ---
const fetchUserData = async (authUser) => {
    const userDoc = await db.collection('users').doc(authUser.uid).get();
    if (userDoc.exists) {
        state.userData = userDoc.data();
    } else {
        state.userData = { uid: authUser.uid, email: authUser.email, role: 'user' };
    }
};

const getTickets = () => {
    let queryRef;
    if (state.userData.role === 'worker') {
        queryRef = db.collection('tickets').orderBy('createdAt', 'desc');
    } else {
        queryRef = db.collection('tickets').where('createdByUser', '==', state.user.uid).orderBy('createdAt', 'desc');
    }
    
    queryRef.onSnapshot(snapshot => {
        state.tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderUI();
    }, error => {
        console.error("Error fetching tickets:", error);
    });
};

// --- Event Handlers ---
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email-input').value;
    const password = document.getElementById('password-input').value;
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        dom.authError.textContent = error.message;
        dom.authError.classList.remove('hidden');
    }
}

function handleSignOut() {
    auth.signOut();
}

async function handleCreateTicket(e) {
    e.preventDefault();
    const title = document.getElementById('ticket-title-input').value;
    const description = document.getElementById('ticket-description-input').value;
    
    if (!title.trim() || !description.trim()) return;

    try {
        await db.collection('tickets').add({
            title,
            description,
            status: 'Open',
            createdByUser: state.user.uid,
            createdByUserEmail: state.userData.email,
            assignedToWorker: null,
            assignedToWorkerEmail: null,
            createdAt: firebase.firestore.Timestamp.now(),
            comments: []
        });
        dom.createModal.classList.add('hidden');
        document.getElementById('create-ticket-form').reset();
    } catch (error) {
        console.error("Error creating ticket:", error);
    }
}

async function handleAddComment(e) {
    e.preventDefault();
    const commentInput = document.getElementById('comment-input');
    const commentText = commentInput.value;
    if (!commentText.trim()) return;

    const newComment = {
        text: commentText,
        authorEmail: state.userData.email,
        authorRole: state.userData.role,
        createdAt: firebase.firestore.Timestamp.now(),
    };

    const ticketRef = db.collection('tickets').doc(state.selectedTicket.id);
    await ticketRef.update({
        comments: firebase.firestore.FieldValue.arrayUnion(newComment)
    });

    // Manually update the selected ticket state to show the new comment
    state.selectedTicket.comments.push(newComment);
    renderDetailModal(state.selectedTicket); // Re-render the modal
    commentInput.value = '';
}

async function handleTakeTicket(ticketId) {
    // Only allow workers to take tickets
    if (state.userData.role !== 'worker') {
        alert('Permission denied. You must be a worker to take tickets.');
        return;
    }
    
    // Get a reference to the specific ticket document
    const ticketRef = db.collection('tickets').doc(ticketId);

    try {
        // Update the ticket document in Firestore
        await ticketRef.update({
            status: 'In Progress',
            assignedToWorker: state.user.uid,
            assignedToWorkerEmail: state.userData.email
        });
        
        // Hide the modal after the update
        dom.detailModal.classList.add('hidden');
        
    } catch (error) {
        console.error("Error taking ticket:", error);
        alert('Failed to take ticket. Please try again.');
    }
}

async function handleCloseTicket(ticketId) {
    // Only allow workers to close tickets
    if (state.userData.role !== 'worker') {
        alert('Permission denied. You must be a worker to close tickets.');
        return;
    }

    const ticketRef = db.collection('tickets').doc(ticketId);

    try {
        // Update the ticket document in Firestore
        await ticketRef.update({
            status: 'Closed'
        });
        
        // Hide the modal after the update
        dom.detailModal.classList.add('hidden');

    } catch (error) {
        console.error("Error closing ticket:", error);
        alert('Failed to close ticket. Please try again.');
    }
}

// --- Main App Logic ---
function setupEventListeners() {
    dom.authForm.addEventListener('submit', handleLogin);
    dom.signOutBtn.addEventListener('click', handleSignOut);
    dom.createTicketBtn.addEventListener('click', () => dom.createModal.classList.remove('hidden'));

    // Modal close buttons
    document.querySelectorAll('.modal-overlay .modal-close-btn, .modal-cancel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            dom.createModal.classList.add('hidden');
            dom.detailModal.classList.add('hidden');
        });
    });

    // Ticket create form
    document.getElementById('create-ticket-form').addEventListener('submit', handleCreateTicket);

    // Dynamic event listener for ticket cards using event delegation
    dom.ticketLists.addEventListener('click', (e) => {
        const card = e.target.closest('.ticket-card');
        if (card) {
            const ticketId = card.dataset.ticketId;
            const ticket = state.tickets.find(t => t.id === ticketId);
            if (ticket) {
                renderDetailModal(ticket);
            }
        }
    });
}

// Main entry point
auth.onAuthStateChanged(async (authUser) => {
    showLoading();
    if (authUser) {
        state.user = authUser;
        await fetchUserData(authUser);
        getTickets();
    } else {
        state.user = null;
        state.userData = null;
        state.tickets = [];
        renderUI();
    }
});

// Initialize event listeners once the DOM is ready

document.addEventListener('DOMContentLoaded', setupEventListeners);

