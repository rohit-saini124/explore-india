
let form = document.getElementById("loginForm");

form.addEventListener("submit", function(event) {

    event.preventDefault();

    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    let message = document.getElementById("message");

    if (username === "" || password === "") {
        message.innerText = "Please enter username and password";
        return;
    }

    message.innerText = "Login API will be connected next.";

});
