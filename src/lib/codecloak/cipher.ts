
import { ORIGINAL_CHARS, SHIFT_AMOUNT } from './constants';

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
