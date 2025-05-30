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

const openTagWithSlashEndRegex = /^#([a-zA-Z0-9_:-]+)([^$]*?)\/\s*\$/;
const openTagWithDollarEndRegex = /^#([a-zA-Z0-9_:-]+)([^$]*?)\$/;
const closeTagRegex = /^#\/([a-zA-Z0-9_:-]+)\$/;

try {
  while (currentIndex < customHtml.length) {
    const rawRemaining = customHtml.substring(currentIndex);
    const trimmed = rawRemaining.trimStart();
    const skipLength = rawRemaining.length - trimmed.length;
    currentIndex += skipLength;

    const remainingCustomHtml = customHtml.substring(currentIndex);
    const currentPos = getLineAndColumn(customHtml, currentIndex);

    let match: RegExpMatchArray | null = null;

    // Self-closing tag
    if ((match = remainingCustomHtml.match(openTagWithSlashEndRegex))) {
      const [full, tagName, attrs] = match;
      const attributes = attrs.trim();

      // Validación de atributos con comillas dobles
      if (attributes.includes("'")) {
        const errorPos = attributes.indexOf("'");
        return {
          result: null,
          error: `(Línea ${currentPos.line}, Columna ${currentPos.column + errorPos}): Error: Atributo con comillas simples. Usa comillas dobles.`
        };
      }

      const attrPattern = /^([a-zA-Z0-9_:-]+(\s*=\s*"[^"]*")?\s*)*$/;
      if (attributes && !attrPattern.test(attributes)) {
        return {
          result: null,
          error: `(Línea ${currentPos.line}, Columna ${currentPos.column}): Error en atributos de '${tagName}'.`
        };
      }

      processedHtml += `<${tagName}${attributes ? ' ' + attributes : ''} />`;
      currentIndex += full.length;
      continue;
    }

    // Opening tag
    if ((match = remainingCustomHtml.match(openTagWithDollarEndRegex))) {
      const [full, tagName, attrs] = match;
      const attributes = attrs.trim();

      if (attributes.includes("'")) {
        const errorPos = attributes.indexOf("'");
        return {
          result: null,
          error: `(Línea ${currentPos.line}, Columna ${currentPos.column + errorPos}): Error: Atributo con comillas simples. Usa comillas dobles.`
        };
      }

      const attrPattern = /^([a-zA-Z0-9_:-]+(\s*=\s*"[^"]*")?\s*)*$/;
      if (attributes && !attrPattern.test(attributes)) {
        return {
          result: null,
          error: `(Línea ${currentPos.line}, Columna ${currentPos.column}): Error en atributos de '${tagName}'.`
        };
      }

      processedHtml += `<${tagName}${attributes ? ' ' + attributes : ''}>`;
      tagStack.push({ name: tagName, line: currentPos.line, column: currentPos.column });
      currentIndex += full.length;
      continue;
    }

    // Closing tag
    if ((match = remainingCustomHtml.match(closeTagRegex))) {
      const [full, tagName] = match;
      if (tagStack.length === 0) {
        return {
          result: null,
          error: `(Línea ${currentPos.line}, Columna ${currentPos.column}): Error: Etiqueta de cierre inesperada '#/${tagName}$'. No hay etiquetas abiertas.`
        };
      }

      const last = tagStack[tagStack.length - 1];
      if (last.name !== tagName) {
        return {
          result: null,
          error: `(Línea ${currentPos.line}, Columna ${currentPos.column}): Error: Cierre incorrecto de '#/${tagName}$'. Se esperaba '#/${last.name}$'.`
        };
      }

      tagStack.pop();
      processedHtml += `</${tagName}>`;
      currentIndex += full.length;
      continue;
    }

    // Si no es etiqueta, se agrega como texto plano
    processedHtml += customHtml[currentIndex];
    currentIndex++;
  }

  if (tagStack.length > 0) {
    const first = tagStack[0];
    return {
      result: null,
      error: `Error: Etiqueta sin cerrar '#${first.name}$' desde (Línea ${first.line}, Columna ${first.column}).`
    };
  }

  return { result: processedHtml, error: null };

} catch (e: any) {
  const pos = getLineAndColumn(customHtml, currentIndex);
  return {
    result: null,
    error: `(Línea ${pos.line}, Columna ${pos.column}): Error inesperado: ${e.message}`
  };
}
}
