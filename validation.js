class AuthService {
    constructor() {
        this.usersKey = 'users';
        this.currentUserKey = 'currentUser';
    }

    // User Data Management  
    getUsers() {
        try {
            const users = JSON.parse(localStorage.getItem(this.usersKey));
            return users || {}; // Return an empty object if no users are stored yet
        } catch (e) {
            console.error("Error in retrieving user from localStorage:", e);
            return {};
        }
    }

    saveUsers(users) {
        localStorage.setItem(this.usersKey, JSON.stringify(users));
    }

    getCurrentUser() {
        return localStorage.getItem(this.currentUserKey);
    }

    setCurrentUser(username) {
        localStorage.setItem(this.currentUserKey, username);
    }

    clearCurrentUser() {
        localStorage.removeItem(this.currentUserKey);
    }

    // Authentication 
    signup(username, password, confirmPassword) {
        let users = this.getUsers();

        // Validation
        if (username.length < 3) {
            return { success: false, message: 'Username must be at least 3 characters long.', field: 'signupUsername' };
        }
        if (password === '' || password === null) {
            return { success: false, message: 'Password is required.', field: 'signupPassword' };
        }
        if (password.length < 8) {
            return { success: false, message: 'Password must be at least 8 characters long.', field: 'signupPassword' };
        }
        if (password !== confirmPassword) {
            return { success: false, message: 'Passwords do not match.', field: 'signupConfirmPassword' };
        }
        if (users[username]) {
            return { success: false, message: 'Username already exists. Please choose another.', field: 'signupUsername' };
        }

        // Store user
        users[username] = { password: password };
        this.saveUsers(users);
        return { success: true, message: 'Account created successfully! You can now log in.' };
    }

    login(username, password) {
        const users = this.getUsers();

        // Validation
        if (username === '' || username === null) {
            return { success: false, message: 'Username is required', field: 'loginUsername' };
        }
        if (password === '' || password === null) {
            return { success: false, message: 'Password is required', field: 'loginPassword' };
        }

        // Check credentials
        if (!users[username] || users[username].password !== password) {
            return { success: false, message: 'Invalid username or password.', field: 'loginCredentials' };
        }

        // Login successful
        this.setCurrentUser(username);
        return { success: true, message: `Welcome back, ${username}! Redirecting to account.` };
    }

    redirectToAccessPage() {
        window.location.href = 'access.html';
    }
}

class AuthUI {
    constructor(authService) {
        this.authService = authService; 
        this.domElements = {};
        this.getDOMElements();
        this.addEventListeners();
        this.initialCheck();
    }

    getDOMElements() {
        // Signup elements
        this.domElements.signupForm = document.getElementById('signup-form');
        this.domElements.signupUsernameInput = document.getElementById('signup-username');
        this.domElements.signupPasswordInput = document.getElementById('signup-password');
        this.domElements.signupConfirmPasswordInput = document.getElementById('signup-confirm-password');
        this.domElements.signupErrorMessage = document.getElementById('signup-error-message');

        // Login elements
        this.domElements.loginForm = document.getElementById('login-form');
        this.domElements.loginUsernameInput = document.getElementById('username');
        this.domElements.loginPasswordInput = document.getElementById('password');
        this.domElements.loginErrorMessage = document.getElementById('login-error-message');

        // Screen elements
        this.domElements.welcomeScreen = document.querySelector('.welcome-screen');
        this.domElements.loginScreen = document.querySelector('.login-screen');
        this.domElements.signupScreen = document.querySelector('.signup-screen');
    }

    showErrorMessage(element, message) {
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
        }
    }

    hideErrorMessage(element) {
        if (element) {
            element.textContent = '';
            element.style.display = 'none';
        }
    }

    addInvalidClass(inputElement) {
        if (inputElement && inputElement.parentElement) {
            inputElement.parentElement.classList.add('Invalid');
        }
    }

    removeInvalidClass(inputElement) {
        if (inputElement && inputElement.parentElement) {
            inputElement.parentElement.classList.remove('Invalid');
        }
    }

    // Event Listeners 
    addEventListeners() {
        if (this.domElements.signupForm) {
            this.domElements.signupForm.addEventListener('submit', this.handleSignup.bind(this));
        }

        if (this.domElements.loginForm) {
            this.domElements.loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        
        // Remove 'Invalid' class on input
        [
            this.domElements.loginUsernameInput,
            this.domElements.loginPasswordInput,
            this.domElements.signupUsernameInput,
            this.domElements.signupPasswordInput,
            this.domElements.signupConfirmPasswordInput
        ].forEach(input => {
            if (input) {
                input.addEventListener('input', () => {
                    this.removeInvalidClass(input);
                    // Clear specific error messages when input changes
                    if (input === this.domElements.loginUsernameInput || input === this.domElements.loginPasswordInput) {
                        this.hideErrorMessage(this.domElements.loginErrorMessage);
                    } else {
                        this.hideErrorMessage(this.domElements.signupErrorMessage);
                    }
                });
            }
        });
    }





    // Event Handlers
    handleSignup(e) {
        e.preventDefault();
        this.hideErrorMessage(this.domElements.signupErrorMessage);

        const username = this.domElements.signupUsernameInput.value.trim();
        const password = this.domElements.signupPasswordInput.value;
        const confirmPassword = this.domElements.signupConfirmPasswordInput.value;

        const result = this.authService.signup(username, password, confirmPassword);

        if (!result.success) {
            this.showErrorMessage(this.domElements.signupErrorMessage, result.message);
            // Add 'Invalid' class based on the 'field' returned from AuthService
            if (result.field === 'signupUsername') this.addInvalidClass(this.domElements.signupUsernameInput);
            if (result.field === 'signupPassword') this.addInvalidClass(this.domElements.signupPasswordInput);
            if (result.field === 'signupConfirmPassword') this.addInvalidClass(this.domElements.signupConfirmPasswordInput);
        } else {
            alert(result.message);
            // Navigate to login screen after successful signup
            if (window.showScreen) {
                window.showScreen(this.domElements.loginScreen, 'login-active');

                // Type check of user input
                console.log(
                    "Types:",
                    typeof username,             // string
                    typeof password,             // string
                    typeof confirmPassword       // string
                );
            }
        }
    }

    handleLogin(e) {
        e.preventDefault();
        this.hideErrorMessage(this.domElements.loginErrorMessage);

        const username = this.domElements.loginUsernameInput.value.trim();
        const password = this.domElements.loginPasswordInput.value;

        const result = this.authService.login(username, password);

        if (!result.success) {
            this.showErrorMessage(this.domElements.loginErrorMessage, result.message);
            // Add 'Invalid' class based on the 'field' returned from AuthService
            if (result.field === 'loginUsername') this.addInvalidClass(this.domElements.loginUsernameInput);
            if (result.field === 'loginPassword') this.addInvalidClass(this.domElements.loginPasswordInput);
        } else {
            alert(result.message);
            this.authService.redirectToAccessPage();

            // Type check of user input
            console.log(
                "Types:",
                typeof username,             // string
                typeof password              // string
            );
        }
    }

    // Initial Load Check
    initialCheck() {
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
            this.authService.redirectToAccessPage();
        } else {
            if (window.showScreen) {
                window.showScreen(this.domElements.welcomeScreen);
            }
        }
    }
}

// Initialize the application once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const authService = new AuthService();
    new AuthUI(authService);
});