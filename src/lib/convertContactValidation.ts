import { z } from 'zod';

// Validation schema for converting contact to client
export const convertContactSchema = z.object({
  // Required fields
  full_name: z
    .string()
    .trim()
    .min(1, { message: "Name is required" })
    .max(100, { message: "Name must be less than 100 characters" }),

  // Optional contact fields with validation
  email: z
    .string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" })
    .optional()
    .or(z.literal('')),

  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]*$/, { message: "Invalid phone number format" })
    .max(20, { message: "Phone number must be less than 20 characters" })
    .optional()
    .or(z.literal('')),

  // Client type
  type: z.enum(['Individual', 'Organization'], {
    errorMap: () => ({ message: "Please select a client type" })
  }),

  // Organization fields
  organization: z
    .string()
    .trim()
    .max(200, { message: "Organization name must be less than 200 characters" })
    .optional()
    .or(z.literal('')),

  designation: z
    .string()
    .trim()
    .max(100, { message: "Designation must be less than 100 characters" })
    .optional()
    .or(z.literal('')),

  company_address: z
    .string()
    .trim()
    .max(500, { message: "Company address must be less than 500 characters" })
    .optional()
    .or(z.literal('')),

  company_phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]*$/, { message: "Invalid phone number format" })
    .max(20, { message: "Phone number must be less than 20 characters" })
    .optional()
    .or(z.literal('')),

  company_email: z
    .string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" })
    .optional()
    .or(z.literal('')),

  // Address fields
  address_line_1: z
    .string()
    .trim()
    .max(200, { message: "Address line 1 must be less than 200 characters" })
    .optional()
    .or(z.literal('')),

  address_line_2: z
    .string()
    .trim()
    .max(200, { message: "Address line 2 must be less than 200 characters" })
    .optional()
    .or(z.literal('')),

  state_id: z
    .string()
    .optional()
    .or(z.literal('')),

  district_id: z
    .string()
    .optional()
    .or(z.literal('')),

  pin_code: z
    .string()
    .trim()
    .regex(/^[0-9]{6}$/, { message: "PIN code must be exactly 6 digits" })
    .optional()
    .or(z.literal('')),

  // Referral information
  referred_by_name: z
    .string()
    .trim()
    .max(100, { message: "Referrer name must be less than 100 characters" })
    .optional()
    .or(z.literal('')),

  referred_by_phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]*$/, { message: "Invalid phone number format" })
    .max(20, { message: "Phone number must be less than 20 characters" })
    .optional()
    .or(z.literal('')),

  // Additional information
  notes: z
    .string()
    .trim()
    .max(2000, { message: "Notes must be less than 2000 characters" })
    .optional()
    .or(z.literal('')),

  office_notes: z
    .string()
    .trim()
    .max(2000, { message: "Office notes must be less than 2000 characters" })
    .optional()
    .or(z.literal('')),

  // Service information
  services: z
    .array(z.string())
    .optional(),

  // Case reference if creating initial case
  case_ref: z
    .string()
    .trim()
    .max(100, { message: "Case reference must be less than 100 characters" })
    .optional()
    .or(z.literal('')),
}).refine(
  (data) => {
    // If type is Organization, organization name is required
    if (data.type === 'Organization') {
      return data.organization && data.organization.trim().length > 0;
    }
    return true;
  },
  {
    message: "Organization name is required when type is Organization",
    path: ["organization"],
  }
);

export type ConvertContactFormData = z.infer<typeof convertContactSchema>;
