const API = '/api/transactions';

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('date').valueAsDate = new Date();
    document.getElementById('transactionForm').addEventListener('submit', handleSubmit);
    loadData();
});

async function loadData() {
    await Promise.all([loadTransactions(), loadSummary()]);
}

async function loadTransactions() {
    try {
        const res = await fetch(API);
        const transactions = await res.json();
        renderTransactions(transactions);
    } catch (e) {
        showToast('Failed to load transactions', 'error');
    }
}

async function loadSummary() {
    try {
        const res = await fetch(`${API}/summary`);
        const data = await res.json();
        document.getElementById('totalIncome').textContent = formatCurrency(data.totalIncome);
        document.getElementById('totalExpense').textContent = formatCurrency(data.totalExpense);
        document.getElementById('balance').textContent = formatCurrency(data.balance);
        document.getElementById('txCount').textContent = data.transactionCount;
    } catch (e) {
        showToast('Failed to load summary', 'error');
    }
}

function renderTransactions(transactions) {
    const tbody = document.getElementById('transactionBody');
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="6">No transactions yet. Add one above!</td></tr>';
        return;
    }

    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = transactions.map(tx => `
        <tr>
            <td>${formatDate(tx.date)}</td>
            <td><span class="type-badge ${tx.type.toLowerCase()}">${tx.type}</span></td>
            <td>${getCategoryIcon(tx.category)} ${tx.category}</td>
            <td>${tx.description || '—'}</td>
            <td class="amount-${tx.type.toLowerCase()}">${tx.type === 'INCOME' ? '+' : '-'}${formatCurrency(tx.amount)}</td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-secondary btn-sm" onclick="editTransaction(${tx.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteTransaction(${tx.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function handleSubmit(e) {
    e.preventDefault();
    const editId = document.getElementById('editId').value;
    const transaction = {
        type: document.getElementById('type').value,
        category: document.getElementById('category').value,
        amount: parseFloat(document.getElementById('amount').value),
        description: document.getElementById('description').value,
        date: document.getElementById('date').value
    };

    try {
        const isEdit = editId !== '';
        const res = await fetch(isEdit ? `${API}/${editId}` : API, {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transaction)
        });

        if (!res.ok) throw new Error('Failed');

        showToast(isEdit ? 'Transaction updated' : 'Transaction added', 'success');
        resetForm();
        loadData();
    } catch (e) {
        showToast('Failed to save transaction', 'error');
    }
}

async function editTransaction(id) {
    try {
        const res = await fetch(`${API}/${id}`);
        if (!res.ok) throw new Error('Not found');
        const tx = await res.json();

        document.getElementById('editId').value = tx.id;
        document.getElementById('type').value = tx.type;
        document.getElementById('category').value = tx.category;
        document.getElementById('amount').value = tx.amount;
        document.getElementById('description').value = tx.description || '';
        document.getElementById('date').value = tx.date;

        document.getElementById('formTitle').textContent = 'Edit Transaction';
        document.getElementById('submitBtn').textContent = 'Update Transaction';
        document.getElementById('cancelBtn').style.display = 'inline-block';
        document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
        showToast('Failed to load transaction', 'error');
    }
}

async function deleteTransaction(id) {
    if (!confirm('Delete this transaction?')) return;
    try {
        const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed');
        showToast('Transaction deleted', 'info');
        loadData();
    } catch (e) {
        showToast('Failed to delete transaction', 'error');
    }
}

function cancelEdit() {
    resetForm();
}

function resetForm() {
    document.getElementById('transactionForm').reset();
    document.getElementById('editId').value = '';
    document.getElementById('date').valueAsDate = new Date();
    document.getElementById('formTitle').textContent = 'Add Transaction';
    document.getElementById('submitBtn').textContent = 'Add Transaction';
    document.getElementById('cancelBtn').style.display = 'none';
}

// ---- Playground ----

async function doCalc() {
    const a = parseFloat(document.getElementById('calcA').value) || 0;
    const b = parseFloat(document.getElementById('calcB').value) || 0;
    const op = document.getElementById('calcOp').value;
    const symbols = { add: '+', subtract: '-', multiply: '*', divide: '/' };

    try {
        const res = await fetch('/api/playground/calc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ a, b, op })
        });
        const data = await res.json();
        const el = document.getElementById('calcResult');
        if (data.error) {
            el.textContent = data.type + ': ' + data.message;
            el.className = 'play-result error';
            addLog('error', data.type + ' — ' + data.message);
        } else {
            el.textContent = '= ' + data.result;
            el.className = 'play-result success';
            addLog('info', a + ' ' + symbols[op] + ' ' + b + ' = ' + data.result);
        }
    } catch (e) {
        document.getElementById('calcResult').textContent = 'Request failed';
        document.getElementById('calcResult').className = 'play-result error';
    }
}

async function doString() {
    const input = document.getElementById('strInput').value;
    const op = document.getElementById('strOp').value;
    const index = document.getElementById('strIndex').value !== '' ? parseInt(document.getElementById('strIndex').value) : null;

    try {
        const res = await fetch('/api/playground/string', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input, op, index })
        });
        const data = await res.json();
        const el = document.getElementById('strResult');
        if (data.error) {
            el.textContent = data.type;
            el.className = 'play-result error';
            addLog('error', data.type + ' — ' + data.message);
        } else {
            el.textContent = data.result;
            el.className = 'play-result success';
            addLog('info', op + '("' + input + '") = ' + data.result);
        }
    } catch (e) {
        document.getElementById('strResult').textContent = 'Request failed';
        document.getElementById('strResult').className = 'play-result error';
    }
}

async function doArray() {
    const index = parseInt(document.getElementById('arrIndex').value) || 0;

    try {
        const res = await fetch('/api/playground/array', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ index })
        });
        const data = await res.json();
        const el = document.getElementById('arrResult');
        if (data.error) {
            el.textContent = data.type;
            el.className = 'play-result error';
            addLog('error', data.type + ' — ' + data.message);
        } else {
            el.textContent = 'arr[' + index + '] = ' + data.result;
            el.className = 'play-result success';
            addLog('info', 'arr[' + index + '] = ' + data.result);
        }
    } catch (e) {
        document.getElementById('arrResult').textContent = 'Request failed';
        document.getElementById('arrResult').className = 'play-result error';
    }
}

async function doParse() {
    const input = document.getElementById('parseInput').value;
    const type = document.getElementById('parseType').value;

    try {
        const res = await fetch('/api/playground/parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input, type })
        });
        const data = await res.json();
        const el = document.getElementById('parseResult');
        if (data.error) {
            el.textContent = data.type;
            el.className = 'play-result error';
            addLog('error', data.type + ' — ' + data.message);
        } else {
            el.textContent = data.result;
            el.className = 'play-result success';
            addLog('info', 'parse("' + input + '") = ' + data.result);
        }
    } catch (e) {
        document.getElementById('parseResult').textContent = 'Request failed';
        document.getElementById('parseResult').className = 'play-result error';
    }
}

function addLog(level, message) {
    const log = document.getElementById('activityLog');
    const empty = log.querySelector('.log-empty');
    if (empty) empty.remove();

    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = '<span class="log-time">' + time + '</span>'
        + '<span class="log-badge ' + level + '">' + level.toUpperCase() + '</span>'
        + '<span class="log-msg">' + message + '</span>';
    log.insertBefore(entry, log.firstChild);

    // Keep max 50 entries
    while (log.children.length > 50) log.removeChild(log.lastChild);
}

// Helpers
function formatCurrency(amount) {
    return '$' + Math.abs(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getCategoryIcon(category) {
    const icons = {
        'Salary': '\uD83D\uDCB0',
        'Freelance': '\uD83D\uDCBB',
        'Food': '\uD83C\uDF54',
        'Transport': '\uD83D\uDE97',
        'Shopping': '\uD83D\uDED2',
        'Bills': '\uD83D\uDCC4',
        'Entertainment': '\uD83C\uDFAC',
        'Health': '\uD83C\uDFE5',
        'Investment': '\uD83D\uDCC8',
        'Other': '\uD83D\uDCCC'
    };
    return icons[category] || '\uD83D\uDCCC';
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => { toast.className = 'toast'; }, 3000);
}
