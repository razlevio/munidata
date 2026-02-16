"use server";

import * as services from "./services";

export async function getMunicipalities() {
  return await services.getMunicipalities();
}

export async function getMunicipality(id: string) {
  return await services.getMunicipality(id);
}

export async function loadMunicipality(id: string) {
  return await services.getMunicipality(id);
}

export async function loadAvailableMunicipalities() {
  return await services.getAvailableMunicipalities();
}
