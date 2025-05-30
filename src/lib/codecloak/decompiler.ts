
export function decompile(standardHtml: string): string {
  let customHtml = standardHtml;
  
  // Convert closing tags first: </tag> to #/tag$
  customHtml = customHtml.replace(/<\/\s*([a-zA-Z0-9_:-]+)\s*>/g, '#/$1$');
  
  // Convert opening tags: <tag attributes> to #tag attributes$
  // This regex tries to correctly capture the tag name and all its attributes
  customHtml = customHtml.replace(/<\s*([a-zA-Z0-9_:-]+)((?:\s+[a-zA-Z0-9_:-]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'<>`=]+))?)*\s*\/?)>/g, (match, tagName, attributesWithMaybeSlash) => {
    let attributes = attributesWithMaybeSlash;
    // Check if it's a self-closing tag like <img ... /> or <br />
    // Our custom syntax doesn't have a special form for self-closing.
    // We remove the trailing slash if present, as it's not part of our custom syntax attributes.
    if (attributes.endsWith('/')) {
      attributes = attributes.substring(0, attributes.length - 1);
    }
    return `#${tagName}${attributes.trimEnd()}$`;
  });
  
  return customHtml;
}
