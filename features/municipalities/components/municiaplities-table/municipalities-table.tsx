"use client";

import type { Municipality } from "@prisma/client";
import { Download } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { DataTable } from "@/components/table/data-table";
import { DataTableAdvancedToolbar } from "@/components/table/data-table-advanced-toolbar";
import { DataTableSortList } from "@/components/table/data-table-sort-list";
import { DataTableToolbar } from "@/components/table/data-table-toolbar";
import { Button } from "@/components/ui/button";
import { MunicipalitiesTableActionBar } from "@/features/municipalities/components/municiaplities-table/municipalities-table-action-bar";
import { getMunicipalitiesTableColumns } from "@/features/municipalities/components/municiaplities-table/municipalities-table-columns";
import type {
  getClustersOptions,
  getMunicipalities,
  getMunicipalityClassificationCounts,
  getMunicipalityFilterCounts,
  getMunicipalitySocioEcoClusterRange,
  getMunicipalitySocioEconomicCounts,
} from "@/features/municipalities/server/municiaplities-table/queries";
import { useDataTable } from "@/hooks/use-data-table";
import { exportTableToCSV } from "@/lib/export";
import type { DataTableRowAction } from "@/types/data-table";

type MunicipalityWithCluster = Municipality & {
  parent_cluster?: {
    id: number;
    name: string;
  } | null;
};

interface MunicipalitiesTableProps {
  promises: Promise<
    [
      Awaited<ReturnType<typeof getMunicipalities>>,
      Awaited<ReturnType<typeof getMunicipalityClassificationCounts>>,
      Awaited<ReturnType<typeof getMunicipalitySocioEconomicCounts>>,
      Awaited<ReturnType<typeof getMunicipalitySocioEcoClusterRange>>,
      Awaited<ReturnType<typeof getMunicipalityFilterCounts>>,
      Awaited<ReturnType<typeof getClustersOptions>>,
    ]
  >;
}

export function MunicipalitiesTable({ promises }: MunicipalitiesTableProps) {
  // const { enableAdvancedFilter, filterFlag } = useFeatureFlags();
  // const [useAdvancedFilter, setUseAdvancedFilter] =
  // 	React.useState(enableAdvancedFilter);
  const enableAdvancedFilter = false;

  const [
    { data, pageCount },
    classificationCounts,
    socioEconomicCounts,
    socioEcoClusterRange,
    municipalityFilterCounts,
    clustersOptions,
  ] = React.use(promises);
  const router = useRouter();

  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<MunicipalityWithCluster> | null>(null);

  const columns = React.useMemo(
    () =>
      getMunicipalitiesTableColumns({
        classificationCounts,
        socioEconomicCounts,
        socioEcoClusterRange,
        clustersOptions,
        setRowAction,
        filterCounts: municipalityFilterCounts,
      }),
    [
      classificationCounts,
      socioEconomicCounts,
      socioEcoClusterRange,
      municipalityFilterCounts,
      clustersOptions,
    ]
  );

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data,
    columns,
    pageCount,
    // enableAdvancedFilter,
    initialState: {
      sorting: [{ id: "name", desc: false }],
      columnVisibility: {},
      columnPinning: { right: ["actions"] },
    },
    getRowId: (originalRow) => originalRow.id.toString(),
    shallow: false,
    clearOnDefault: true,
  });

  const handleRowClick = (row: MunicipalityWithCluster) => {
    router.push(`/municipalities/${row.id}`);
  };

  return (
    <>
      {/* <div className="mb-2 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setUseAdvancedFilter((prev) => !prev)}
        >
          {useAdvancedFilter ? "Use Simple Filters" : "Use Advanced Filters"}
        </Button>
      </div> */}
      <DataTable
        actionBar={<MunicipalitiesTableActionBar table={table} />}
        dir="rtl"
        onRowClick={handleRowClick}
        table={table}
      >
        {/* <MunicipalitiesTableToolbarActions table={table} /> */}
        {enableAdvancedFilter ? (
          <DataTableAdvancedToolbar table={table}>
            <DataTableSortList align="start" table={table} />
            {/* {filterFlag === "advancedFilters" ? (
							<DataTableFilterList
								table={table}
								shallow={shallow}
								debounceMs={debounceMs}
								throttleMs={throttleMs}
								align="start"
							/>
						) : (
							<DataTableFilterMenu
								table={table}
								shallow={shallow}
								debounceMs={debounceMs}
								throttleMs={throttleMs}
							/>
						)} */}
          </DataTableAdvancedToolbar>
        ) : (
          <DataTableToolbar table={table}>
            <Button
              onClick={() =>
                exportTableToCSV(table, {
                  filename: "municipalities",
                  excludeColumns: ["select", "actions"],
                })
              }
              size="sm"
              variant="outline"
            >
              <Download />
              ייצא
            </Button>
            <DataTableSortList align="end" table={table} />
          </DataTableToolbar>
        )}
      </DataTable>
    </>
  );
}
