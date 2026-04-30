// Login Form Handler
const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const studentId = document.getElementById('studentId').value;
    const password = document.getElementById('password').value;

    // Simple validation logic for student login
    if(studentId && password) {
        console.log("Logging in student:", studentId);
        alert("Login attempt successful for Student ID: " + studentId);
        // In a real app, you would send this to a server via fetch()
    } else {
        alert("Please fill in all fields.");
    }
});
