import { Suspense } from "react";
import { ModeToggle } from "@/components/switchers/mode-toggle";
import { DataTableSkeleton } from "@/components/table/data-table-skeleton";
import { Shell } from "@/components/table/shell";
import { MunicipalitiesTable } from "@/features/municipalities/components/municiaplities-table/municipalities-table";
import {
  getClustersOptions,
  getMunicipalities,
  getMunicipalityClassificationCounts,
  getMunicipalityFilterCounts,
  getMunicipalitySocioEcoClusterRange,
  getMunicipalitySocioEconomicCounts,
} from "@/features/municipalities/server/municiaplities-table/queries";
import { searchParamsCache } from "@/features/municipalities/server/municiaplities-table/validations";
export const dynamic = "force-dynamic";

export default async function MunicipalitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const search = await searchParamsCache.parse(searchParams);

  const promises = Promise.all([
    getMunicipalities(search),
    getMunicipalityClassificationCounts(),
    getMunicipalitySocioEconomicCounts(),
    getMunicipalitySocioEcoClusterRange(),
    getMunicipalityFilterCounts(),
    getClustersOptions(),
  ]);

  return (
    <div>
      <ModeToggle />
      <div className="p-4 md:gap-6 md:p-6">
        <div className="space-y-1">
          <h1 className="font-bold text-3xl">רשויות מקומיות</h1>
          <p className="text-muted-foreground">
            מעקב אחר הרשויות המקומיות במדידות שונות
          </p>
        </div>
        <Shell>
          {/* <FeatureFlagsProvider> */}
          <Suspense
            fallback={
              <DataTableSkeleton
                cellWidths={[
                  "5rem",
                  "5rem",
                  "5rem",
                  "5rem",
                  "5rem",
                  "5rem",
                  "5rem",
                  "5rem",
                  "5rem",
                  "5rem",
                ]}
                columnCount={10}
                filterCount={13}
                shrinkZero
              />
            }
          >
            <MunicipalitiesTable promises={promises} />
          </Suspense>
          {/* </FeatureFlagsProvider> */}
        </Shell>
      </div>
    </div>
  );
}
