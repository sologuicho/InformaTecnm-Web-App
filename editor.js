// Inicialización y manejo del editor Quill
let quill;

function initializeEditor() {
    quill = new Quill('#editor', {
        theme: 'snow',
        placeholder: 'Comienza a escribir tu artículo aquí...',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline'],
                ['blockquote', 'code-block'],
                [{ 'header': 1 }, { 'header': 2 }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link'],
                ['clean']
            ]
        }
    });
    
    return quill;
}

// Función para revisar con IA
function checkWithAI() {
    return new Promise((resolve) => {
        const articleContent = quill.root.innerHTML;
        
        // Simular procesamiento de IA
        setTimeout(() => {
            const suggestions = [
                {
                    type: 'suggestion',
                    title: 'Sugerencia de estilo',
                    message: 'Considera reorganizar el segundo párrafo para mejorar la claridad.'
                },
                {
                    type: 'correction',
                    title: 'Corrección gramatical',
                    message: 'Se detectaron algunos errores de ortografía y puntuación.'
                },
                {
                    type: 'verification',
                    title: 'Verificación de datos',
                    message: 'Algunas estadísticas pueden requerir citas adicionales.'
                }
            ];
            
            resolve(suggestions);
        }, 1500);
    });
}

// Función para enviar artículo
function submitArticle(articleData) {
    return new Promise((resolve) => {
        // Simular envío
        setTimeout(() => {
            // Guardar en localStorage
            const articles = JSON.parse(localStorage.getItem('submittedArticles') || '[]');
            articles.push({
                ...articleData,
                id: Date.now().toString(),
                status: 'pending',
                submittedAt: new Date().toISOString()
            });
            localStorage.setItem('submittedArticles', JSON.stringify(articles));
            
            resolve({ success: true, id: Date.now().toString() });
        }, 1000);
    });
}

// Función para obtener artículos del usuario
function getUserArticles() {
    const articles = JSON.parse(localStorage.getItem('submittedArticles') || '[]');
    return articles.filter(article => article.author === getCurrentUser()?.name);
}

// Limpiar editor
function clearEditor() {
    if (quill) {
        quill.setText('');
    }
    $('#article-title').val('');
    $('#article-category').val('');
}