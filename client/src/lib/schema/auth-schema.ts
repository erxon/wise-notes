import { z } from "zod";

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters").refine((password) => {
    // Check for at least one uppercase letter
    return /[A-Z]/.test(password);
  }, "Password must contain at least one uppercase letter")
  .refine((password) => {
    // Check for at least one lowercase letter
    return /[a-z]/.test(password);
  }, "Password must contain at least one lowercase letter")
  .refine((password) => {
    // Check for at least one number
    return /[0-9]/.test(password);
  }, "Password must contain at least one number")
  .refine((password) => {
    // Check for at least one special character
    return /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password);
  }, "Password must contain at least one special character")
  .refine((password) => {
    // No common passwords
    const commonPasswords = ['password', '123456', 'password123', 'admin'];
    return !commonPasswords.includes(password.toLowerCase());
  }, "Password is too common"),
});

export default authSchema;
