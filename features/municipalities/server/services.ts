"server-only";

import * as dataAccess from "./data-access";

export async function getMunicipalities() {
  return await dataAccess.getMunicipalities();
}

export async function getMunicipality(id: string) {
  return await dataAccess.getMunicipality(id);
}

export async function getAvailableMunicipalities() {
  return await dataAccess.getAvailableMunicipalities();
}
