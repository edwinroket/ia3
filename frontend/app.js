document.addEventListener('DOMContentLoaded', function () {
    const sendBtn = document.getElementById('send-btn');
    const playAudioBtn = document.getElementById('play-audio-btn');
    const userInput = document.getElementById('user-input');
    const chatBody = document.getElementById('chat-body');
    const showPdfsBtn = document.getElementById('show-pdfs-btn');
    const pdfContainer = document.getElementById('pdf-container');
    const pdfIframe = document.getElementById('pdf-iframe');
    const closePdfBtn = document.getElementById('close-pdf-btn');
    const toggleChatBtn = document.getElementById('toggle-chat-btn');
    const chatContainer = document.getElementById('chat-container');
    const logosContainer = document.getElementById('logos-container');

    let currentAudioUrl = '';

    // Función para enviar el mensaje
    function handleSendMessage() {
        const message = userInput.value.trim();

        if (message === '') {
            return;
        }

        // Mostrar el mensaje del usuario
        const userMessageElement = document.createElement('div');
        userMessageElement.classList.add('message', 'user-message');
        userMessageElement.innerText = message;
        chatBody.appendChild(userMessageElement);

        // Enviar el mensaje al backend
        fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message }),
        })
        .then(response => response.json())
        .then(data => {
            const reply = data.reply;
            currentAudioUrl = `http://localhost:5000${data.audio_url}`; // Guardar la URL del audio

            // Mostrar la respuesta del bot
            const botMessageElement = document.createElement('div');
            botMessageElement.classList.add('message', 'bot-message');
            botMessageElement.innerText = reply; // Mostrar el mensaje sin "Tomasín:"
            chatBody.appendChild(botMessageElement);

            // Limpiar el input después de recibir la respuesta
            userInput.value = '';

            // Mostrar el botón de reproducción de audio
            playAudioBtn.style.display = 'block';

            // Desplazar el chat hacia abajo
            scrollChatToBottom();
        })
        .catch(error => {
            console.error('Error al enviar el mensaje:', error);
        });

        // Limpiar el campo de entrada al enviar el mensaje
        userInput.value = ''; // Asegúrate de que se borre el input después de presionar "Enter"
    }

    userInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            handleSendMessage();
        }
    });

    // Enviar el mensaje al hacer clic en "Enviar"
    sendBtn.addEventListener('click', handleSendMessage);

    // Reproducir el audio
    playAudioBtn.addEventListener('click', function () {
        if (currentAudioUrl) {
            const audio = new Audio(currentAudioUrl);
            
            // Deshabilitar el botón mientras se reproduce el audio
            playAudioBtn.disabled = true;
            
            audio.play();
            
            // Volver a habilitar el botón cuando el audio haya terminado
            audio.addEventListener('ended', function() {
                playAudioBtn.disabled = false; // Rehabilitar el botón al terminar
            });
        }
    });

    // Mostrar la sección de PDFs
    showPdfsBtn.addEventListener('click', function () {
        pdfContainer.style.display = 'flex';
        pdfIframe.src = 'pdf/explicacion.pdf'; // Ajusta la ruta del PDF
    });

    // Cerrar la sección de PDFs
    closePdfBtn.addEventListener('click', function () {
        pdfContainer.style.display = 'none';
        pdfIframe.src = '';
    });

    // Función para desplazar el chat al final
    function scrollChatToBottom() {
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    // Función para abrir y cerrar el chatbot
    toggleChatBtn.addEventListener('click', function() {
        const isChatOpen = chatContainer.style.display === 'flex';
        
        if (isChatOpen) {
            chatContainer.style.display = 'none'; // Cerrar el chatbot
            logosContainer.style.display = 'none'; // Ocultar logos
            toggleChatBtn.src = 'images/openbutton.png'; // Cambiar a imagen de abrir
            showPdfsBtn.style.display = 'none'; // Ocultar el botón "¿Cómo funciona?"
        } else {
            chatContainer.style.display = 'flex'; // Abrir el chatbot
            logosContainer.style.display = 'flex'; // Mostrar logos
            toggleChatBtn.src = 'images/closebutton.png'; // Cambiar a imagen de cerrar
            showPdfsBtn.style.display = 'block'; // Mostrar el botón "¿Cómo funciona?"
        }
    });
});