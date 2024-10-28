from flask import Flask, request, jsonify, send_file
from gtts import gTTS
import openai
import os
import numpy as np
import redis
from redis.commands.search.query import Query
from flask_cors import CORS

# Configuración del servidor Flask
app = Flask(__name__)
CORS(app)

# Cargar configuraciones desde las variables de entorno
redis_host = os.getenv("REDIS_HOST")
redis_port = os.getenv("REDIS_PORT")
redis_password = os.getenv("REDIS_PASSWORD")
redis_username = os.getenv("REDIS_USERNAME")
redis_index = os.getenv("REDIS_INDEX")
gpt_key = os.getenv("GPT_KEY")

# Conexión a Redis
r = redis.Redis(host=redis_host, port=redis_port, db=0, username=redis_username, password=redis_password)

# Función para realizar la búsqueda en Redis
def search(question):
    VECTOR_FIELD_NAME = "content_vector"
    openai.api_key = gpt_key
    embedded_query = np.array(openai.Embedding.create(
        input=question,
        engine="text-embedding-ada-002",
    )["data"][0]['embedding'], dtype=np.float32).tobytes()

    # Preparar la consulta
    q = Query(f'*=>[KNN 10 @{VECTOR_FIELD_NAME} $vec_param AS vector_score]').sort_by('vector_score').paging(0, 3).return_fields('content', 'vector_score').dialect(2)
    params_dict = {"vec_param": embedded_query}
    results = r.ft(redis_index).search(q, query_params=params_dict)
    
    return results

# Función para generar respuestas con OpenAI GPT
def generate_text(prompt):
    openai.api_key = gpt_key
    ai_prompt_system = """Tu nombre es Tomasín y tu principal misión es ayudar a los usuarios a responder preguntas 
            sobre la universidad Santo Tomás de Talca."""
    
    messages = [
        {"role": "system", "content": ai_prompt_system},
        {"role": "user", "content": prompt}
    ]

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.5,
            max_tokens=1000,
        )
        reply = response['choices'][0]['message']['content']
    except Exception as e:
        reply = 'Lo siento, no pude procesar tu solicitud en este momento.'

    return reply

# Ruta para manejar las solicitudes del front-end
@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_message = data.get('message')
    
    # Buscar en la base de datos (Redis)
    find_database_answer = search(user_message)
    
    # Procesar los documentos encontrados
    docs = find_database_answer.docs
    contents = [doc.content for doc in docs]

    # Crear el prompt y generar la respuesta
    prompt = f"Contexto: {contents}. Responde a la pregunta: {user_message}"
    response = generate_text(prompt)
    
    # Respuesta JSON que incluye texto y ruta del audio
    return jsonify({
        'reply': response,
        'audio_url': '/api/audio?text=' + response
    })

# Ruta para generar el audio basado en la respuesta generada
@app.route('/api/audio', methods=['GET'])
def generate_audio():
    text = request.args.get('text')
    tts = gTTS(text=text, lang='es')
    audio_file = "response.mp3"
    tts.save(audio_file)
    
    # Devolver el archivo de audio
    return send_file(audio_file, as_attachment=False)

if __name__ == '__main__':
    app.run(port=5000, debug=True)
