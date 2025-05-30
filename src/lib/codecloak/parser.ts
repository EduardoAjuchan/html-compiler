
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
      const openTagMatch = customHtml.substring(currentIndex).match(/^#([a-zA-Z0-9_:-]+)((?:[^$"]*(?:"[^"]*"[^$"]*)*)*)\$/);
      // Attempt to match a closing tag: #/tagName$
      const closeTagMatch = customHtml.substring(currentIndex).match(/^#\/([a-zA-Z0-9_:-]+)\$/);

      if (openTagMatch) {
        const [fullMatch, tagName, attributesString] = openTagMatch;
        const attributes = attributesString.trim();

        if (attributes) {
            if (attributes.includes("='")) {
                const errorIndexInAttributes = attributes.indexOf("='");
                return { result: null, error: `(Línea ${currentPos.line}, Columna ${currentPos.column + fullMatch.indexOf(attributes) + errorIndexInAttributes}): Error de sintaxis en atributos: Se encontraron comillas simples. Utiliza comillas dobles para los valores de atributos (ej: nombre="valor") en '${attributesString.substring(0, Math.min(attributesString.length, 30))}...'.` };
            }
            
            // Split attributes by space, respecting quotes, to validate each one
            const attributeSegments = attributes.split(/\s+(?=(?:(?:[^"]*"){2})*[^"]*$)/).filter(s => s.trim() !== '');

            for (const segment of attributeSegments) {
                const attributeNameMatch = segment.match(/^([a-zA-Z0-9_:-]+)/);
                if (!attributeNameMatch) {
                    const errorIndexInAttributes = attributes.indexOf(segment);
                    return { result: null, error: `(Línea ${currentPos.line}, Columna ${currentPos.column + fullMatch.indexOf(attributes) + errorIndexInAttributes}): Error de sintaxis en atributos: Atributo mal formado cerca de '${segment.substring(0, Math.min(segment.length, 20))}...' en '${attributes.substring(0, Math.min(attributes.length, 30))}...'.`};
                }
                const attrName = attributeNameMatch[0];

                if (segment.includes("=")) { // Attribute with value
                    const valuePartMatch = segment.match(/=(.*)/);
                    if (!valuePartMatch || !valuePartMatch[1].startsWith('"') || !valuePartMatch[1].endsWith('"')) {
                        const errorIndexInSegment = segment.indexOf('=') +1;
                        const errorIndexInAttributes = attributes.indexOf(segment) + errorIndexInSegment;
                        return { result: null, error: `(Línea ${currentPos.line}, Columna ${currentPos.column + fullMatch.indexOf(attributes) + errorIndexInAttributes}): Error de sintaxis en atributos: El valor para '${attrName}' debe estar entre comillas dobles (ej: ${attrName}="valor") en '${segment.substring(0, Math.min(segment.length, 30))}...'.` };
                    }
                    if (valuePartMatch[1].length > 1 && valuePartMatch[1].substring(1, valuePartMatch[1].length - 1).includes('"')) {
                         const errorIndexInSegment = segment.indexOf('=') + 1 + valuePartMatch[1].substring(1).indexOf('"') + 1;
                         const errorIndexInAttributes = attributes.indexOf(segment) + errorIndexInSegment;
                         return { result: null, error: `(Línea ${currentPos.line}, Columna ${currentPos.column + fullMatch.indexOf(attributes) + errorIndexInAttributes}): Error de sintaxis en atributos: Comillas dobles no escapadas dentro del valor del atributo '${attrName}' en '${segment.substring(0, Math.min(segment.length, 30))}...'.` };
                    }
                } else { // Boolean attribute (no value)
                    if (attrName !== segment) { // Ensure no extra characters after boolean attribute name
                        const errorIndexInAttributes = attributes.indexOf(segment) + attrName.length;
                         return { result: null, error: `(Línea ${currentPos.line}, Columna ${currentPos.column + fullMatch.indexOf(attributes) + errorIndexInAttributes}): Error de sintaxis en atributos: Caracteres inesperados después del nombre de atributo booleano '${attrName}' en '${segment.substring(0, Math.min(segment.length, 30))}...'.`};
                    }
                }
            }

            // General pattern for overall attribute structure (redundant if above checks are thorough but good as a fallback)
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
