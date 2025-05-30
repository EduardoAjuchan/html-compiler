
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

        if (attributes) {
            // Specific checks for common attribute syntax errors
            if (attributes.includes("='")) {
                return { result: null, error: `(Línea ${currentPos.line}, Columna ${currentPos.column + fullMatch.indexOf("='")}): Error de sintaxis en atributos: Se encontraron comillas simples. Utiliza comillas dobles para los valores de atributos (ej: nombre="valor") en '${attributesString.substring(0, Math.min(attributesString.length, 30))}...'.` };
            }
            const unquotedValueMatch = attributes.match(/([a-zA-Z0-9_:-]+)=([^"\s][^$\s]*)/);
            if (unquotedValueMatch) {
                 const errorIndex = attributes.indexOf(unquotedValueMatch[0]) + unquotedValueMatch[1].length + 1;
                return { result: null, error: `(Línea ${currentPos.line}, Columna ${currentPos.column + fullMatch.indexOf(attributes) + errorIndex}): Error de sintaxis en atributos: El valor para '${unquotedValueMatch[1]}' debe estar entre comillas dobles (ej: ${unquotedValueMatch[1]}="valor") en '${unquotedValueMatch[0].substring(0, Math.min(unquotedValueMatch[0].length, 30))}...'.` };
            }
            const invalidAttributeCharMatch = attributes.match(/[^a-zA-Z0-9_:=\-\s"']/);
            if (invalidAttributeCharMatch) {
                const errorIndex = attributes.indexOf(invalidAttributeCharMatch[0]);
                 return { result: null, error: `(Línea ${currentPos.line}, Columna ${currentPos.column + fullMatch.indexOf(attributes) + errorIndex}): Error de sintaxis en atributos: Carácter inválido '${invalidAttributeCharMatch[0]}' encontrado en la sección de atributos '${attributes.substring(0, Math.min(attributes.length, 30))}...'.`};
            }

            // General pattern for overall attribute structure: key, key="value", key key2="value2"
            const validAttributesPattern = /^\s*([a-zA-Z0-9_:-]+(\s*=\s*"[^"]*")?\s*)*$/;
            if (!validAttributesPattern.test(attributes)) {
                return { result: null, error: `(Línea ${currentPos.line}, Columna ${currentPos.column + fullMatch.indexOf(attributes)}): Error de sintaxis: Atributos mal formados en la etiqueta '${fullMatch.substring(0, Math.min(fullMatch.length, 50))}...'. Formato esperado: nombre, nombre="valor", separados por espacios.` };
            }
        }

        processedHtml += `<${tagName}${attributesString}>`;
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
        if (customHtml[currentIndex] === '#') {
            const potentialTagPortion = customHtml.substring(currentIndex, currentIndex + Math.min(30, customHtml.length - currentIndex));
            const lineStartOfPotentialTag = customHtml.substring(0, currentIndex).lastIndexOf('\n') +1;


            const potentialOpenTagStart = customHtml.substring(currentIndex).match(/^#([a-zA-Z0-9_:-]+)/);
            const potentialCloseTagStart = customHtml.substring(currentIndex).match(/^#\/([a-zA-Z0-9_:-]+)/);
            
            if (potentialOpenTagStart && !customHtml.substring(currentIndex + potentialOpenTagStart[0].length).trim().startsWith('$') && !openTagMatch) {
                 return { result: null, error: `(Línea ${currentPos.line}, Columna ${currentPos.column}): Error de sintaxis: Etiqueta de apertura mal formada. Posiblemente falta '$' al final o los atributos son incorrectos en '${potentialTagPortion}...'.` };
            }
            if (potentialCloseTagStart && !customHtml.substring(currentIndex + potentialCloseTagStart[0].length).trim().startsWith('$') && !closeTagMatch) {
                 return { result: null, error: `(Línea ${currentPos.line}, Columna ${currentPos.column}): Error de sintaxis: Etiqueta de cierre mal formada. Posiblemente falta '$' al final de '${potentialTagPortion}...'.` };
            }
            if (customHtml.substring(currentIndex).startsWith('#') && !potentialOpenTagStart && !potentialCloseTagStart) {
                 return { result: null, error: `(Línea ${currentPos.line}, Columna ${currentPos.column}): Error de sintaxis: Carácter '#' inválido o nombre de etiqueta no válido comenzando con '${potentialTagPortion}...'. Los nombres de etiqueta solo pueden contener letras, números, '_', ':' o '-'.` };
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
    const errorPos = getLineAndColumn(customHtml, currentIndex);
    return { result: null, error: `(Línea ${errorPos.line}, Columna ${errorPos.column}): Error de compilación inesperado: ${e.message}` };
  }
}

export function decompile(standardHtml: string): string {
  let customHtml = standardHtml;
  
  // Convert closing tags first: </tag> to #/tag$
  customHtml = customHtml.replace(/<\/\s*([a-zA-Z0-9_:-]+)\s*>/g, '#/$1$');
  
  // Convert opening tags: <tag attributes> to #tag attributes$
  // This regex tries to correctly capture the tag name and all its attributes
  customHtml = customHtml.replace(/<\s*([a-zA-Z0-9_:-]+)((?:\s+[a-zA-Z0-9_:-]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'<>`=]+))?)*\s*\/?)>/g, (match, tagName, attributesWithMaybeSlash) => {
    let attributes = attributesWithMaybeSlash;
    // Check if it's a self-closing tag like <img ... /> or <br />
    // Our custom syntax doesn't have a special form for self-closing, it always expects #tag$ and then #/tag$ if not void.
    // For simplicity, we'll convert <br /> to #br$ and expect the user to know it doesn't need a #/br$.
    // Or, if they write #br$#/br$, it will become <br></br> which is mostly fine for browsers.
    // We remove the trailing slash if present, as it's not part of our custom syntax attributes.
    if (attributes.endsWith('/')) {
      attributes = attributes.substring(0, attributes.length - 1);
    }
    return `#${tagName}${attributes.trimEnd()}$`;
  });
  
  return customHtml;
}

