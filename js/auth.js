async function login() {

    const username =
        document.getElementById("username").value;

    const password =
        document.getElementById("password").value;

    const response =
        await fetch("config/users.json");

    const data =
        await response.json();

    const user =
        data.users.find(u =>
            u.username === username &&
            u.password === password
        );

    if (user) {

        sessionStorage.setItem(
            "spieUser",
            JSON.stringify(user)
        );

        window.location.href =
            "dashboard.html";

    }
    else {

        document.getElementById("
