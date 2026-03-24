const balance = document.getElementById("balance");
const income = document.getElementById("income");
const expense = document.getElementById("expense");
const list = document.getElementById("transaction-list");
const form = document.getElementById("form");
const text = document.getElementById("text");
const amount = document.getElementById("amount");
const date = document.getElementById("date");

const toggleBtn = document.getElementById("theme-toggle");

if (localStorage.getItem("theme") === "light") {
  document.body.classList.add("light");
  toggleBtn.textContent = "☀️";
}

toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("light");

  if (document.body.classList.contains("light")) {
    toggleBtn.textContent = "☀️";
    localStorage.setItem("theme", "light");
  } else {
    toggleBtn.textContent = "🌙";
    localStorage.setItem("theme", "dark");
  }
});


let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let chart;

function addTransaction(e) {
  e.preventDefault();

  const transaction = {
    id: Date.now(),
    text: text.value,
    amount: +amount.value,
    date: date.value
  };

  transactions.push(transaction);
  updateLocalStorage();
  init();

  text.value = "";
  amount.value = "";
  date.value = "";
}

function removeTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  updateLocalStorage();
  init();
}

function addTransactionDOM(transaction) {
  const sign = transaction.amount < 0 ? "-" : "+";
  const item = document.createElement("li");

  item.classList.add(transaction.amount < 0 ? "minus" : "plus");

  item.innerHTML = `
    ${transaction.text}
    <span>${sign}$${Math.abs(transaction.amount)}</span>
    <small>${transaction.date}</small>
    <button class="delete-btn" onclick="removeTransaction(${transaction.id})">x</button>
  `;

  list.appendChild(item);
}

function updateValues() {
  const amounts = transactions.map(t => t.amount);

  const total = amounts.reduce((a, b) => a + b, 0);
  const inc = amounts.filter(a => a > 0).reduce((a, b) => a + b, 0);
  const exp = amounts.filter(a => a < 0).reduce((a, b) => a + b, 0);

  balance.innerText = `$${total.toFixed(2)}`;
  income.innerText = `$${inc.toFixed(2)}`;
  expense.innerText = `$${Math.abs(exp).toFixed(2)}`;

  updateChart(inc, Math.abs(exp));
}

function updateChart(inc, exp) {
  if (chart) chart.destroy();

  const ctx = document.getElementById("chart");
  chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Income", "Expenses"],
      datasets: [{
        data: [inc, exp],
        backgroundColor: ["green", "red"]
      }]
    }
  });
}

function filterTransactions(type) {
  list.innerHTML = "";

  let filtered = transactions;

  if (type === "income") {
    filtered = transactions.filter(t => t.amount > 0);
  }

  if (type === "expense") {
    filtered = transactions.filter(t => t.amount < 0);
  }

  filtered.forEach(addTransactionDOM);
}

function updateLocalStorage() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

function init() {
  list.innerHTML = "";
  transactions.forEach(addTransactionDOM);
  updateValues();
}

form.addEventListener("submit", addTransaction);

init();