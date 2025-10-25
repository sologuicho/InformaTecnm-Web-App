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
    }
    
    // Manejar login
    $('#login-btn').click(function() {
        $('#login-modal').removeClass('hidden').addClass('fade-in');
    });
    
    // Cerrar modal de login
    $('#close-login-modal').click(function() {
        $('#login-modal').addClass('hidden');
    });
    
    // Login con Microsoft
    $('#microsoft-login-btn').click(function() {
        const button = $(this);
        const originalText = button.html();
        
        button.prop('disabled', true).addClass('loading');
        button.html('<i class="fas fa-spinner fa-spin mr-2"></i> Conectando...');
        
        MicrosoftOAuthLogin()
            .then(function(userInfo) {
                if (handleAuthentication(userInfo)) {
                    isLoggedIn = true;
                    $('#login-modal').addClass('hidden');
                    $('#login-btn').html(`<i class="fas fa-user-circle mr-2"></i> ${userInfo.name}`);
                    $('#main-portal').addClass('hidden');
                    $('#writing-dashboard').removeClass('hidden');
                }
            })
            .catch(function(error) {
                console.error('Login failed:', error);
                alert('Error al iniciar sesión: ' + error.message);
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
            
            suggestions.forEach(suggestion => {
                const typeClass = suggestion.type === 'suggestion' ? 'ai-suggestion' : 
                                suggestion.type === 'correction' ? 'ai-correction' : 
                                'border-l-4 border-yellow-500 pl-3 mb-3';
                
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
                                <p class="font-medium text-sm">${suggestion.title}</p>
                                <p class="text-sm mt-1">${suggestion.message}</p>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            $('#ai-feedback-content').html(feedbackHTML);
            
            button.prop('disabled', false).removeClass('loading');
            button.html('<i class="fas fa-spell-check mr-2"></i> Revisar con IA');
            
            localStorage.setItem('aiCheckCompleted', 'true');
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
            alert('Por favor, ingresa un título para tu artículo.');
            return;
        }
        
        if(!category) {
            alert('Por favor, selecciona una categoría para tu artículo.');
            return;
        }
        
        if(!content || textContent.length < 50) {
            alert('El artículo es demasiado corto. Por favor, escribe al menos 50 caracteres.');
            return;
        }
        
        if(!aiChecked) {
            alert('Por favor, revisa tu artículo con IA antes de enviarlo.');
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
            }
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
    });
    
    // Cerrar modal al hacer clic fuera
    $('#login-modal').click(function(e) {
        if (e.target === this) {
            $(this).addClass('hidden');
        }
    });
});