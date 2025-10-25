// Configuración de MSAL - CORREGIDO
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

// Variable global para MSAL
let msalInstance = null;

// Inicializar MSAL
function initializeMSAL() {
    try {
        if (window.msal && window.msal.PublicClientApplication) {
            msalInstance = new msal.PublicClientApplication(MSAL_CONFIG);
            
            msalInstance.initialize().then(() => {
                console.log('MSAL inicializado correctamente');
                msalInstance.handleRedirectPromise().then(handleResponse).catch(error => {
                    console.error('Error en redirect promise:', error);
                });
            }).catch(error => {
                console.error('Error inicializando MSAL:', error);
            });
        } else {
            console.error('MSAL no está cargado correctamente');
        }
    } catch (error) {
        console.error('Error creando instancia MSAL:', error);
    }
}

// Llamar a inicialización cuando MSAL esté cargado
if (typeof msal !== 'undefined') {
    initializeMSAL();
} else {
    // Esperar a que MSAL se cargue
    window.addEventListener('load', initializeMSAL);
}

function handleResponse(response) {
    if (response) {
        console.log('Login redirect successful:', response);
        window.location.href = window.location.origin + window.location.pathname;
    }
}

// Microsoft OAuth Login Function usando MSAL
async function MicrosoftOAuthLogin() {
    // Verificar que MSAL esté cargado
    if (typeof msal === 'undefined') {
        throw new Error('MSAL.js no está cargado. Verifica que el script esté incluido correctamente.');
    }
    
    if (!msalInstance) {
        initializeMSAL();
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (!msalInstance) {
        throw new Error('No se pudo inicializar MSAL. Por favor recarga la página.');
    }
    
    try {
        console.log('Iniciando login con MSAL...');
        
        const loginRequest = {
            scopes: ['User.Read'],
            prompt: 'select_account'
        };

        console.log('Abriendo popup de login...');
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
        
        // Manejar errores específicos de MSAL
        if (error.errorCode) {
            switch (error.errorCode) {
                case 'interaction_required':
                    throw new Error('Se requiere interacción adicional. Por favor intenta nuevamente.');
                case 'user_cancelled':
                    throw new Error('El usuario canceló el inicio de sesión.');
                case 'popup_window_error':
                    throw new Error('Error con la ventana emergente. Por favor permite ventanas emergentes para este sitio.');
                default:
                    throw new Error(`Error de autenticación: ${error.errorMessage || error.errorCode}`);
            }
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
            name: userData.displayName || userData.userPrincipalName.split('@')[0] || 'Usuario'
        };

    } catch (error) {
        console.error('Error obteniendo información del usuario:', error);
        // Si falla, devolver información básica
        return {
            userId: 'unknown-' + Date.now(),
            email: 'user@example.com',
            name: 'Usuario'
        };
    }
}

// Manejar estado de autenticación
function handleAuthentication(userInfo) {
    if (userInfo && userInfo.accessToken) {
        localStorage.setItem('userId', userInfo.userId);
        localStorage.setItem('accessToken', userInfo.accessToken);
        localStorage.setItem('userEmail', userInfo.email);
        localStorage.setItem('userName', userInfo.name);
        localStorage.setItem('loginMethod', 'msal');
        localStorage.setItem('loginTime', new Date().toISOString());
        
        console.log('Autenticación guardada en localStorage');
        return true;
    }
    return false;
}

// Verificar si el usuario está autenticado
function isAuthenticated() {
    const token = localStorage.getItem('accessToken');
    const method = localStorage.getItem('loginMethod');
    const loginTime = localStorage.getItem('loginTime');
    
    if (token && method === 'msal' && loginTime) {
        // Verificar que el login no sea muy antiguo (opcional)
        const loginDate = new Date(loginTime);
        const now = new Date();
        const hoursDiff = (now - loginDate) / (1000 * 60 * 60);
        
        // Considerar válido si tiene menos de 24 horas
        return hoursDiff < 24;
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
        localStorage.removeItem('loginTime');
        localStorage.removeItem('aiCheckCompleted');
        localStorage.removeItem('lastSubmittedArticle');
        
        console.log('Sesión cerrada localmente');
        
    } catch (error) {
        console.error('Error en logout:', error);
    } finally {
        // Siempre recargar la página
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

// Función de respaldo para desarrollo
function debugAuth() {
    console.log('MSAL disponible:', typeof msal !== 'undefined');
    console.log('MSAL Instance:', msalInstance);
    console.log('Usuario autenticado:', isAuthenticated());
    console.log('Usuario actual:', getCurrentUser());
    console.log('LocalStorage:', localStorage);
}
