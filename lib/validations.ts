import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  organizationName: z.string().min(2, "Organization name must be at least 2 characters").optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const revenueRecordSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  currency: z.string().default("USD"),
  source: z.enum(["STRIPE", "REVENUECAT", "MANUAL"]).default("MANUAL"),
  category: z.enum(["SUBSCRIPTION", "ONE_TIME", "AD_REVENUE"]).default("SUBSCRIPTION"),
  notes: z.string().max(500).optional(),
  recordedAt: z.string().datetime().optional(),
});

export const socialPostSchema = z.object({
  platform: z.enum(["Instagram", "X", "LinkedIn"]),
  content: z.string().min(1, "Content cannot be empty").max(280, "Content cannot exceed 280 characters for multi-platform broadcasting"),
  scheduledFor: z.string().datetime().optional().nullable(),
  scheduledTimeString: z.string().max(100).optional().nullable(),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "FAILED"]).default("DRAFT"),
});

export const updateSocialPostSchema = socialPostSchema.partial();

export const supportTicketSchema = z.object({
  subject: z.string().min(3, "Subject must be at least 3 characters").max(200),
  requesterEmail: z.string().email("Invalid requester email"),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).default("OPEN"),
});

export const updateSupportTicketSchema = z.object({
  subject: z.string().min(3).max(200).optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
});

export const ticketNoteSchema = z.object({
  content: z.string().min(1, "Note cannot be empty").max(2000),
  isInternal: z.boolean().default(true),
});

export const chatMessageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(2000),
  conversationId: z.string().optional(),
});

export const subscriptionPlanSchema = z.object({
  name: z.string().min(2, "Plan name required"),
  price: z.number().nonnegative("Price cannot be negative"),
  interval: z.enum(["month", "year"]).default("month"),
});

export const subscriberSchema = z.object({
  planId: z.string(),
  customerEmail: z.string().email("Invalid customer email"),
  status: z.enum(["ACTIVE", "CANCELLED", "PAST_DUE"]).default("ACTIVE"),
});

export const adCampaignUpdateSchema = z.object({
  status: z.enum(["ACTIVE", "PAUSED", "ARCHIVED"]).optional(),
  spend: z.number().nonnegative().optional(),
  roas: z.number().nonnegative().optional(),
  ctr: z.number().nonnegative().optional(),
});

export const saveIntegrationSchema = z.object({
  provider: z.enum(["STRIPE", "REVENUECAT", "ZENDESK", "INTERCOM", "FRESHDESK", "META", "OPENAI"]),
  apiKey: z.string().min(1, "API key or token is required").optional(),
  webhookSecret: z.string().optional(),
  subdomain: z.string().optional(),
  adAccountId: z.string().optional(),
  status: z.enum(["CONNECTED", "DISCONNECTED"]).default("CONNECTED"),
});


