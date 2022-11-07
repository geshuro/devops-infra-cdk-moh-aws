import { customAlphabet } from 'nanoid';

/**
 * Generates password of a specified length based on the given characters set ensuring that the generated password
 * adheres to the given password policy regex
 * @param charset A string containing set of characters to use for generating the password
 * @param length Number of characters required to be present in the generated password
 * @param passwordPolicyRegEx A RegEx that generated password should match
 */
export function generatePassword(
  charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz^$*.[]{}()?"!@#%&/\\,><\':;|_~`',
  length = 20,
  // The configured Amazon Cognito user pool requires password to be at least 8 characters and contain
  // at least one uppercase, lowercase, number, and special character. Also, it supports only following special
  // characters in passwords.
  // (See https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-policies.html)
  // ^ $ * . [ ] { } ( ) ? " ! @ # % & / \ , > < ' : ; | _ ~ `
  // If the password generated by the password generator is used for creating a temporary user in Cognito,
  // the user creation will fail due to password policy mismatch.
  // To avoid that, make sure the generated password matches the password policy.
  // Nanoid claims high distribution from the given character set, so in most cases the generated password should
  // match the password policy. If not, then recreate password until we generate the one that matches the policy.
  passwordPolicyRegEx = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[\^$*.[\]{}()?"!@#%&/\\,><':;|_~`]).{8,}$/,
) {
  const passwordGeneratorFn = customAlphabet(charset, length);
  let password = passwordGeneratorFn();
  const maxAttempts = 100;
  let attemptCount = 1;
  if (passwordPolicyRegEx) {
    while (!password.match(passwordPolicyRegEx)) {
      attemptCount += 1;
      if (attemptCount > maxAttempts) {
        throw new Error('Cannot generate a password matching the expected password policy');
      }
      password = passwordGeneratorFn();
    }
  }
  return password;
}