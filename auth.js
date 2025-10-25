// Configuración de autenticación con Microsoft - CORREGIDO
const AUTH_CONFIG = {
    clientId: 'f9467bc5-d6d0-4200-98c1-887bfc90fc86',
    tenantId: '7aeff8771-a4f2-4f05-8abb-1f87bfc47a21',
    redirectUri: 'https://sologuicho.github.io/InformaTecnm-WebApp/', // ← "I" mayúscula
    scopes: ['openid', 'profile', 'email', 'User.Read']
};
// Microsoft OAuth Login Function
function MicrosoftOAuthLogin() {
  return new Promise((resolve, reject) => {
      const { clientId, tenantId, redirectUri, scopes } = AUTH_CONFIG;
      
      const scope = encodeURIComponent(scopes.join(' '));
      const encodedRedirectUri = encodeURIComponent(redirectUri);
      
      // URL de autorización de Microsoft
      const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodedRedirectUri}&scope=${scope}&response_mode=fragment`;
      
      // Abrir ventana de autenticación
      const authWindow = window.open(authUrl, 'microsoft-login', 'width=600,height=700,scrollbars=yes');
      
      if (!authWindow) {
          reject(new Error('El navegador bloqueó la ventana emergente. Por favor permite ventanas emergentes para este sitio.'));
          return;
      }
      
      // Verificar el resultado de la autenticación
      const checkAuthResult = setInterval(() => {
          try {
              if (authWindow.closed) {
                  clearInterval(checkAuthResult);
                  reject(new Error('El usuario cerró la ventana de autenticación'));
                  return;
              }
              
              // Verificar si la URL de la ventana contiene el token
              const currentUrl = authWindow.location.href;
              if (currentUrl.includes('access_token') || currentUrl.includes('error')) {
                  clearInterval(checkAuthResult);
                  
                  if (currentUrl.includes('access_token')) {
                      // Extraer el token de la URL
                      const hashParams = new URLSearchParams(currentUrl.split('#')[1]);
                      const accessToken = hashParams.get('access_token');
                      
                      if (accessToken) {
                          authWindow.close();
                          
                          // Obtener información del usuario con el token
                          getUserInfo(accessToken)
                              .then(userInfo => {
                                  resolve(userInfo);
                              })
                              .catch(error => {
                                  reject(error);
                              });
                      } else {
                          authWindow.close();
                          reject(new Error('No se pudo obtener el token de acceso'));
                      }
                  } else {
                      authWindow.close();
                      const errorParams = new URLSearchParams(currentUrl.split('#')[1]);
                      const error = errorParams.get('error');
                      const errorDescription = errorParams.get('error_description');
                      reject(new Error(`Error de autenticación: ${error} - ${errorDescription}`));
                  }
              }
          } catch (e) {
              // Ignorar errores de acceso entre dominios (la ventana aún no ha redirigido)
          }
      }, 100);
  });
}

// Función para obtener información del usuario
function getUserInfo(accessToken) {
  return new Promise((resolve, reject) => {
      // Usar el token para obtener datos del usuario desde Microsoft Graph
      fetch('https://graph.microsoft.com/v1.0/me', {
          headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
          }
      })
      .then(response => {
          if (!response.ok) {
              throw new Error(`Error HTTP: ${response.status}`);
          }
          return response.json();
      })
      .then(userData => {
          resolve({
              userId: userData.id,
              email: userData.mail || userData.userPrincipalName,
              name: userData.displayName,
              accessToken: accessToken
          });
      })
      .catch(error => {
          console.error('Error obteniendo información del usuario:', error);
          reject(error);
      });
  });
}

// Manejar estado de autenticación
function handleAuthentication(userInfo) {
  if (userInfo && userInfo.userId) {
      // Store authentication data in localStorage
      localStorage.setItem('userId', userInfo.userId);
      localStorage.setItem('accessToken', userInfo.accessToken);
      localStorage.setItem('userEmail', userInfo.email);
      localStorage.setItem('userName', userInfo.name);
      
      return true;
  }
  return false;
}

// Verificar si el usuario está autenticado
function isAuthenticated() {
  const userId = localStorage.getItem('userId');
  const accessToken = localStorage.getItem('accessToken');
  return !!(userId && accessToken);
}

// Cerrar sesión
function logout() {
  localStorage.removeItem('userId');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
  localStorage.removeItem('aiCheckCompleted');
  localStorage.removeItem('lastSubmittedArticle');
  
  window.location.reload();
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
