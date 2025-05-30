
import type { ORIGINAL_CHARS, SHIFT_AMOUNT } from './constants';

interface TagInfo {
  name: string;
  line: number;
  column: number;
}

export interface SymbolEntry {
  tipo: 'etiqueta_apertura' | 'etiqueta_cierre' | 'atributo' | 'texto' | 'etiqueta_autocierre';
  valor: string;
  linea: number;
  columna: number;
}

export interface ErrorEntry {
  tipo: 'léxico' | 'sintáctico' | 'semántico';
  linea: number;
  columna: number;
  descripcion: string;
}

interface CompileResult {
  result: string | null;
  errors: ErrorEntry[];
  symbolTable: SymbolEntry[];
}

function getLineAndColumn(text: string, index: number): { line: number, column: number } {
  const lines = text.substring(0, index).split('\n');
  const line = lines.length;
  const column = lines[lines.length - 1].length + 1;
  return { line, column };
}

function parseAndValidateAttributes(
  attributesString: string,
  tagLine: number,
  baseColumn: number, // Column where the tag name ends (after '#tagname')
  symbolTable: SymbolEntry[],
  errors: ErrorEntry[]
): { processedAttrsString: string, hasError: boolean } {
  let processedAttrs = "";
  let hasAttributeError = false;
  if (!attributesString.trim()) {
    return { processedAttrsString: "", hasError: false };
  }

  const individualAttributeRegex = /\s*([a-zA-Z0-9_:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'<>`=/$]+)))?/g;
  let match;
  let lastIndexProcessed = 0;

  while ((match = individualAttributeRegex.exec(attributesString)) !== null) {
    lastIndexProcessed = match.index + match[0].length;
    const fullAttrMatchTrimmed = match[0].trim();
    const attrName = match[1];
    const doubleQuotedValue = match[2];
    const singleQuotedValue = match[3];
    const unquotedValue = match[4];
    
    const relativeAttrStartCol = match.index + (match[0].length - match[0].trimStart().length);
    const attrSymbolColumn = baseColumn + 1 + relativeAttrStartCol;


    symbolTable.push({
      tipo: 'atributo',
      valor: fullAttrMatchTrimmed,
      linea: tagLine,
      columna: attrSymbolColumn,
    });

    if (singleQuotedValue !== undefined) {
      errors.push({
        tipo: 'léxico',
        linea: tagLine,
        columna: attrSymbolColumn + attrName.length + (match[0].substring(attrName.length).indexOf("'") || 0),
        descripcion: `Atributo '${attrName}' usa comillas simples. Deben ser comillas dobles.`
      });
      hasAttributeError = true;
    } else if (unquotedValue !== undefined && match[0].includes("=")) {
      errors.push({
        tipo: 'léxico',
        linea: tagLine,
        columna: attrSymbolColumn + attrName.length + (match[0].substring(attrName.length).indexOf("=") || 0) + 1,
        descripcion: `Valor del atributo '${attrName}' debe estar entre comillas dobles.`
      });
      hasAttributeError = true;
    }
    
    // Further validation can be added here if needed, e.g. for valid characters in attrName or unquotedValue

    if (!hasAttributeError) {
        processedAttrs += match[0]; // Add the raw matched attribute string
    }
  }
  
  // Check for any remaining part of attributesString that was not matched by the regex, indicating malformed attributes
  const trailingPart = attributesString.substring(lastIndexProcessed).trim();
  if (trailingPart) {
      errors.push({
          tipo: 'léxico',
          linea: tagLine,
          columna: baseColumn + 1 + lastIndexProcessed + (attributesString.substring(lastIndexProcessed).length - attributesString.substring(lastIndexProcessed).trimStart().length),
          descripcion: `Atributos mal formados o caracteres inesperados: '${trailingPart}'.`
      });
      hasAttributeError = true;
  }

  return { processedAttrsString: processedAttrs.trim() ? ' ' + processedAttrs.trim() : "", hasError: hasAttributeError };
}


export function compile(customHtml: string): CompileResult {
  const symbolTable: SymbolEntry[] = [];
  const errors: ErrorEntry[] = [];
  const tagStack: TagInfo[] = [];
  let processedHtml = "";
  let currentIndex = 0;

  // Regex for self-closing tags like #br/$ or #img src="... "/$
  const selfClosingTagRegex = /^#([a-zA-Z0-9_:-]+)((?:[^$]*?)?)\s*\/(\s*\$)/;
  // Regex for opening tags like #div attributes$
  const openTagRegex = /^#([a-zA-Z0-9_:-]+)((?:[^$]*?)?)(\$)/;
  // Regex for closing tags like #/div$
  const closeTagRegex = /^#\/([a-zA-Z0-9_:-]+)\$/;


  while (currentIndex < customHtml.length) {
    const currentPos = getLineAndColumn(customHtml, currentIndex);
    const remainingCustomHtml = customHtml.substring(currentIndex);

    // 1. Try to match plain text
    if (remainingCustomHtml[0] !== '#') {
      let textEndIndex = 0;
      while (textEndIndex < remainingCustomHtml.length && remainingCustomHtml[textEndIndex] !== '#') {
        textEndIndex++;
      }
      const textValue = remainingCustomHtml.substring(0, textEndIndex);
      if (textValue) {
        symbolTable.push({
          tipo: 'texto',
          valor: textValue,
          linea: currentPos.line,
          columna: currentPos.column,
        });
        processedHtml += textValue;
        currentIndex += textValue.length;
        continue;
      }
    }

    // At this point, character is '#'
    let matchedTag = false;

    // 2. Try to match self-closing tag: #tag attributes /$
    let selfClosingMatchAttempt = remainingCustomHtml.match(selfClosingTagRegex);
    if (selfClosingMatchAttempt) {
      matchedTag = true;
      const [fullMatch, tagName, attributesCapture, dollarSignPart] = selfClosingMatchAttempt;
      const fullTagText = fullMatch.substring(0, fullMatch.length - dollarSignPart.trimEnd().length) + "$"; // Reconstruct for symbol table

      symbolTable.push({
        tipo: 'etiqueta_autocierre',
        valor: fullTagText,
        linea: currentPos.line,
        columna: currentPos.column,
      });

      const { processedAttrsString, hasError: attrError } = parseAndValidateAttributes(
        attributesCapture,
        currentPos.line,
        currentPos.column + tagName.length +1, // +1 for '#'
        symbolTable,
        errors
      );

      if (!attrError) {
        processedHtml += `<${tagName}${processedAttrsString} />`;
      }
      currentIndex += fullMatch.length;
      continue;
    }

    // 3. Try to match opening tag: #tag attributes $
    let openTagMatchAttempt = remainingCustomHtml.match(openTagRegex);
    if (openTagMatchAttempt) {
      matchedTag = true;
      const [fullMatch, tagName, attributesCapture, dollarSign] = openTagMatchAttempt;

      // Check for accidental self-closing syntax like #tag /$ which should be caught by selfClosingTagRegex
      // but if attributesCapture ends with /, it's an error here.
      if (attributesCapture.trim().endsWith('/')) {
        errors.push({
          tipo: 'sintáctico',
          linea: currentPos.line,
          columna: currentPos.column + fullMatch.lastIndexOf('/'),
          descripcion: `Error de sintaxis: Carácter '/' inesperado antes de '$' en etiqueta de apertura '#${tagName}'. Para etiquetas de autocierre use '#${tagName} /$'.`
        });
        // Still attempt to process it as an open tag for symbol table completeness
      }
      
      symbolTable.push({
        tipo: 'etiqueta_apertura',
        valor: fullMatch,
        linea: currentPos.line,
        columna: currentPos.column,
      });
      
      const { processedAttrsString, hasError: attrError } = parseAndValidateAttributes(
        attributesCapture,
        currentPos.line,
        currentPos.column + tagName.length + 1, // +1 for '#'
        symbolTable,
        errors
      );

      if (!attrError) {
        processedHtml += `<${tagName}${processedAttrsString}>`;
      }
      tagStack.push({ name: tagName, line: currentPos.line, column: currentPos.column });
      currentIndex += fullMatch.length;
      continue;
    }

    // 4. Try to match closing tag: #/tag$
    let closeTagMatchAttempt = remainingCustomHtml.match(closeTagRegex);
    if (closeTagMatchAttempt) {
      matchedTag = true;
      const [fullMatch, tagName] = closeTagMatchAttempt;

      symbolTable.push({
        tipo: 'etiqueta_cierre',
        valor: fullMatch,
        linea: currentPos.line,
        columna: currentPos.column,
      });

      if (tagStack.length === 0) {
        errors.push({
          tipo: 'sintáctico',
          linea: currentPos.line,
          columna: currentPos.column,
          descripcion: `Etiqueta de cierre inesperada '#/${tagName}$'. No hay etiquetas abiertas.`
        });
      } else {
        const lastOpenTag = tagStack[tagStack.length - 1];
        if (lastOpenTag.name !== tagName) {
          errors.push({
            tipo: 'sintáctico',
            linea: currentPos.line,
            columna: currentPos.column,
            descripcion: `Error de cierre: Se encontró '#/${tagName}$' pero se esperaba '#/${lastOpenTag.name}$' (abierta en Línea ${lastOpenTag.line}, Columna ${lastOpenTag.column}).`
          });
          // Attempt to recover by still popping, or not, depending on desired strictness
          // For now, don't pop if mismatched, to highlight the error chain.
        } else {
          tagStack.pop();
          processedHtml += `</${tagName}>`;
        }
      }
      currentIndex += fullMatch.length;
      continue;
    }

    // 5. If it starts with '#' but didn't match any tag regex
    if (remainingCustomHtml[0] === '#') {
        errors.push({
            tipo: 'léxico',
            linea: currentPos.line,
            columna: currentPos.column,
            descripcion: `Token inválido. Comienza con '#' pero no conforma una etiqueta válida: '${remainingCustomHtml.substring(0, Math.min(10, remainingCustomHtml.length))}${remainingCustomHtml.length > 10 ? '...' : ''}'.`
        });
        // Consume the '#' to avoid infinite loop and add to processedHtml to show where error occurred
        processedHtml += '#'; 
        symbolTable.push({ tipo: 'texto', valor: '#', linea: currentPos.line, columna: currentPos.column });
        currentIndex++;
        continue;
    }
    
    // Failsafe: if nothing matched and currentIndex hasn't advanced (should not happen with current logic)
    if (currentIndex === getLineAndColumn(customHtml, currentIndex).line -1 && currentIndex < customHtml.length){ // A bit of a trick to recheck current index based on current logic
        errors.push({
            tipo: 'sintáctico',
            linea: currentPos.line,
            columna: currentPos.column,
            descripcion: `Error de procesamiento: No se pudo avanzar en el análisis en '${customHtml[currentIndex]}'.`
        });
        processedHtml += customHtml[currentIndex]; // Add problematic char
        symbolTable.push({ tipo: 'texto', valor: customHtml[currentIndex], linea: currentPos.line, columna: currentPos.column });
        currentIndex++;
    }
  }

  // After the loop, check for unclosed tags
  if (tagStack.length > 0) {
    for (const unclosedTag of tagStack) {
      errors.push({
        tipo: 'semántico',
        linea: unclosedTag.line,
        columna: unclosedTag.column,
        descripcion: `Etiqueta '#${unclosedTag.name}$' abierta en (Línea ${unclosedTag.line}, Columna ${unclosedTag.column}) no fue cerrada.`
      });
    }
  }

  return {
    result: errors.length === 0 ? processedHtml : null,
    errors,
    symbolTable,
  };
}

    