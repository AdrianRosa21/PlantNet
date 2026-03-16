# **App Name**: AgroAlerta IA

## Core Features:

- Autenticación de Usuario: Permitir a los usuarios registrarse, iniciar sesión con email y contraseña, mantener la sesión y cerrar sesión de forma segura, utilizando Firebase Authentication.
- Gestión de Cultivos: Un panel de control donde los usuarios pueden ver una lista de sus cultivos, añadir nuevos cultivos (nombre, tipo, meta de riegos, observación inicial) y acceder a los detalles de cada uno. La información del cultivo se guarda en Firestore.
- Detalle del Cultivo y Notas: Visualizar información específica de un cultivo, añadir, listar y eliminar notas asociadas, con fecha de creación, todo persistido en Firestore.
- Control de Riego Diario: Registrar riegos diarios para un cultivo, actualizando un contador y un indicador visual tipo 'gota progresiva' hasta alcanzar la meta de riegos diarios.
- Recomendaciones Orientativas: Mostrar una lista de recomendaciones demo limpias y útiles asociadas a cada tipo de cultivo, que se simularán inicialmente pero estarán listas para una futura integración de IA.
- Chat por Cultivo con Carga de Imágenes: Habilitar un chat por cultivo donde el usuario puede enviar mensajes de texto y adjuntar imágenes (subidas a Firebase Storage) que se guardan en Firestore.
- Herramienta de Análisis Simulado (IA): Simular una respuesta del asistente en el chat del cultivo, la cual funciona como una herramienta de análisis que, basada en texto o imagen, genera una posible solución, nivel de urgencia y acción sugerida. Esta respuesta orientativa se guarda en Firestore.

## Style Guidelines:

- Esquema de colores claro y moderno. Color primario: Un verde profundo y natural (#338033) para simbolizar la agricultura y la seriedad. Fondo: Un verde muy claro y apenas perceptible (#F3F7F3) que mantiene la interfaz limpia y legible. Acento: Un verde amarillento vibrante (#A7D41E) para destacar llamadas a la acción y elementos interactivos.
- Fuentes 'Inter' (sans-serif) para todos los elementos de texto. Su estilo moderno y neutro asegura legibilidad y coherencia en titulares y cuerpo de texto, manteniendo una apariencia clara y funcional.
- Uso de íconos de línea sencillos y modernos que comunican claridad y funcionalidad, evitando elementos gráficos recargados para mantener el enfoque en la información agrícola.
- Diseño limpio y espacioso, priorizando la usabilidad móvil. Los elementos estarán bien organizados para una fácil navegación y rápida comprensión, vital para un contexto de defensa en vivo.
- Animaciones mínimas y sutiles, principalmente para ofrecer retroalimentación visual al usuario en acciones como el registro de riegos o la carga de datos, manteniendo la aplicación fluida y seria.