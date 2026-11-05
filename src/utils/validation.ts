export type ValidationResult = { valid: true } | { valid: false; message: string };

export function validateEmail(email: string): ValidationResult {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ? { valid: true }
    : { valid: false, message: 'Please enter a valid email address.' };
}

export function validatePassword(password: string): ValidationResult {
  return password.length >= 6
    ? { valid: true }
    : { valid: false, message: 'Password must be at least 6 characters.' };
}

export function validatePost(mood: string, content: string): ValidationResult {
  return mood.trim() && content.trim()
    ? { valid: true }
    : { valid: false, message: 'Add a mood and tell the community what is on your mind.' };
}

// Sign-up rule from the original app: 6–16 characters with lower and upper case letters, a number and a special character.
export function validateStrongPassword(password: string): ValidationResult {
  const strong =
    password.length >= 6 &&
    password.length <= 16 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);
  return strong
    ? { valid: true }
    : {
        valid: false,
        message:
          'Password should be 6–16 characters with small and capital letters, a number and a special character.',
      };
}

// Expects DD/MM/YYYY. Users must be 13 or older.
export function validateDateOfBirth(value: string, today = new Date()): ValidationResult {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return { valid: false, message: 'Enter your date of birth as DD/MM/YYYY.' };
  const [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date > today
  )
    return { valid: false, message: 'Enter a real date of birth.' };
  const thirteenth = new Date(year + 13, month - 1, day);
  return thirteenth <= today
    ? { valid: true }
    : { valid: false, message: 'You must be aged 13 or over to sign up.' };
}
