// editor.js
let quill;

document.addEventListener("DOMContentLoaded", () => {
    quill = new Quill("#editor", {
        theme: "snow",
        placeholder: "Escribe tu artículo aquí...",
        modules: {
            toolbar: [
                [{ header: [1, 2, 3, false] }],
                ["bold", "italic", "underline"],
                ["blockquote", "code-block"],
                [{ list: "ordered" }, { list: "bullet" }],
                ["link", "image"],
                ["clean"]
            ]
        }
    });

    // Botón IA
    document.getElementById("check-ai-btn").addEventListener("click", () => {
        const content = quill.root.innerHTML;
        const aiPanel = document.getElementById("ai-feedback-panel");
        const aiContent = document.getElementById("ai-feedback-content");

        aiPanel.classList.remove("hidden");
        aiContent.innerHTML = `
            <p class="text-gray-500 italic text-sm">Analizando tu artículo...</p>
        `;

        setTimeout(() => {
            aiContent.innerHTML = `
                <div class="bg-blue-50 border border-blue-100 p-3 rounded-md">
                    <p class="text-gray-700 text-sm">
                        ✨ Tu redacción es clara. Podrías agregar más detalles técnicos en los párrafos 2 y 3 para reforzar el argumento principal.
                    </p>
                </div>
            `;
        }, 1500);
    });

    // Botón de envío
    document.getElementById("submit-article-btn").addEventListener("click", () => {
        document.getElementById("writing-dashboard").classList.add("hidden");
        document.getElementById("submission-confirmation").classList.remove("hidden");
    });

    // Botón “Escribir otro artículo”
    document.getElementById("write-another-btn").addEventListener("click", () => {
        quill.root.innerHTML = "";
        document.getElementById("submission-confirmation").classList.add("hidden");
        document.getElementById("writing-dashboard").classList.remove("hidden");
    });

    // Botón para mostrar/ocultar panel IA
    document.getElementById("toggle-ai-panel").addEventListener("click", () => {
        const aiPanel = document.getElementById("ai-feedback-panel");
        const panelText = document.getElementById("panel-text");
        aiPanel.classList.toggle("hidden");
        panelText.textContent = aiPanel.classList.contains("hidden")
            ? "Panel IA"
            : "Ocultar Panel";
    });
});
