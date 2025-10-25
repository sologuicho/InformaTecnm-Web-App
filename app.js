// Aplicación principal
$(document).ready(function() {
    // Inicializar editor
    initializeEditor();
    
    // Estado de la aplicación
    let isLoggedIn = false;
    
    // Verificar autenticación al cargar
    if (isAuthenticated()) {
        const user = getCurrentUser();
        isLoggedIn = true;
        $('#login-btn').html(`<i class="fas fa-user-circle mr-2"></i> ${user.name}`);
        
        // Mostrar dashboard automáticamente si está logueado
        $('#main-portal').addClass('hidden');
        $('#writing-dashboard').removeClass('hidden');
    }
    
    // Manejar login
    $('#login-btn').click(function() {
        if (isLoggedIn) {
            // Si ya está logueado, mostrar opción de logout
            if (confirm('¿Deseas cerrar sesión?')) {
                logout();
                window.location.reload();
            }
        } else {
            $('#login-modal').removeClass('hidden').addClass('fade-in');
        }
    });
    
    // Cerrar modal de login
    $('#close-login-modal').click(function() {
        $('#login-modal').addClass('hidden');
    });
    
    // Login con Microsoft - ACTUALIZADO CON MSAL
    $('#microsoft-login-btn').click(function() {
        const button = $(this);
        const originalText = button.html();
        
        button.prop('disabled', true).addClass('loading');
        button.html('<i class="fas fa-spinner fa-spin mr-2"></i> Conectando...');
        
        MicrosoftOAuthLogin()
            .then(function(userInfo) {
                if (userInfo) {
                    isLoggedIn = true;
                    $('#login-modal').addClass('hidden');
                    $('#login-btn').html(`<i class="fas fa-user-circle mr-2"></i> ${userInfo.name}`);
                    $('#main-portal').addClass('hidden');
                    $('#writing-dashboard').removeClass('hidden').addClass('fade-in');
                    
                    // Mostrar mensaje de bienvenida
                    showNotification(`¡Bienvenido ${userInfo.name}!`, 'success');
                }
            })
            .catch(function(error) {
                console.error('Login failed:', error);
                showNotification('Error al iniciar sesión: ' + error.message, 'error');
            })
            .finally(function() {
                button.prop('disabled', false).removeClass('loading');
                button.html(originalText);
            });
    });
    
    // Toggle AI Panel
    $('#toggle-ai-panel').click(function() {
        const panel = $('#ai-feedback-panel');
        if(panel.hasClass('hidden')) {
            panel.removeClass('hidden');
            $('#panel-text').text('Ocultar Panel');
        } else {
            panel.addClass('hidden');
            $('#panel-text').text('Panel IA');
        }
    });
    
    // Revisar con IA
    $('#check-ai-btn').click(function() {
        const button = $(this);
        button.prop('disabled', true).addClass('loading');
        button.html('<i class="fas fa-spinner fa-spin mr-2"></i> Analizando...');
        
        // Mostrar panel de IA si está oculto
        if($('#ai-feedback-panel').hasClass('hidden')) {
            $('#ai-feedback-panel').removeClass('hidden');
            $('#panel-text').text('Ocultar Panel');
        }
        
        checkWithAI().then(suggestions => {
            let feedbackHTML = '';
            
            if (suggestions && suggestions.length > 0) {
                suggestions.forEach(suggestion => {
                    const typeClass = suggestion.type === 'suggestion' ? 'border-l-4 border-blue-500 bg-blue-50 pl-3 mb-3' : 
                                    suggestion.type === 'correction' ? 'border-l-4 border-red-500 bg-red-50 pl-3 mb-3' : 
                                    'border-l-4 border-yellow-500 bg-yellow-50 pl-3 mb-3';
                    
                    const icon = suggestion.type === 'suggestion' ? 'fa-lightbulb' : 
                               suggestion.type === 'correction' ? 'fa-exclamation-circle' : 
                               'fa-check-circle';
                    
                    const iconColor = suggestion.type === 'suggestion' ? 'text-blue-600' : 
                                    suggestion.type === 'correction' ? 'text-red-600' : 
                                    'text-yellow-600';
                    
                    feedbackHTML += `
                        <div class="${typeClass} p-3 rounded">
                            <div class="flex items-start">
                                <i class="fas ${icon} ${iconColor} mt-1 mr-2"></i>
                                <div>
                                    <p class="font-medium text-sm text-gray-800">${suggestion.title}</p>
                                    <p class="text-sm mt-1 text-gray-600">${suggestion.message}</p>
                                </div>
                            </div>
                        </div>
                    `;
                });
            } else {
                feedbackHTML = `
                    <div class="border-l-4 border-green-500 bg-green-50 pl-3 p-3 rounded">
                        <div class="flex items-start">
                            <i class="fas fa-check-circle text-green-600 mt-1 mr-2"></i>
                            <div>
                                <p class="font-medium text-sm text-gray-800">¡Excelente trabajo!</p>
                                <p class="text-sm mt-1 text-gray-600">Tu artículo parece estar bien escrito y estructurado.</p>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            $('#ai-feedback-content').html(feedbackHTML);
            
            button.prop('disabled', false).removeClass('loading');
            button.html('<i class="fas fa-spell-check mr-2"></i> Revisar con IA');
            
            localStorage.setItem('aiCheckCompleted', 'true');
            
            // Mostrar notificación de éxito
            showNotification('Análisis completado con IA', 'success');
        }).catch(error => {
            console.error('Error en análisis IA:', error);
            showNotification('Error en el análisis con IA', 'error');
            button.prop('disabled', false).removeClass('loading');
            button.html('<i class="fas fa-spell-check mr-2"></i> Revisar con IA');
        });
    });
    
    // Enviar artículo
    $('#submit-article-btn').click(function() {
        const aiChecked = localStorage.getItem('aiCheckCompleted') === 'true';
        const title = $('#article-title').val().trim();
        const category = $('#article-category').val();
        const content = quill.root.innerHTML;
        const textContent = quill.getText().trim();
        
        // Validaciones
        if(!title) {
            showNotification('Por favor, ingresa un título para tu artículo.', 'error');
            return;
        }
        
        if(!category) {
            showNotification('Por favor, selecciona una categoría para tu artículo.', 'error');
            return;
        }
        
        if(!content || textContent.length < 50) {
            showNotification('El artículo es demasiado corto. Por favor, escribe al menos 50 caracteres.', 'error');
            return;
        }
        
        if(!aiChecked && !confirm('No has revisado tu artículo con IA. ¿Estás seguro de que quieres enviarlo sin revisión?')) {
            return;
        }
        
        const button = $(this);
        button.prop('disabled', true).addClass('loading');
        button.html('<i class="fas fa-spinner fa-spin mr-2"></i> Enviando...');
        
        const articleData = {
            title,
            category,
            content,
            textContent,
            author: getCurrentUser()?.name || 'Usuario',
            timestamp: new Date().toISOString()
        };
        
        submitArticle(articleData).then(result => {
            if (result.success) {
                $('#writing-dashboard').addClass('hidden');
                $('#submission-confirmation').removeClass('hidden').addClass('fade-in');
                
                // Limpiar formulario
                clearEditor();
                localStorage.removeItem('aiCheckCompleted');
                
                // Mostrar notificación de éxito
                showNotification('¡Artículo enviado exitosamente!', 'success');
            } else {
                throw new Error('Error al enviar el artículo');
            }
        }).catch(error => {
            console.error('Error enviando artículo:', error);
            showNotification('Error al enviar el artículo: ' + error.message, 'error');
        }).finally(() => {
            button.prop('disabled', false).removeClass('loading');
            button.html('<i class="fas fa-paper-plane mr-2"></i> Enviar Artículo');
        });
    });
    
    // Escribir otro artículo
    $('#write-another-btn').click(function() {
        $('#submission-confirmation').addClass('hidden');
        $('#writing-dashboard').removeClass('hidden').addClass('fade-in');
    });
    
    // Volver a artículos públicos
    $('#articulos-btn').click(function() {
        if(isLoggedIn) {
            $('#writing-dashboard').addClass('hidden');
            $('#submission-confirmation').addClass('hidden');
        }
        $('#main-portal').removeClass('hidden').addClass('fade-in');
    });
    
    // Selección de categorías
    $('.category-card').click(function() {
        $('.category-card').removeClass('active-category');
        $(this).addClass('active-category');
        
        const category = $(this).find('h3').text();
        // En una implementación real, aquí filtrarías los artículos
        console.log('Categoría seleccionada:', category);
        
        // Mostrar notificación
        showNotification(`Filtrando por: ${category}`, 'info');
    });
    
    // Cerrar modal al hacer clic fuera
    $('#login-modal').click(function(e) {
        if (e.target === this) {
            $(this).addClass('hidden');
        }
    });
    
    // Función para mostrar notificaciones (mejorada)
    function showNotification(message, type = 'info') {
        // Crear elemento de notificación
        const notification = $(`
            <div class="fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 p-4 transform transition-transform duration-300 ${
                type === 'success' ? 'border-green-500' : 
                type === 'error' ? 'border-red-500' : 
                type === 'warning' ? 'border-yellow-500' : 'border-blue-500'
            }">
                <div class="flex items-center">
                    <i class="fas ${
                        type === 'success' ? 'fa-check-circle text-green-500' : 
                        type === 'error' ? 'fa-exclamation-circle text-red-500' : 
                        type === 'warning' ? 'fa-exclamation-triangle text-yellow-500' : 'fa-info-circle text-blue-500'
                    } mr-3"></i>
                    <div class="flex-1">
                        <p class="text-sm font-medium text-gray-900">${message}</p>
                    </div>
                    <button class="ml-4 text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `);
        
        // Agregar al body
        $('body').append(notification);
        
        // Animación de entrada
        setTimeout(() => {
            notification.addClass('translate-x-0');
        }, 10);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            notification.remove();
        }, 5000);
        
        // Cerrar al hacer clic en la X
        notification.find('button').click(function() {
            notification.remove();
        });
    }
    
    // Mejoras de UX: Efectos de hover en tarjetas
    $('.article-card, .category-card').hover(
        function() {
            $(this).addClass('transform scale-105 shadow-md');
        },
        function() {
            $(this).removeClass('transform scale-105 shadow-md');
        }
    );
    
    // Buscar artículos
    $('input[type="text"]').on('input', function() {
        const searchTerm = $(this).val().toLowerCase();
        if (searchTerm.length > 2) {
            $('.article-card').each(function() {
                const title = $(this).find('h3').text().toLowerCase();
                const content = $(this).find('p').text().toLowerCase();
                
                if (title.includes(searchTerm) || content.includes(searchTerm)) {
                    $(this).show();
                } else {
                    $(this).hide();
                }
            });
        } else {
            $('.article-card').show();
        }
    });
    
    // Inicializar tooltips si existen
    $('[title]').tooltip();
});
