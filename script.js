const STORAGE_KEY = 'expense-tracker-transactions'

const elements = {
  form: document.getElementById('transaction-form'),
  description: document.getElementById('description'),
  amount: document.getElementById('amount'),
  message: document.getElementById('form-message'),
  transactionList: document.getElementById('transaction-list'),
  filterType: document.getElementById('filter-type'),
  balance: document.getElementById('balance'),
  balanceNote: document.getElementById('balance-note'),
  incomeTotal: document.getElementById('income-total'),
  expenseTotal: document.getElementById('expense-total'),
  netTotal: document.getElementById('net-total'),
  incomeBar: document.getElementById('income-bar'),
  expenseBar: document.getElementById('expense-bar'),
  incomeBarLabel: document.getElementById('income-bar-label'),
  expenseBarLabel: document.getElementById('expense-bar-label'),
  chartCaption: document.getElementById('chart-caption'),
  emptyStateTemplate: document.getElementById('empty-state-template')
}

let transactions = loadTransactions()
let currentFilter = 'all'

function loadTransactions () {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    const parsed = saved ? JSON.parse(saved) : []

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((transaction) => {
      return (
        typeof transaction.id === 'string' &&
        typeof transaction.description === 'string' &&
        typeof transaction.amount === 'number' &&
        typeof transaction.date === 'string'
      )
    })
  } catch (error) {
    console.error('Failed to load transactions:', error)
    return []
  }
}

function saveTransactions () {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
}

function generateTransactionId () {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID()
  }

  return `txn-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function formatCurrency (value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value)
}

function formatDate (dateString) {
  const date = new Date(dateString)

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

function getFilteredTransactions () {
  if (currentFilter === 'income') {
    return transactions.filter((transaction) => transaction.amount > 0)
  }

  if (currentFilter === 'expense') {
    return transactions.filter((transaction) => transaction.amount < 0)
  }

  return transactions
}

function updateSummary () {
  const income = transactions
    .filter((transaction) => transaction.amount > 0)
    .reduce((sum, transaction) => sum + transaction.amount, 0)

  const expenses = transactions
    .filter((transaction) => transaction.amount < 0)
    .reduce((sum, transaction) => sum + transaction.amount, 0)

  const balance = income + expenses
  const expenseAbs = Math.abs(expenses)
  const chartMax = Math.max(income, expenseAbs, 1)

  elements.incomeTotal.textContent = formatCurrency(income)
  elements.expenseTotal.textContent = formatCurrency(expenseAbs)
  elements.netTotal.textContent = formatCurrency(balance)
  elements.balance.textContent = formatCurrency(balance)
  elements.incomeBarLabel.textContent = formatCurrency(income)
  elements.expenseBarLabel.textContent = formatCurrency(expenseAbs)
  elements.incomeBar.style.width = `${(income / chartMax) * 100}%`
  elements.expenseBar.style.width = `${(expenseAbs / chartMax) * 100}%`

  if (transactions.length === 0) {
    elements.balanceNote.textContent = 'No transactions yet'
    elements.chartCaption.textContent = 'Waiting for data'
    return
  }

  const latestTransaction = transactions[0]
  elements.balanceNote.textContent = `Last update: ${formatDate(latestTransaction.date)}`
  elements.chartCaption.textContent = expenseAbs > income
    ? 'Expenses are currently higher than income'
    : 'Income is covering expenses'
}

function createTransactionItem (transaction) {
  const item = document.createElement('li')
  const isIncome = transaction.amount > 0
  const main = document.createElement('div')
  const textWrap = document.createElement('div')
  const title = document.createElement('p')
  const date = document.createElement('p')
  const amountWrap = document.createElement('div')
  const sign = document.createElement('span')
  const amount = document.createElement('strong')
  const deleteButton = document.createElement('button')

  item.className = `transaction-item ${isIncome ? 'income' : 'expense'}`
  main.className = 'transaction-main'
  title.className = 'transaction-title'
  date.className = 'transaction-date'
  amountWrap.className = 'transaction-amount-wrap'
  sign.className = 'transaction-sign'
  amount.className = 'transaction-amount'
  deleteButton.className = 'delete-btn'
  deleteButton.type = 'button'

  title.textContent = transaction.description
  date.textContent = formatDate(transaction.date)
  sign.textContent = isIncome ? '+' : '-'
  amount.textContent = formatCurrency(Math.abs(transaction.amount))
  deleteButton.textContent = 'Delete'
  deleteButton.setAttribute('aria-label', `Delete ${transaction.description}`)

  textWrap.append(title, date)
  amountWrap.append(sign, amount)
  main.append(textWrap, amountWrap)
  item.append(main, deleteButton)

  deleteButton.addEventListener('click', () => deleteTransaction(transaction.id))

  return item
}

function renderTransactions () {
  const filteredTransactions = getFilteredTransactions()
  elements.transactionList.innerHTML = ''

  if (filteredTransactions.length === 0) {
    const emptyState = elements.emptyStateTemplate.content.cloneNode(true)
    elements.transactionList.appendChild(emptyState)
    return
  }

  filteredTransactions.forEach((transaction) => {
    elements.transactionList.appendChild(createTransactionItem(transaction))
  })
}

function addTransaction (event) {
  event.preventDefault()

  const description = elements.description.value.trim()
  const amount = Number(elements.amount.value)

  if (!description || Number.isNaN(amount) || amount === 0) {
    elements.message.textContent = 'Enter a description and a non-zero amount.'
    elements.message.classList.add('error')
    return
  }

  const transaction = {
    id: generateTransactionId(),
    description,
    amount,
    date: new Date().toISOString()
  }

  transactions.unshift(transaction)
  saveTransactions()
  updateSummary()
  renderTransactions()

  elements.form.reset()
  elements.message.textContent = 'Transaction added successfully.'
  elements.message.classList.remove('error')
}

function deleteTransaction (id) {
  transactions = transactions.filter((transaction) => transaction.id !== id)
  saveTransactions()
  updateSummary()
  renderTransactions()
}

elements.form.addEventListener('submit', addTransaction)
elements.filterType.addEventListener('change', (event) => {
  currentFilter = event.target.value
  renderTransactions()
})

updateSummary()
renderTransactions()
