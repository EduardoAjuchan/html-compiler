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
  let html = customHtml;
  const tagStack: string[] = [];
  const tagRegex = /#([a-zA-Z0-9_:-]+)([^$]*?)\$|#\/([a-zA-Z0-9_:-]+)\$/g;
  let resultHtml = "";
  let lastIndex = 0;

  // Custom regex-based parser, simpler than full AST but handles basic cases
  html = html.replace(tagRegex, (match, openTagName, attributes, closeTagName, offset) => {
    resultHtml += customHtml.substring(lastIndex, offset);
    lastIndex = offset + match.length;

    if (openTagName) {
      const tagName = openTagName.trim();
      tagStack.push(tagName);
      return `<${tagName}${attributes || ''}>`;
    } else if (closeTagName) {
      const tagName = closeTagName.trim();
      if (tagStack.length === 0 || tagStack[tagStack.length - 1] !== tagName) {
        throw new Error(`Mismatched closing tag: Expected #${tagStack[tagStack.length - 1]}$ but found ${match}`);
      }
      tagStack.pop();
      return `</${tagName}>`;
    }
    return match; // Should not happen
  });

  resultHtml += customHtml.substring(lastIndex);


  if (tagStack.length > 0) {
    return { result: null, error: `Unclosed tags: ${tagStack.join(', ')}` };
  }

  // A simpler iterative replace for basic well-formed structures.
  // This is a fallback or alternative if the regex above is too complex or buggy for initial implementation.
  // For the prompt, a more robust stack-based checking is preferred.
  // The regex based replacement with stack checking is implemented above.
  
  // For the sake of this exercise, this iterative replacement strategy can be error-prone for complex cases.
  // A proper parser or more sophisticated regex with state management (like the one above) would be better.
  // Let's refine the regex based approach.

  // The issue with a single regex replace is handling nesting and validation correctly.
  // A true parser would iterate and build a tree or directly output.
  // For simplicity with error checking:
  try {
    let processedHtml = "";
    let currentIndex = 0;
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
          return { result: null, error: `Mismatched closing tag: Expected #${tagStack.pop()}$ but found ${fullMatch}` };
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
      return { result: null, error: `Unclosed tags: ${tagStack.join(', ')}` };
    }
    return { result: processedHtml, error: null };

  } catch (e: any) {
    return { result: null, error: e.message };
  }
}


export function decompile(standardHtml: string): string {
  // Simple replacement, might not handle all edge cases of HTML but fits "custom HTML-like"
  let customHtml = standardHtml;
  customHtml = customHtml.replace(/<\/(.*?)>/g, '#/$1$');
  customHtml = customHtml.replace(/<(.*?)>/g, '#$1$');
  return customHtml;
}
