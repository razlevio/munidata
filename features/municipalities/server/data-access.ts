import "server-only";

import { db } from "@/lib/db";

export async function getMunicipalities() {
  return await db.municipality.findMany({
    include: {
      parent_cluster: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });
}

export async function getMunicipality(id: string) {
  return await db.municipality.findUnique({
    where: { id: Number(id) },
    include: {
      parent_cluster: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export async function getAvailableMunicipalities() {
  return await db.municipality.findMany({
    select: {
      id: true,
      name: true,
      classification: true,
      district: true,
    },
    orderBy: [{ name: "asc" }],
  });
}
