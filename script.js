const transactionForm = document.getElementById("transactionForm");
const transactionList = document.getElementById("transactionList");
const balanceDisplay = document.getElementById("balance");
const filterMonth = document.getElementById("filterMonth");
const dateFilter = document.getElementById("dateFilter");
const summaryIncome = document.getElementById("summaryIncome");
const summaryExpense = document.getElementById("summaryExpense");
const exportBtn = document.getElementById("exportBtn");
const themeToggleIcon = document.getElementById("themeToggleIcon");

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let chart;

// Theme Toggle (icon click)
themeToggleIcon.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

// Add Transaction
transactionForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const name = document.getElementById("transactionName").value.trim();
  const amount = parseFloat(document.getElementById("transactionAmount").value);
  const type = document.getElementById("transactionType").value;
  const category = document.getElementById("transactionCategory").value.trim();
  const date = document.getElementById("transactionDate").value;

  if (!name || isNaN(amount) || amount <= 0 || !type || !category || !date) {
    alert("Please fill out all fields correctly.");
    return;
  }

  const transaction = {
    name,
    amount: Math.abs(amount),
    type,
    category,
    date
  };

  transactions.push(transaction);
  updateLocalStorage();
  applyFilters();
  transactionForm.reset();
});

// Delete Transaction
function deleteTransaction(index) {
  transactions.splice(index, 1);
  updateLocalStorage();
  applyFilters();
}

// Local Storage
function updateLocalStorage() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

// Update Balance and Summary
function updateBalance(filtered = transactions) {
  const income = filtered.filter(t => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);
  const expense = filtered.filter(t => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);

  balanceDisplay.textContent = (income - expense).toFixed(2);
  summaryIncome.textContent = income.toFixed(2);
  summaryExpense.textContent = expense.toFixed(2);
}

// Render Transactions
function renderTransactions(list = transactions) {
  transactionList.innerHTML = "";
  list.forEach((t, index) => {
    const li = document.createElement("li");
    li.className = `transaction-item ${t.type}`;
    li.innerHTML = `
      ${t.name} - $${t.type === "expense" ? "-" : ""}${t.amount.toFixed(2)}
      <small> (${t.category}, ${t.date}) </small>
      <button class="delete-btn" onclick="deleteTransaction(${index})">&times;</button>
    `;
    transactionList.appendChild(li);
  });
}

// Date Filter (Today, Week, Month)
function applyDateFilter(list) {
  const type = dateFilter.value;
  const today = new Date();
  return list.filter(t => {
    const tDate = new Date(t.date);
    if (type === "today") {
      return tDate.toDateString() === today.toDateString();
    } else if (type === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 7);
      return tDate >= weekAgo && tDate <= today;
    } else if (type === "month") {
      return (
        tDate.getMonth() === today.getMonth() &&
        tDate.getFullYear() === today.getFullYear()
      );
    }
    return true;
  });
}

// Chart Update
function updateChart(data) {
  const categoryTotals = {};
  data.forEach(t => {
    if (t.type === "expense") {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    }
  });

  const labels = Object.keys(categoryTotals);
  const values = Object.values(categoryTotals);
  const ctx = document.getElementById("expenseChart").getContext("2d");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: [
          '#ff6384', '#36a2eb', '#cc65fe', '#ffce56',
          '#4bc0c0', '#9966ff', '#ff9f40'
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

// Apply All Filters
function applyFilters() {
  const month = filterMonth.value;
  let filtered = month
    ? transactions.filter(t => t.date.startsWith(month))
    : transactions;

  filtered = applyDateFilter(filtered);
  renderTransactions(filtered);
  updateBalance(filtered);
  updateChart(filtered);
}

// Filter Events
filterMonth.addEventListener("change", applyFilters);
dateFilter.addEventListener("change", applyFilters);

// Export to CSV
exportBtn.addEventListener("click", function () {
  let csv = "Name,Amount,Type,Category,Date\n";
  transactions.forEach(t => {
    csv += `${t.name},${t.amount},${t.type},${t.category},${t.date}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "transactions.csv";
  a.click();
  URL.revokeObjectURL(url);
});

// Initialize
applyFilters();
