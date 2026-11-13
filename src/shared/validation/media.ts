import { z } from "zod";

export const mediaMetadataSchema = z.object({
  type: z.enum(["MAP", "PHOTO", "ARTIFACT", "DOCUMENT", "PORTRAIT", "SCHEME"]),
  altRu: z.string().trim().min(10).max(500), altKk: z.string().trim().min(10).max(500).optional(),
  captionRu: z.string().trim().max(500).optional(), captionKk: z.string().trim().max(500).optional(),
  author: z.string().trim().max(200).optional(), sourceUrl: z.string().url().max(2000).optional(), license: z.string().trim().min(2).max(200),
  width: z.coerce.number().int().min(1).max(20000), height: z.coerce.number().int().min(1).max(20000),
});
