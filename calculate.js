console.log("alculate.js loaded!");

// A class to represent a single Transaction
class Transaction {
    constructor(type, note, amount, date, description) {
        this.type = type; // 'expenses' or 'income'
        this.note = note; // Description of the transaction saved as a string
        this.amount = amount; // Number value
        this.date = date; // Date of the transaction saved as a string
        this.description = description; // Additional description saved as a string
    }
}

class BudgetManager {
    constructor() {
        this.expenseList = [];
        this.incomeList = [];
        this.goalsList = []; // for goals.html
        this.init();
    }

    init() {
        this.loadTransactions();
        this.loadGoals(); 
        this.setupEventListeners();
        this.displayTransactions();
        this.calculateAndDisplayTotals();

        const goalsListEl = document.getElementById("goalsList");
        if (goalsListEl) {
            this.displayGoals();
        }


    }

    // Load data from Local Storage
    loadTransactions() {
        const username = localStorage.getItem('currentUser');
        const storedExpenses = localStorage.getItem(`expense_list_${username}`);
        const storedIncomes = localStorage.getItem(`income_list_${username}`);

        if (username) {
            console.log(`Loading transactions for user: ${username}`);
            this.expenseList = storedExpenses ? JSON.parse(storedExpenses) : [];
            this.incomeList = storedIncomes ? JSON.parse(storedIncomes) : [];
            console.log("Expenses loaded:", this.expenseList);
            console.log("Income loaded:", this.incomeList);
        } else {
            console.error("No current user found. Please log in.");
            this.expenseList = [];
            this.incomeList = [];
        }
    }

    // Load data from Local Storage for goals
    loadGoals() {
        const username = localStorage.getItem('currentUser');
        const storedGoals = localStorage.getItem(`goals_list_${username}`);
        if (username) {
            console.log(`Loading goals for user: ${username}`);
            this.goalsList = storedGoals ? JSON.parse(storedGoals) : [];
            console.log("Goals loaded:", this.goalsList);
        } else {
            console.error("No current user found. Please log in.");
            this.goalsList = [];
        }
        
    }

    // Add a new goal
    addGoal(goal) {
        if (!this.goalsList) {
            this.goalsList = [];
        }
        goal.progress = 0; // start goal progress at 0

        console.log("Adding goal:", goal); 
        this.goalsList.push(goal);
        this.saveGoals();
        this.displayGoals();
        this.calculateAndDisplayTotals();
        console.log(`Goal added: ${goal}`);
        
    }

displayGoals() {
const goalsListEl = document.getElementById("goalsList");
    const completedGoalsListEl = document.getElementById("completedGoalsList");
    const goalDropdown = document.getElementById("goalDropdown");

    if (!goalsListEl || !completedGoalsListEl) {
        console.error("Goals list element(s) not found.");
        return;
    }
    
    // Clear existing information from both displays and the dropdown
    goalsListEl.innerHTML = '';
    completedGoalsListEl.innerHTML = '';
    if (goalDropdown) {
        goalDropdown.innerHTML = '';
    }

    if (this.goalsList && this.goalsList.length > 0) {
        this.goalsList.forEach((goal, idx) => {
            const progress = goal.progress || 0;
            const percent = Math.min(100, (progress / goal.amount) * 100);
            let barClass = "incomplete";

            // Determine bar class based on progress
            
            if (progress >= goal.amount) {
                barClass = "complete";
            }
            if (progress > goal.amount) {
                barClass = "over";
            }

            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${goal.name}</strong> - $${goal.amount} by ${goal.deadline}<br>
                Saved: $${progress} (${percent.toFixed(1)}%)
                <div class="progress-bar-container">
                    <div class="progress-bar ${barClass}" style="width:${Math.min(100, percent)}%"></div>
                </div>
                <button class="remove-individual-goal" data-idx="${idx}" style="background-color:#e74c3c;color:white;margin-top:5px;width:fit-content;">x</button>
               
            `;

            // Separate goals into two lists
            if (progress >= goal.amount) {
                completedGoalsListEl.appendChild(li);
            } else {
                goalsListEl.appendChild(li);
                // Add to dropdown ONLY if the goal is not complete
                if (goalDropdown) {
                    const option = document.createElement('option');
                    option.value = idx;
                    option.textContent = `${goal.name} ($${goal.amount})`;
                    goalDropdown.appendChild(option);
                }
            }
        });
        
        // Add event listeners for individual goal removal
        const removeButtons = document.querySelectorAll('.remove-individual-goal');
        removeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(btn.getAttribute('data-idx'));
                const goalName = this.goalsList[idx].name;
                if (confirm(`Are you sure you want to delete the goal "${goalName}"? This cannot be undone.`)) {
                    this.goalsList.splice(idx, 1);
                    this.saveGoals();
                    this.displayGoals();
                    this.calculateAndDisplayTotals();
                }
            });
        });
    } else {
        goalsListEl.innerHTML = '<li>No goals recorded yet.</li>';
        if (goalDropdown) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No goals available';
            goalDropdown.appendChild(option);
        }
    }
}

    saveGoals() {
        const username = localStorage.getItem('currentUser');
        if (!username) return;
        localStorage.setItem(`goals_list_${username}`, JSON.stringify(this.goalsList));
        console.log(`Goals saved for user: ${username}`);
    }

addProgressToGoal(goalIndex, amount) {
    if (
        this.goalsList[goalIndex] &&
        amount > 0 &&
        amount <= (this.incomeList.reduce((sum, item) => sum + parseFloat(item.amount), 0) -
                   this.expenseList.reduce((sum, item) => sum + parseFloat(item.amount), 0))
    ) {
        this.goalsList[goalIndex].progress += amount;

        // Add an expense transaction for the allocation
        const today = new Date().toISOString().split('T')[0];
        const allocationExpense = new Transaction(
            'expenses',
            `Goal: ${this.goalsList[goalIndex].name}`,
            amount,
            today,
            'Allocated to goal'
        );
        this.expenseList.push(allocationExpense);

        this.saveGoals();
        this.saveTransactions();
        this.displayGoals();
        this.displayTransactions();
        this.calculateAndDisplayTotals();
        alert(`Added $${amount} to "${this.goalsList[goalIndex].name}"!`);
    } else {
        alert("Invalid amount or not enough balance.");
    }
}

    // Save data to Local Storage
    saveTransactions() {
        const username = localStorage.getItem('currentUser');
        if (!username) return;
        localStorage.setItem(`expense_list_${username}`, JSON.stringify(this.expenseList));
        localStorage.setItem(`income_list_${username}`, JSON.stringify(this.incomeList));
        console.log(`Transactions saved for user: ${username}`);
    }

    // Add a new transaction
    addTransaction(transaction) {
        if (transaction.type === 'expenses') {
            this.expenseList.push(transaction);
        } else if (transaction.type === 'income') {
            this.incomeList.push(transaction);
        }
        this.saveTransactions();
        this.displayTransactions();
        this.calculateAndDisplayTotals();
        console.log(`Transaction added: ${transaction.type} - ${transaction.note} - $${transaction.amount}`);
    }

    // Delete the previous transaction
    removeTransaction(transaction) {
        if (transaction && transaction.type === 'expenses' && this.expenseList.length > 0) {
            this.expenseList.pop();
        } else if (transaction && transaction.type === 'income' && this.incomeList.length > 0) {
            this.incomeList.pop();
        } else {
            console.error("Invalid transaction type or empty list. Cannot remove transaction.");
        }
        this.saveTransactions();
        this.displayTransactions();
        this.calculateAndDisplayTotals();
    }

    // Display transactions 
    displayTransactions() {
        const expenseUl = document.getElementById("expenseList");
        const incomeUl = document.getElementById("incomeList");

        if (!expenseUl || !incomeUl) {
            console.error("Expense or Income UL element not found.");
            return;
        }

        // Clear existing information from display inputs
        expenseUl.innerHTML = '';
        incomeUl.innerHTML = '';


    // Display Expenses (most recent first)
    if (this.expenseList.length > 0) {
        // Reverse for most recent at top
        this.expenseList.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.date} - ${item.note}: $${parseFloat(item.amount).toFixed(2)} (${item.description})`;
            expenseUl.appendChild(li);
        });
    } else {
        expenseUl.innerHTML = '<li>No expenses recorded yet.</li>';
    }

    // Display Income (most recent first)
    if (this.incomeList.length > 0) {
        this.incomeList.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.date} - ${item.note}: $${parseFloat(item.amount).toFixed(2)} (${item.description})`;
            incomeUl.appendChild(li);
        });
    } else {
        incomeUl.innerHTML = '<li>No income recorded yet.</li>';
    }
        // Scroll to bottom to show most recent 3
    setTimeout(() => {
        expenseUl.scrollTop = expenseUl.scrollHeight;
        incomeUl.scrollTop = incomeUl.scrollHeight;
    }, 0);
    }

    // Calculate and display totals
    calculateAndDisplayTotals() {
        const totalExpenses = this.expenseList.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const totalIncome = this.incomeList.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        const balance = totalIncome - totalExpenses;
        const totalGoals = this.goalsList.reduce((sum, goal) => sum + parseFloat(goal.amount), 0)
     
        const totalExpensesElement = document.getElementById("totalExpenses");
        const totalIncomeElement = document.getElementById("totalIncome");
        const balanceElement = document.getElementById("balance");
        const savingGoalElement = document.getElementById("savingGoal");
        const progressElement = document.getElementById("progress");

    if (totalExpensesElement) {
        totalExpensesElement.textContent = `Total Expenses: $${totalExpenses.toFixed(2)}`;
    }
    if (totalIncomeElement) {
        totalIncomeElement.textContent = `Total Income: $${totalIncome.toFixed(2)}`;
    }
    if (balanceElement) {
        balanceElement.textContent = `Balance: $${balance.toFixed(2)}`;
    }
    if (savingGoalElement) {
        const totalGoals = this.goalsList.reduce((sum, goal) => sum + parseFloat(goal.amount), 0);
        savingGoalElement.textContent = `Goal: $${totalGoals.toFixed(2)}`;
    }
        // Calculate the total progress across all goals
    const totalProgress = this.goalsList.reduce((sum, goal) => sum + (parseFloat(goal.progress) || 0), 0);

    if (savingGoalElement) {
        const totalGoals = this.goalsList.reduce((sum, goal) => sum + parseFloat(goal.amount), 0);
        savingGoalElement.textContent = `Goal: $${totalGoals.toFixed(2)}`;
    }

    // Update the progress element with the calculated total progress
    if (progressElement) {
        progressElement.textContent = `Saved: $${totalProgress.toFixed(2)}`;
    }

    // Get a reference to the pet image element
    const petImageElement = document.getElementById("petImageElement");

    if (petImageElement) {

    // Check conditions to set the pet's mood
        if (balance < 0) { // Critical: In debt (Checked first)
            petImageElement.src = "images/petDestroyed.PNG";
        } else if (totalProgress >= totalGoals) { // Most important: Goal is complete
            petImageElement.src = "images/petBlank.PNG";
        } else if (totalProgress >= totalGoals * 0.5) { // Next most important: Good progress
            petImageElement.src = "images/petHappy.PNG";
        } else if (balance < totalIncome * 0.2) { // Warning: Low balance
            petImageElement.src = "images/petWary.PNG";
        } else { // Neutral: Default state
            petImageElement.src = "images/petNeutral.PNG";
        }
    }
    }



    setupEventListeners() {
        const addButton = document.getElementById("add");
        const removeExpenseButton = document.getElementById("removeExpense");
        const removeIncomeButton = document.getElementById("removeIncome");
        const addGoalButton = document.getElementById("addGoal");
        const removeGoalButton = document.getElementById("removeGoal");
        const logoutBtn = document.getElementById("logoutBtn");
        const allocateBtn = document.getElementById("allocateBtn");


        if (addButton) {
            addButton.addEventListener("click", (event) => {
                event.preventDefault();

                const transactionType = document.getElementById("transactionType").value;
                const transactionNote = document.getElementById("transactionName").value;
                const amountStr = document.getElementById("amount").value;
                const amount = parseFloat(amountStr);
                const date = document.getElementById("date").value;
                const description = document.getElementById("description").value;

                if (!transactionNote || isNaN(amount) || amount <= 0 || !date) {
                    alert("Please fill in all required fields (Transaction Note, Amount, Date) with valid values.");
                    return;
                }

                const newTransaction = new Transaction(transactionType, transactionNote, amount, date, description);
                this.addTransaction(newTransaction);
                alert("Transaction added successfully!");

                // Clear the form fields after submission
                document.getElementById("transactionName").value = "";
                document.getElementById("amount").value = "";
                document.getElementById("date").value = "";
                document.getElementById("description").value = "";
            });
        } 

        if (addGoalButton) {
            addGoalButton.addEventListener("click", (event) => {
                event.preventDefault();
                const goalName = document.getElementById("goalName").value.trim();
                const targetAmount = document.getElementById("targetAmount").value.trim();
                const deadline = document.getElementById("deadline").value.trim();

                if (goalName && targetAmount && deadline) {
                    const goal = {
                        name: goalName,
                        amount: parseFloat(targetAmount),
                        deadline: deadline
                    };
                    this.addGoal(goal);
                    document.getElementById("goalName").value = "";
                    document.getElementById("targetAmount").value = "";
                    document.getElementById("deadline").value = "";
                } else {
                    alert("Please fill in all goal fields.");
                }
            });
        }

        if (removeExpenseButton) {
            removeExpenseButton.addEventListener("click", (event) => {
                event.preventDefault();
                if (this.expenseList.length > 0) {
                    this.removeTransaction(this.expenseList[this.expenseList.length - 1]);
                } else {
                    alert("No expenses to remove.");
                }
            });
        } 

        if (removeIncomeButton) {
            removeIncomeButton.addEventListener("click", (event) => {
                event.preventDefault();
                if (this.incomeList.length > 0) {
                    this.removeTransaction(this.incomeList[this.incomeList.length - 1]);
                } else {
                    alert("No income to remove.");
                }
            });
        } 

        const goalsListEl = document.getElementById("goalsList");
        if (removeGoalButton && goalsListEl) {
            removeGoalButton.addEventListener("click", (event) => {
                event.preventDefault();
                if (this.goalsList && this.goalsList.length > 0) {
                    this.goalsList.pop();
                    this.saveGoals();
                    this.displayGoals();
                    this.calculateAndDisplayTotals();
                } else {
                    alert("No goals to remove.");
                }
            });
        } 

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('currentUser');
                alert('You have been logged out.');
                window.location.href = 'index.html';
            });
        }

        if (allocateBtn) {
            allocateBtn.addEventListener("click", (event) => {
                event.preventDefault();
                const goalDropdown = document.getElementById("goalDropdown");
                const distributionAmount = document.getElementById("distributionAmount");
                const idx = parseInt(goalDropdown.value);
                const amount = parseFloat(distributionAmount.value);

                // Only allow allocation if enough balance
                const balance = this.incomeList.reduce((sum, item) => sum + parseFloat(item.amount), 0) -
                                this.expenseList.reduce((sum, item) => sum + parseFloat(item.amount), 0);

                if (isNaN(idx) || isNaN(amount) || amount <= 0) {
                    alert("Please select a goal and enter a valid amount.");
                    return;
                }
                if (amount > balance) {
                    alert("Not enough balance to allocate.");
                    return;
                }

                // If amount + balance exceeds goal amount, alert and return
                if (this.goalsList[idx] && (this.goalsList[idx].progress + amount > this.goalsList[idx].amount)) {
                    alert(`Allocating $${amount} exceeds the goal amount of $${this.goalsList[idx].amount}. Please enter a smaller amount.`);
                    return;
                }   
                this.addProgressToGoal(idx, amount);
                distributionAmount.value = '';
            
            });
        }
    }
}

// Instantiate BudgetManager when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    new BudgetManager();

    // Print current user's expense and income arrays to the console
    const username = localStorage.getItem('currentUser');
    const expenses = localStorage.getItem(`expense_list_${username}`);
    const income = localStorage.getItem(`income_list_${username}`);

    console.log("Expenses array:", expenses ? JSON.parse(expenses) : []);
    console.log("Income array:", income ? JSON.parse(income) : []);
});
