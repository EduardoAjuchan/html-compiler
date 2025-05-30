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

export function compile(customHtml: string): { result: string | null; error: string | null } {
  const tagStack: string[] = [];
  let processedHtml = "";
  let currentIndex = 0;

  try {
    while(currentIndex < customHtml.length) {
      const openTagMatch = customHtml.substring(currentIndex).match(/^#([a-zA-Z0-9_:-]+)([^$]*?)\$/);
      const closeTagMatch = customHtml.substring(currentIndex).match(/^#\/([a-zA-Z0-9_:-]+)\$/);

      if (openTagMatch) {
        const [fullMatch, tagName, attributes] = openTagMatch;
        processedHtml += `<${tagName}${attributes || ''}>`;
        tagStack.push(tagName);
        currentIndex += fullMatch.length;
      } else if (closeTagMatch) {
        const [fullMatch, tagName] = closeTagMatch;
        if (tagStack.length === 0 || tagStack[tagStack.length - 1] !== tagName) {
          const expectedTag = tagStack.length > 0 ? tagStack[tagStack.length - 1] : "ninguna (pila vacía)";
          return { result: null, error: `Error de compilación: Etiqueta de cierre no coincidente. Se esperaba '#/${expectedTag}$' pero se encontró '${fullMatch}'.` };
        }
        tagStack.pop();
        processedHtml += `</${tagName}>`;
        currentIndex += fullMatch.length;
      } else {
        processedHtml += customHtml[currentIndex];
        currentIndex++;
      }
    }

    if (tagStack.length > 0) {
      // Create a unique list of unclosed tags for the error message
      const uniqueUnclosedTags = [...new Set(tagStack)];
      return { result: null, error: `Error de compilación: Etiquetas sin cerrar: #${uniqueUnclosedTags.join(', #')}` };
    }
    return { result: processedHtml, error: null };

  } catch (e: any) {
    return { result: null, error: `Error de compilación inesperado: ${e.message}` };
  }
}


export function decompile(standardHtml: string): string {
  // Simple replacement, might not handle all edge cases of HTML but fits "custom HTML-like"
  let customHtml = standardHtml;
  customHtml = customHtml.replace(/<\/(.*?)>/g, '#/$1$');
  customHtml = customHtml.replace(/<(.*?)>/g, '#$1$');
  return customHtml;
}
