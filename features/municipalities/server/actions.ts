"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getErrorMessage } from "@/lib/handle-error";
import type {
  CreateMunicipalitySchema,
  UpdateMunicipalitySchema,
} from "./municiaplities-table/validations";

/**
 * Create a new municipality
 */
export async function createMunicipality(input: CreateMunicipalitySchema) {
  try {
    const municipality = await db.municipality.create({
      data: {
        id: 1,
        name: input.name,
        code: input.code,
        district: input.district,
        classification: input.classification,
        year_getting_classification: input.year_getting_classification,
        area_km: input.area_km,
        golan_heights_settlement: input.golan_heights_settlement,
        northern_confrontation_line: input.northern_confrontation_line,
        socio_eco_cluster: input.socio_eco_cluster,
        total_population: input.total_population,
        social_periphery: input.social_periphery === "true",
        geographic_periphery: input.geographic_periphery,
      },
    });

    revalidatePath("/municipalities");
    return { data: municipality, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

/**
 * Update an existing municipality
 */
export async function updateMunicipality({
  id,
  ...input
}: UpdateMunicipalitySchema & { id: number }) {
  try {
    const municipality = await db.municipality.update({
      where: { id },
      data: {
        name: input.name,
        code: input.code,
        district: input.district,
        classification: input.classification,
        authority_sector: input.authority_sector,
        year_getting_classification: input.year_getting_classification,
        area_km: input.area_km,
        golan_heights_settlement: input.golan_heights_settlement,
        northern_confrontation_line: input.northern_confrontation_line,
        geographic_periphery: input.geographic_periphery,
        social_periphery: input.social_periphery === "true",
        socio_eco_cluster: input.socio_eco_cluster,
        total_population: input.total_population,
      },
    });

    revalidatePath("/municipalities");
    return { data: municipality, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

/**
 * Update multiple municipalities
 */
export async function updateMunicipalities({
  ids,
  ...data
}: {
  ids: number[];
  [key: string]: unknown;
}) {
  try {
    // Filter out undefined values
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    );

    // Update all municipalities with the specified IDs
    await db.$transaction(
      ids.map((id) =>
        db.municipality.update({
          where: { id },
          data: filteredData,
        })
      )
    );

    revalidatePath("/municipalities");
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Delete a municipality
 */
export async function deleteMunicipality(id: number) {
  try {
    await db.municipality.delete({
      where: { id },
    });

    revalidatePath("/municipalities");
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Delete multiple municipalities
 */
export async function deleteMunicipalities({ ids }: { ids: number[] }) {
  try {
    await db.municipality.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    revalidatePath("/municipalities");
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}
