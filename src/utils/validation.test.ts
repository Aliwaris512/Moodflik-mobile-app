import { describe, expect, test } from 'bun:test';
import {
  validateDateOfBirth,
  validateEmail,
  validatePassword,
  validatePost,
  validateStrongPassword,
} from './validation';

describe('Moodflik validation', () => {
  test('validates email and password requirements', () => {
    expect(validateEmail('person@example.com').valid).toBe(true);
    expect(validateEmail('invalid').valid).toBe(false);
    expect(validatePassword('secret').valid).toBe(true);
    expect(validatePassword('123').valid).toBe(false);
  });

  test('requires mood and content for a post', () => {
    expect(validatePost('I am loving', 'A good day').valid).toBe(true);
    expect(validatePost('', 'A good day').valid).toBe(false);
  });

  test('enforces the sign-up password rule', () => {
    expect(validateStrongPassword('Moodf1k!').valid).toBe(true);
    expect(validateStrongPassword('moodflik').valid).toBe(false);
    expect(validateStrongPassword('Ab1!').valid).toBe(false);
  });

  test('requires a real date of birth for users aged 13+', () => {
    const today = new Date(2026, 10, 3);
    expect(validateDateOfBirth('03/11/2013', today).valid).toBe(true);
    expect(validateDateOfBirth('04/11/2013', today).valid).toBe(false);
    expect(validateDateOfBirth('31/02/2000', today).valid).toBe(false);
    expect(validateDateOfBirth('2000-01-01', today).valid).toBe(false);
  });
});
