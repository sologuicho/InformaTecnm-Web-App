// auth.js
const msalConfig = {
    auth: {
        clientId: "f7d3cdb2-67df-4a14-9eba-4a61a4d7e9b5",
        authority: "https://login.microsoftonline.com/7aef8771-a4f2-4f05-8a4b-1f87bfcb7d2f",
        redirectUri: "https://sologuicho.github.io/InformaTecnm-Web-App/",
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    }
};

const msalInstance = new msal.PublicClientApplication(msalConfig);

const loginRequest = {
    scopes: ["User.Read"]
};

// Función para mostrar el dashboard tras login exitoso
function showWritingDashboard(account) {
    document.getElementById("main-portal").classList.add("hidden");
    document.getElementById("writing-dashboard").classList.remove("hidden");
    document.getElementById("submission-confirmation").classList.add("hidden");

    const loginBtn = document.getElementById("login-btn");
    loginBtn.textContent = `Hola, ${account.name.split(" ")[0]}`;
    loginBtn.classList.add("bg-green-600");
}

// Inicio de sesión
async function signIn() {
    try {
        const loginResponse = await msalInstance.loginPopup(loginRequest);
        const account = loginResponse.account;
        msalInstance.setActiveAccount(account);
        showWritingDashboard(account);
    } catch (error) {
        console.error("Error en inicio de sesión:", error);
        alert("Hubo un problema al iniciar sesión. Intenta de nuevo.");
    }
}

// Cierre de sesión
function signOut() {
    const logoutRequest = {
        account: msalInstance.getActiveAccount(),
        postLogoutRedirectUri: "https://sologuicho.github.io/InformaTecnm-Web-App/",
    };
    msalInstance.logoutPopup(logoutRequest);
}

// Verifica si hay sesión activa al cargar
window.onload = () => {
    const currentAccounts = msalInstance.getAllAccounts();
    if (currentAccounts && currentAccounts.length > 0) {
        msalInstance.setActiveAccount(currentAccounts[0]);
        showWritingDashboard(currentAccounts[0]);
    }
};

// Botones
document.getElementById("login-btn").addEventListener("click", signIn);
document.getElementById("close-login-modal").addEventListener("click", () => {
    document.getElementById("login-modal").classList.add("hidden");
});
document.getElementById("logout-btn").addEventListener("click", () => {
    signOut();
});
