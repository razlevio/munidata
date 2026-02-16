import type { Municipality } from "@prisma/client";
import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";
import * as z from "zod";

import { flagConfig } from "@/config/flag";
import { getFiltersStateParser, getSortingStateParser } from "@/lib/parsers";

// Schema for search params
export const searchParamsCache = createSearchParamsCache({
  filterFlag: parseAsStringEnum(
    flagConfig.featureFlags.map((flag) => flag.value)
  ),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<Municipality>().withDefault([
    { id: "name", desc: false },
  ]),
  name: parseAsArrayOf(z.string()).withDefault([]),
  classification: parseAsArrayOf(z.string()).withDefault([]),
  district: parseAsArrayOf(z.string()).withDefault([]),
  cluster: parseAsArrayOf(z.string()).withDefault([]),
  authority_sector: parseAsArrayOf(z.string()).withDefault([]),
  total_population: parseAsArrayOf(z.coerce.number()).withDefault([]),
  socio_eco_cluster: parseAsArrayOf(z.coerce.number()).withDefault([]),
  geographic_periphery: parseAsArrayOf(z.coerce.number()).withDefault([]),
  social_periphery: parseAsString.withDefault(""),
  golan_heights_settlement: parseAsString.withDefault(""),
  northern_confrontation_line: parseAsString.withDefault(""),
  created_at: parseAsArrayOf(z.coerce.number()).withDefault([]),
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
});

// Base schema for municipality data
const municipalityBaseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().optional(),
  district: z.string().optional(),
  classification: z.string().optional(),
  year_getting_classification: z.number().int().positive().optional(),
  authority_sector: z.string().optional(),
  area_km: z.number().positive().optional(),
  golan_heights_settlement: z.boolean().default(false),
  northern_confrontation_line: z.boolean().default(false),
  geographic_periphery: z.number().optional(),
  social_periphery: z.string().optional(),
  socio_eco_cluster: z.number().int().min(1).max(10).optional(),

  // Population & demographics
  total_population: z.number().int().optional(),
});

// Schema for creating a new municipality
export const createMunicipalitySchema = municipalityBaseSchema;

// Schema for updating an existing municipality
export const updateMunicipalitySchema = municipalityBaseSchema;

export type GetMunicipalitiesSchema = Awaited<
  ReturnType<typeof searchParamsCache.parse>
>;
export type CreateMunicipalitySchema = z.infer<typeof createMunicipalitySchema>;
export type UpdateMunicipalitySchema = z.infer<typeof updateMunicipalitySchema>;
