"use client";

import type { Municipality } from "@prisma/client";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Check,
  Mountain,
  SquareAsterisk,
  UserCircle,
  Users,
} from "lucide-react";
import type * as React from "react";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getClassificationIcon,
  getDistrictIcon,
} from "@/features/municipalities/server/municiaplities-table/utils";

import {
  MUNIS_CLASSIFICATIONS,
  MUNIS_DISTRICTS,
  MUNIS_MINI,
  MUNIS_SECTORS,
} from "@/prisma/data/constants";
import type { DataTableRowAction } from "@/types/data-table";

type MunicipalityWithCluster = Municipality & {
  parent_cluster?: {
    id: number;
    name: string;
  } | null;
};

interface GetMunicipalitiesTableColumnsProps {
  classificationCounts: Record<string, number>;
  socioEconomicCounts: Record<string, number>;
  socioEcoClusterRange: { min: number; max: number };
  clustersOptions: { id: number; name: string }[];
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<MunicipalityWithCluster> | null>
  >;
  filterCounts?: {
    authoritySectorCounts: Record<string, number>;
    booleanFieldCounts: {
      social_periphery?: { true: number; false: number };
      golan_heights_settlement?: { true: number; false: number };
      northern_confrontation_line?: { true: number; false: number };
    };
  };
}

export function getMunicipalitiesTableColumns({
  classificationCounts,
  socioEconomicCounts,
  socioEcoClusterRange,
  filterCounts,
  clustersOptions,
}: GetMunicipalitiesTableColumnsProps): ColumnDef<MunicipalityWithCluster>[] {
  return [
    // Checkbox
    {
      id: "select",
      accessorKey: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all"
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          className="mr-4 translate-y-0.5"
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label="Select row"
          checked={row.getIsSelected()}
          className="mr-4 translate-y-0.5"
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 0,
    },
    // Name
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="שם רשות" />
      ),
      cell: ({ row }) => (
        <span className="truncate font-medium">{row.original.name}</span>
      ),
      meta: {
        label: "שם רשות",
        placeholder: "חפש רשויות...",
        variant: "multiSelect",
        options: MUNIS_MINI.map((municipality) => ({
          label: municipality.name,
          value: municipality.name,
        })),
      },
      enableColumnFilter: true,
      enableSorting: true,
      size: 40,
    },
    // District
    {
      id: "district",
      accessorKey: "district",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="מחוז" />
      ),
      cell: ({ row }) => {
        const district = row.original.district;
        if (!district) {
          return <div className="text-muted-foreground">-</div>;
        }

        const Icon = getDistrictIcon(district);

        return (
          <Badge className="py-1 [&>svg]:size-3.5" variant="outline">
            <Icon />
            <span>{district}</span>
          </Badge>
        );
      },
      meta: {
        label: "מחוז",
        variant: "multiSelect",
        options: MUNIS_DISTRICTS.map((district) => ({
          label: district,
          value: district,
          count: socioEconomicCounts[district] || 0,
          icon: getDistrictIcon(district),
        })),
      },
      enableColumnFilter: true,
      size: 40,
    },
    // Cluster
    {
      id: "cluster",
      accessorKey: "parent_cluster",
      accessorFn: (row) => row.parent_cluster?.name || null,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="אשכול אזורי" />
      ),
      cell: ({ row }) => {
        const cluster = row.original.parent_cluster?.name;
        if (!cluster) {
          return <div className="text-muted-foreground">-</div>;
        }

        return (
          <Badge className="py-1" variant="outline">
            <span>{cluster}</span>
          </Badge>
        );
      },
      meta: {
        label: "אשכול אזורי",
        variant: "multiSelect",
        options: [
          ...clustersOptions.map((cluster) => ({
            label: cluster.name,
            value: cluster.name,
          })),
          { label: "ללא", value: "ללא" },
        ],
      },
      enableColumnFilter: true,
      size: 40,
    },
    // Classification
    {
      id: "classification",
      accessorKey: "classification",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="סיווג רשות" />
      ),
      cell: ({ row }) => {
        const classification = row.original.classification;
        if (!classification) {
          return <div className="text-muted-foreground">-</div>;
        }
        const Icon = getClassificationIcon(classification);

        return (
          <Badge className="py-1 [&>svg]:size-3.5" variant="outline">
            <Icon />
            <span>{classification}</span>
          </Badge>
        );
      },
      meta: {
        label: "סיווג רשות",
        variant: "multiSelect",
        options: MUNIS_CLASSIFICATIONS.map((classification) => ({
          label: classification,
          value: classification,
          count: classificationCounts[classification] || 0,
          icon: getClassificationIcon(classification),
        })),
      },
      enableColumnFilter: true,
      size: 40,
    },
    // Authority Sector
    {
      id: "authority_sector",
      accessorKey: "authority_sector",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="מגזר" />
      ),
      cell: ({ row }) => {
        const sector = row.original.authority_sector;
        if (!sector) {
          return <div className="text-muted-foreground">-</div>;
        }

        return (
          <Badge className="py-1 [&>svg]:size-3.5" variant="outline">
            <UserCircle />
            <span>{sector}</span>
          </Badge>
        );
      },
      enableSorting: true,
      meta: {
        label: "מגזר",
        variant: "multiSelect",
        options: MUNIS_SECTORS.map((sector) => ({
          label: sector,
          value: sector,
          count: filterCounts?.authoritySectorCounts[sector] || 0,
        })),
      },
      enableColumnFilter: true,
      size: 40,
    },
    // Total Population
    {
      id: "total_population",
      accessorKey: "total_population",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="אוכלוסייה" />
      ),
      cell: ({ row }) => {
        const totalPopulation = row.original.total_population;
        const populationLastUpdate = row.original.population_last_update;
        const populationSource = row.original.population_source;

        if (totalPopulation === undefined || totalPopulation === null) {
          return <div className="text-muted-foreground">-</div>;
        }

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <Users className="size-3.5" />
                <span>{totalPopulation.toLocaleString()}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {populationLastUpdate && (
                <span className="text-xs">
                  {new Date(populationLastUpdate).toLocaleDateString("he-IL")}
                  {populationSource && ` - ${populationSource}`}
                </span>
              )}
            </TooltipContent>
          </Tooltip>
        );
      },
      meta: {
        label: "אוכלוסייה",
        variant: "range",
        range: [1, 1_500_000],
      },
      enableColumnFilter: true,
      enableSorting: true,
      size: 40,
    },
    // Socio-Economic Cluster
    {
      id: "socio_eco_cluster",
      accessorKey: "socio_eco_cluster",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="סוציו" />
      ),
      cell: ({ row }) => {
        const cluster = row.original.socio_eco_cluster;

        if (cluster === undefined || cluster === null) {
          return null;
        }

        return (
          <Badge className="py-1 [&>svg]:size-3.5" variant="outline">
            <SquareAsterisk />
            <span>{cluster}</span>
          </Badge>
        );
      },
      meta: {
        label: "סוציו",
        variant: "range",
        range: [socioEcoClusterRange.min || 1, socioEcoClusterRange.max || 10],
      },
      enableColumnFilter: true,
      size: 40,
    },
    // Geographic Periphery
    {
      id: "geographic_periphery",
      accessorKey: "geographic_periphery",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="פריפריה גיאוגרפית" />
      ),
      cell: ({ row }) => {
        const value = row.original.geographic_periphery;
        if (value === undefined || value === null) {
          return <div className="text-muted-foreground">-</div>;
        }

        return (
          <div className="flex items-center gap-1">
            <Mountain className="size-3.5" />
            <span>{value}</span>
          </div>
        );
      },
      enableColumnFilter: true,
      enableSorting: true,
      meta: {
        label: "פריפריה גיאוגרפית",
        variant: "range",
        range: [1, 10], // Adjust range as needed for your data
      },
      size: 40,
    },
    // Social Periphery
    {
      id: "social_periphery",
      accessorKey: "social_periphery",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="פריפריה חברתית" />
      ),
      cell: ({ row }) => {
        const value = row.original.social_periphery;

        return value ? (
          <Badge className="py-1 [&>svg]:size-3.5" variant="outline">
            <Check />
            <span>כן</span>
          </Badge>
        ) : (
          <div className="text-muted-foreground">לא</div>
        );
      },
      enableColumnFilter: true,
      enableSorting: true,
      meta: {
        label: "פריפריה חברתית",
        variant: "select",
        options: [
          {
            label: "כן",
            value: "true",
            count:
              filterCounts?.booleanFieldCounts?.social_periphery?.true || 0,
          },
          {
            label: "לא",
            value: "false",
            count:
              filterCounts?.booleanFieldCounts?.social_periphery?.false || 0,
          },
        ],
      },
      size: 40,
    },
    // Golan Heights Settlement
    {
      id: "golan_heights_settlement",
      accessorKey: "golan_heights_settlement",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ישוב רמת הגולן" />
      ),
      cell: ({ row }) => {
        const value = row.original.golan_heights_settlement;

        return value ? (
          <Badge className="py-1 [&>svg]:size-3.5" variant="outline">
            <Check />
            <span>כן</span>
          </Badge>
        ) : (
          <div className="text-muted-foreground">לא</div>
        );
      },
      enableColumnFilter: true,
      enableSorting: true,
      meta: {
        label: "ישובי רמת הגולן",
        variant: "select",
        options: [
          {
            label: "כן",
            value: "true",
            count:
              filterCounts?.booleanFieldCounts?.golan_heights_settlement
                ?.true || 0,
          },
          {
            label: "לא",
            value: "false",
            count:
              filterCounts?.booleanFieldCounts?.golan_heights_settlement
                ?.false || 0,
          },
        ],
      },
      size: 40,
    },
    // Northern Confrontation Line
    {
      id: "northern_confrontation_line",
      accessorKey: "northern_confrontation_line",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ישוב קו העימות" />
      ),
      cell: ({ row }) => {
        const value = row.original.northern_confrontation_line;

        return value ? (
          <Badge className="py-1 [&>svg]:size-3.5" variant="outline">
            <Check />
            <span>כן</span>
          </Badge>
        ) : (
          <div className="text-muted-foreground">לא</div>
        );
      },
      enableColumnFilter: true,
      enableSorting: true,
      meta: {
        label: "ישובי קו העימות",
        variant: "select",
        options: [
          {
            label: "כן",
            value: "true",
            count:
              filterCounts?.booleanFieldCounts?.northern_confrontation_line
                ?.true || 0,
          },
          {
            label: "לא",
            value: "false",
            count:
              filterCounts?.booleanFieldCounts?.northern_confrontation_line
                ?.false || 0,
          },
        ],
      },
      size: 40,
    },
  ];
}
