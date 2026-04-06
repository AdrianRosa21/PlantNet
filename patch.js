const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', '(dashboard)', 'crops', '[cropId]', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Reemplazar ChatService -> AgroVision
content = content.replace(
  'import { ChatService } from "@/services/chat-service";',
  'import { AgroVision } from "@/components/agro-vision";'
);

// 2. Eliminar variables de estado del chat (desde // Chat Data hasta antes de const [isEditDialogOpen...)
const chatStateRegex = /\/\/ Chat Data \(mantiene hilo unico independientemente del dia\)[\s\S]*?(?=const\s+\[isEditDialogOpen,\s+setIsEditDialogOpen\])/;
content = content.replace(chatStateRegex, '');

// 3. Eliminar efectos de chat (Speech recognition y scroll)
const chatEffectsRegex = /useEffect\(\(\) => \{\s*if \(typeof window !== "undefined"\)[\s\S]*?\}, \[chatInput\]\);/m;
content = content.replace(chatEffectsRegex, '');

// 4. Eliminar handles de envio (handleImageSelect y handleSendChatMessage)
const chatHandlesRegex = /const handleImageSelect =[\s\S]*?finally \{\s*setIsSendingChat\(false\);\s*\}\s*\};/m;
content = content.replace(chatHandlesRegex, '');

// 5. Reemplazar JSX de CHAT IA SECTION
const chatJSXRegex = /\{\/\* CHAT IA SECTION[\s\S]*?\{\/\* RECOMENDACIONES IA V3 \*\/\}/m;
content = content.replace(chatJSXRegex, `<AgroVision cropId={cropId as string} onLimitReached={() => setShowPremiumModal(true)} />\n\n        {/* RECOMENDACIONES IA V3 */}`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patch aplicado correctamente');
