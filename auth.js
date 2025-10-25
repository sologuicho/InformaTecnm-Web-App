// Configuración de MSAL
const MSAL_CONFIG = {
    auth: {
        clientId: 'f9467bc5-d6d0-4200-98c1-887bfc90fc86',
        authority: 'https://login.microsoftonline.com/7aeff8771-a4f2-4f05-8abb-1f87bfc47a21',
        redirectUri: 'https://sologuicho.github.io/InformaTecnm-WebApp/',
        postLogoutRedirectUri: 'https://sologuicho.github.io/InformaTecnm-WebApp/'
    },
    cache: {
        cacheLocation: 'localStorage',
        storeAuthStateInCookie: false
    }
};

// Inicializar MSAL
let msalInstance = null;

try {
    msalInstance = new msal.PublicClientApplication(MSAL_CONFIG);
    
    // Manejar redirección después de login
    msalInstance.initialize().then(() => {
        msalInstance.handleRedirectPromise().then(handleResponse).catch(error => {
            console.error('Error handling redirect promise:', error);
        });
    });
} catch (error) {
    console.error('Error initializing MSAL:', error);
}

function handleResponse(response) {
    if (response) {
        console.log('Login redirect successful:', response);
        // Usuario autenticado por redirección
        window.location.href = window.location.origin + window.location.pathname;
    }
}

// Microsoft OAuth Login Function usando MSAL
async function MicrosoftOAuthLogin() {
    if (!msalInstance) {
        throw new Error('MSAL no está inicializado correctamente');
    }
    
    try {
        console.log('Iniciando login con MSAL...');
        
        const loginRequest = {
            scopes: ['User.Read', 'openid', 'profile'],
            prompt: 'select_account'
        };

        // Usar popup para mejor UX
        const loginResponse = await msalInstance.loginPopup(loginRequest);
        console.log('Login exitoso:', loginResponse);

        // Obtener información del usuario
        const userInfo = await getUserInfo(loginResponse.accessToken);
        
        // Guardar en localStorage
        handleAuthentication({
            ...userInfo,
            accessToken: loginResponse.accessToken
        });

        return userInfo;

    } catch (error) {
        console.error('Error en login MSAL:', error);
        
        // Manejar errores específicos
        if (error.errorCode === 'interaction_required') {
            throw new Error('Se requiere interacción adicional. Por favor intenta nuevamente.');
        } else if (error.errorCode) {
            throw new Error(`Error de autenticación: ${error.errorMessage || error.errorCode}`);
        } else {
            throw new Error('Error al iniciar sesión: ' + error.message);
        }
    }
}

// Función para obtener información del usuario
async function getUserInfo(accessToken) {
    try {
        console.log('Obteniendo información del usuario...');
        
        const response = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }

        const userData = await response.json();
        console.log('Datos del usuario obtenidos:', userData);

        return {
            userId: userData.id,
            email: userData.mail || userData.userPrincipalName,
            name: userData.displayName || userData.userPrincipalName.split('@')[0]
        };

    } catch (error) {
        console.error('Error obteniendo información del usuario:', error);
        // Si falla, devolver información básica del token
        return {
            userId: 'unknown',
            email: 'user@example.com',
            name: 'Usuario'
        };
    }
}

// Manejar estado de autenticación
function handleAuthentication(userInfo) {
    if (userInfo && userInfo.userId) {
        localStorage.setItem('userId', userInfo.userId);
        localStorage.setItem('accessToken', userInfo.accessToken);
        localStorage.setItem('userEmail', userInfo.email);
        localStorage.setItem('userName', userInfo.name);
        localStorage.setItem('loginMethod', 'msal');
        
        console.log('Autenticación guardada en localStorage');
        return true;
    }
    return false;
}

// Verificar si el usuario está autenticado
function isAuthenticated() {
    const token = localStorage.getItem('accessToken');
    const method = localStorage.getItem('loginMethod');
    
    if (token && method === 'msal') {
        return true;
    }
    return false;
}

// Cerrar sesión
async function logout() {
    try {
        // Limpiar localStorage
        localStorage.removeItem('userId');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        localStorage.removeItem('loginMethod');
        localStorage.removeItem('aiCheckCompleted');
        localStorage.removeItem('lastSubmittedArticle');
        
        // Cerrar sesión en MSAL si está disponible
        if (msalInstance) {
            await msalInstance.logoutPopup({
                postLogoutRedirectUri: MSAL_CONFIG.auth.postLogoutRedirectUri
            });
        }
        
        console.log('Logout exitoso');
        
    } catch (error) {
        console.error('Error en logout:', error);
        // Forzar recarga incluso si hay error
        window.location.reload();
    }
}

// Obtener información del usuario actual
function getCurrentUser() {
    if (isAuthenticated()) {
        return {
            userId: localStorage.getItem('userId'),
            email: localStorage.getItem('userEmail'),
            name: localStorage.getItem('userName'),
            accessToken: localStorage.getItem('accessToken')
        };
    }
    return null;
}
