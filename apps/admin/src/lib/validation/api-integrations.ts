import { z } from 'zod';

export const INTEGRATION_STATUSES = ['active', 'inactive', 'error'] as const;
export type IntegrationStatus = (typeof INTEGRATION_STATUSES)[number];

export const API_ENVIRONMENTS = ['production', 'sandbox', 'staging', 'development'] as const;
export type ApiEnvironment = (typeof API_ENVIRONMENTS)[number];

export const API_PROVIDERS = [
  'mercury',
  'stripe',
  'openai',
  'tencent',
  'github',
  'google',
  'hostinger',
  'custom',
] as const;
export type ApiProvider = (typeof API_PROVIDERS)[number];

export const API_AUTH_TYPES = ['api_key', 'bearer', 'basic', 'oauth2', 'none'] as const;
export type ApiAuthType = (typeof API_AUTH_TYPES)[number];

const optionalUrl = z.union([z.string().url(), z.literal('')]).optional();

export const apiIntegrationCreateSchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(INTEGRATION_STATUSES).optional(),
  provider: z.enum(API_PROVIDERS).optional(),
  environment: z.enum(API_ENVIRONMENTS).optional(),
  baseUrl: optionalUrl,
  authType: z.enum(API_AUTH_TYPES).optional(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  webhookSecret: z.string().optional(),
  publicKey: z.string().optional(),
  externalAccountId: z.string().trim().max(255).optional(),
  docsUrl: optionalUrl,
});

export const apiIntegrationUpdateSchema = apiIntegrationCreateSchema.partial();
