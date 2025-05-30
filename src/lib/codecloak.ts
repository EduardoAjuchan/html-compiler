
// Defines the character set for substitution cipher
const ORIGINAL_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#$<>/?\"'= !%&()*+,-.:;@[]^_`{|}~\n\t";
const SHIFT_AMOUNT = 7; // Arbitrary shift amount for the Caesar-like cipher

function substituteChar(char: string, direction: 'encrypt' | 'decrypt'): string {
  const index = ORIGINAL_CHARS.indexOf(char);
  if (index === -1) {
    return char; // Pass through characters not in our defined set
  }
  let newIndex;
  if (direction === 'encrypt') {
    newIndex = (index + SHIFT_AMOUNT) % ORIGINAL_CHARS.length;
  } else {
    newIndex = (index - SHIFT_AMOUNT + ORIGINAL_CHARS.length) % ORIGINAL_CHARS.length;
  }
  return ORIGINAL_CHARS[newIndex];
}

export function encrypt(text: string): string {
  return text.split('').map(char => substituteChar(char, 'encrypt')).join('');
}

export function decrypt(encryptedText: string): string {
  return encryptedText.split('').map(char => substituteChar(char, 'decrypt')).join('');
}

// Helper function to get line and column
function getLineAndColumn(text: string, index: number): { line: number, column: number } {
    const lines = text.substring(0, index).split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;
    return { line, column };
}

interface TagInfo {
  name: string;
  line: number;
  column: number;
}

export function compile(customHtml: string): { result: string | null; error: string | null } {
  const tagStack: TagInfo[] = [];
  let processedHtml = "";
  let currentIndex = 0;

  try {
    while(currentIndex < customHtml.length) {
      const currentPos = getLineAndColumn(customHtml, currentIndex);

      // Attempt to match an opening tag: #tagName attributes$
      // Attributes part (?:[^$"]*(?:"[^"]*"[^$"]*)*)* allows $ inside quoted attributes
      const openTagMatch = customHtml.substring(currentIndex).match(/^#([a-zA-Z0-9_:-]+)((?:[^$"]*(?:"[^"]*"[^$"]*)*)*)\$/);
      // Attempt to match a closing tag: #/tagName$
      const closeTagMatch = customHtml.substring(currentIndex).match(/^#\/([a-zA-Z0-9_:-]+)\$/);

      if (openTagMatch) {
        const [fullMatch, tagName, attributesString] = openTagMatch;
        const attributes = attributesString.trim();

        // Basic validation for attributes: should be key="value" (double quotes) or just key
        const validAttributesPattern = /^\s*(([a-zA-Z0-9_:-]+)(="[^"]*")?\s*)*$/;
        if (attributes && !validAttributesPattern.test(attributes)) {
            return { result: null, error: `(Línea ${currentPos.line}, Columna ${currentPos.column}): Error de sintaxis: Atributos mal formados en la etiqueta '${fullMatch.substring(0, Math.min(fullMatch.length, 30))}...'. Formato esperado: nombre="valor" o solo nombre.` };
        }

        processedHtml += `<${tagName}${attributesString}>`; // Use attributesString to preserve original spacing if any
        tagStack.push({ name: tagName, line: currentPos.line, column: currentPos.column });
        currentIndex += fullMatch.length;
      } else if (closeTagMatch) {
        const [fullMatch, tagName] = closeTagMatch;
        if (tagStack.length === 0) {
          return { result: null, error: `(Línea ${currentPos.line}, Columna ${currentPos.column}): Error de compilación: Etiqueta de cierre '${fullMatch}' inesperada. No hay etiquetas abiertas.` };
        }
        const openTag = tagStack[tagStack.length - 1];
        if (openTag.name !== tagName) {
          return { result: null, error: `(Línea ${currentPos.line}, Columna ${currentPos.column}): Error de compilación: Etiqueta de cierre no coincidente '${fullMatch}'. Se esperaba el cierre para '#${openTag.name}$' abierta en (Línea ${openTag.line}, Columna ${openTag.column}).` };
        }
        tagStack.pop();
        processedHtml += `</${tagName}>`;
        currentIndex += fullMatch.length;
      } else {
        // If it's not an opening or closing tag, it could be a malformed tag start or just text
        if (customHtml[currentIndex] === '#') {
            // Potential malformed tag. Check if it looks like an attempt at a tag but doesn't end with '$'
            // or if it's an invalid character after # or #/
            const potentialOpenTagStart = customHtml.substring(currentIndex).match(/^#[a-zA-Z0-9_:-]+/);
            const potentialCloseTagStart = customHtml.substring(currentIndex).match(/^#\/[a-zA-Z0-9_:-]+/);
            
            if (potentialOpenTagStart && !customHtml.substring(currentIndex).startsWith(potentialOpenTagStart[0] + '$') && !openTagMatch) {
                 // It starts like an open tag but doesn't end with '$' or attributes are malformed before $
                 return { result: null, error: `(Línea ${currentPos.line}, Columna ${currentPos.column}): Error de sintaxis: Etiqueta de apertura mal formada. Posiblemente falta '$' al final o los atributos son incorrectos en '${customHtml.substring(currentIndex, currentIndex + 30)}...'.` };
            }
            if (potentialCloseTagStart && !customHtml.substring(currentIndex).startsWith(potentialCloseTagStart[0] + '$') && !closeTagMatch) {
                 // It starts like a close tag but doesn't end with '$'
                 return { result: null, error: `(Línea ${currentPos.line}, Columna ${currentPos.column}): Error de sintaxis: Etiqueta de cierre mal formada. Posiblemente falta '$' al final de '${potentialCloseTagStart[0]}...'.` };
            }
            // If it's just '#' followed by something not forming a valid tag start (e.g. #?blah)
            if (!potentialOpenTagStart && !potentialCloseTagStart && customHtml.substring(currentIndex, currentIndex + 2) !== '#$' /* for empty tag like #$ which is valid text */) {
                 return { result: null, error: `(Línea ${currentPos.line}, Columna ${currentPos.column}): Error de sintaxis: Carácter '#' inválido o etiqueta mal formada comenzando con '${customHtml.substring(currentIndex, currentIndex + 10)}...'. Las etiquetas deben ser '#tag$' o '#/tag$'` };
            }
        }
        processedHtml += customHtml[currentIndex];
        currentIndex++;
      }
    }

    if (tagStack.length > 0) {
      const firstUnclosedTag = tagStack[0];
      const uniqueUnclosedTagNames = [...new Set(tagStack.map(t => t.name))];
      return { result: null, error: `Error de compilación: Hay etiquetas sin cerrar. La primera es '#${firstUnclosedTag.name}$' abierta en (Línea ${firstUnclosedTag.line}, Columna ${firstUnclosedTag.column}). Total de etiquetas sin cerrar: ${tagStack.length} (Tipos: #${uniqueUnclosedTagNames.join(', #')}).` };
    }
    return { result: processedHtml, error: null };

  } catch (e: any) {
    // Get position for unexpected errors if possible, though currentIndex might not be accurate here.
    const errorPos = getLineAndColumn(customHtml, currentIndex);
    return { result: null, error: `(Línea ${errorPos.line}, Columna ${errorPos.column}): Error de compilación inesperado: ${e.message}` };
  }
}

export function decompile(standardHtml: string): string {
  // Simple replacement, might not handle all edge cases of HTML but fits "custom HTML-like"
  let customHtml = standardHtml;
  // Process closing tags first to avoid conflicts with opening tags processing
  customHtml = customHtml.replace(/<\/(.*?)>/g, '#/$1$');
  // Process opening tags (and self-closing tags if any, though custom syntax doesn't explicitly show them)
  customHtml = customHtml.replace(/<([a-zA-Z0-9_:-]+)((?:\s+[a-zA-Z0-9_:-]+(?:=(?:"[^"]*"|'[^']*'|[^\s"'<>`=]+))?)*\s*\/?)>/g, (match, tagName, attributes) => {
    // For self-closing standard HTML tags like <br />, convert to #br$ (no specific closing tag in custom syntax)
    // Or handle them based on how custom syntax expects them. Current custom syntax always expects #tag$ and #/tag$.
    // So <br /> would become #br /$. This is fine.
    return `#${tagName}${attributes}$`;
  });
  return customHtml;
}
