import { z } from "zod";

const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).min(2).max(100);
const localizedTitle = z.string().trim().min(2).max(200);

export const categoryInputSchema = z.object({ slug, titleRu: localizedTitle, titleKk: localizedTitle, descriptionRu: z.string().max(2000).optional(), descriptionKk: z.string().max(2000).optional(), icon: z.string().max(64).optional(), sortOrder: z.number().int().min(0).max(10000).default(0) });
export const topicInputSchema = categoryInputSchema.pick({ slug: true, titleRu: true, titleKk: true, descriptionRu: true, descriptionKk: true, sortOrder: true }).extend({ categoryId: z.string().cuid() });
export const personInputSchema = z.object({ slug, nameRu: localizedTitle, nameKk: localizedTitle.optional(), aliases: z.array(z.string().trim().min(1).max(100)).max(30).default([]), types: z.array(z.string().trim().min(1).max(64)).max(12).default([]), categoryId: z.string().cuid().optional(), summaryRu: z.string().trim().min(10).max(1000), summaryKk: z.string().trim().min(10).max(1000).optional(), biographyRu: z.string().max(30000).optional(), biographyKk: z.string().max(30000).optional() });
