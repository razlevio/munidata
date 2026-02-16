"use client";

import type { Municipality } from "@prisma/client";
import type { Table } from "@tanstack/react-table";
import {
  Award, // acceleration_assistance
  BarChart,
  Building2,
  Download,
  MapPin,
  Mountain, // golan_heights_settlement
  Shield, // northern_confrontation_line
  SquareAsterisk,
  Trash2,
  UserCircle,
  Users,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { z } from "zod"; // Import zod for validation
import {
  DataTableActionBar,
  DataTableActionBarAction,
  DataTableActionBarSelection,
} from "@/components/table/data-table-action-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  deleteMunicipalities,
  updateMunicipalities,
} from "@/features/municipalities/server/actions";
import { exportTableToCSV } from "@/lib/export";
import {
  MUNIS_CLASSIFICATIONS,
  MUNIS_DISTRICTS,
  MUNIS_SECTORS,
} from "@/prisma/data/constants";

const actions = [
  "update-district",
  "update-classification",
  "update-authority_sector",
  "update-total_population",
  "update-socio_eco_cluster",
  "update-socio_eco_rank",
  "update-acceleration_assistance",
  "update-geographic_periphery",
  "update-social_periphery",
  "update-golan_heights_settlement",
  "update-northern_confrontation_line",
  "export",
  "delete",
] as const;
type Action = (typeof actions)[number];

interface MunicipalitiesTableActionBarProps {
  table: Table<Municipality>;
}

export function MunicipalitiesTableActionBar({
  table,
}: MunicipalitiesTableActionBarProps) {
  const rows = table.getFilteredSelectedRowModel().rows;
  const [isPending, startTransition] = React.useTransition();
  const [currentAction, setCurrentAction] = React.useState<Action | null>(null);
  const [populationInput, setPopulationInput] = React.useState<string>("");
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  const getIsActionPending = React.useCallback(
    (action: Action) => isPending && currentAction === action,
    [isPending, currentAction]
  );

  const onMunicipalityUpdate = React.useCallback(
    ({
      field,
      value,
    }: {
      field: // Extract field names from update actions
        | "district"
        | "classification"
        | "authority_sector"
        | "total_population"
        | "socio_eco_cluster"
        | "socio_eco_rank"
        | "acceleration_assistance"
        | "geographic_periphery"
        | "social_periphery"
        | "golan_heights_settlement"
        | "northern_confrontation_line";
      value: string; // All Select components pass string values
    }) => {
      const actionKey = `update-${field}` as Action;
      setCurrentAction(actionKey);

      startTransition(async () => {
        // Define Zod schemas for each field type
        const schemas = {
          // String fields (pass-through)
          district: z.string(),
          classification: z.string(),
          authority_sector: z.string(),

          // Boolean fields
          acceleration_assistance: z
            .enum(["true", "false"])
            .transform((v) => v === "true"),
          social_periphery: z
            .enum(["true", "false"])
            .transform((v) => v === "true"),
          golan_heights_settlement: z
            .enum(["true", "false"])
            .transform((v) => v === "true"),
          northern_confrontation_line: z
            .enum(["true", "false"])
            .transform((v) => v === "true"),

          // Number fields with custom error messages
          total_population: z.coerce
            .number()
            .int()
            .safe()
            .catch(() => {
              throw new Error("ערך אוכלוסייה לא תקין");
            }),
          socio_eco_cluster: z.coerce
            .number()
            .int()
            .min(1)
            .max(10)
            .catch(() => {
              throw new Error("ערך סוציו אקונומי לא תקין");
            }),
          socio_eco_rank: z.coerce
            .number()
            .int()
            .min(1)
            .max(255)
            .catch(() => {
              throw new Error("ערך דירוג סוציו לא תקין");
            }),
          geographic_periphery: z.coerce
            .number()
            .int()
            .min(1)
            .max(10)
            .catch(() => {
              throw new Error("ערך פריפריה גיאוגרפית לא תקין");
            }),
        } as const;

        try {
          // Parse the value with the appropriate schema
          const schema = schemas[field];
          const parsedValue = schema.parse(value);

          // Call the update with the properly typed value
          const { error } = await updateMunicipalities({
            ids: rows.map((row) => row.original.id),
            [field]: parsedValue,
          });

          if (error) {
            console.error(error);
            toast.error(error);
            return;
          }

          toast.success("רשויות עודכנו");
          setPopulationInput(""); // Clear input on success
        } catch (e) {
          // Handle validation errors
          const error = e instanceof Error ? e.message : "שגיאת עדכון";
          toast.error(error);
          setCurrentAction(null);
        }
      });
    },
    [rows, table] // populationInput state managed separately
  );

  const onMunicipalityExport = React.useCallback(() => {
    setCurrentAction("export");
    startTransition(() => {
      exportTableToCSV(table, {
        filename: "רשויות",
        excludeColumns: ["select", "actions"],
        onlySelected: true,
      });
    });
  }, [table]);

  const onMunicipalityDelete = React.useCallback(() => {
    setCurrentAction("delete");
    startTransition(async () => {
      const { error } = await deleteMunicipalities({
        ids: rows.map((row) => row.original.id),
      });

      if (error) {
        toast.error(error);
        return;
      }
      table.toggleAllRowsSelected(false);
    });
  }, [rows, table]);

  return (
    <DataTableActionBar table={table} visible={rows.length > 0}>
      <DataTableActionBarSelection table={table} />
      <Separator
        className="hidden data-[orientation=vertical]:h-5 sm:block"
        orientation="vertical"
      />
      <div className="flex flex-wrap items-center gap-1.5">
        {/* District */}
        <Select
          dir="rtl"
          onValueChange={(value) =>
            onMunicipalityUpdate({ field: "district", value })
          }
        >
          <SelectTrigger asChild>
            <DataTableActionBarAction
              isPending={getIsActionPending("update-district")}
              size="icon"
              tooltip="עדכון מחוז"
            >
              <MapPin />
            </DataTableActionBarAction>
          </SelectTrigger>
          <SelectContent align="center">
            <SelectGroup>
              {MUNIS_DISTRICTS.map((district) => (
                <SelectItem key={district} value={district}>
                  {district}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {/* Classification */}
        <Select
          dir="rtl"
          onValueChange={(value) =>
            onMunicipalityUpdate({ field: "classification", value })
          }
        >
          <SelectTrigger asChild>
            <DataTableActionBarAction
              isPending={getIsActionPending("update-classification")}
              size="icon"
              tooltip="עדכון סיווג רשויות"
            >
              <Building2 />
            </DataTableActionBarAction>
          </SelectTrigger>
          <SelectContent align="center">
            <SelectGroup>
              {MUNIS_CLASSIFICATIONS.map((classification) => (
                <SelectItem key={classification} value={classification}>
                  {classification}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {/* Authority Sector */}
        <Select
          dir="rtl"
          onValueChange={(value) =>
            onMunicipalityUpdate({ field: "authority_sector", value })
          }
        >
          <SelectTrigger asChild>
            <DataTableActionBarAction
              isPending={getIsActionPending("update-authority_sector")}
              size="icon"
              tooltip="עדכון מגזר"
            >
              <UserCircle />
            </DataTableActionBarAction>
          </SelectTrigger>
          <SelectContent align="center">
            <SelectGroup>
              {MUNIS_SECTORS.map((sector) => (
                <SelectItem key={sector} value={sector}>
                  {sector}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {/* Total Population (Popover with Input) */}
        <Popover onOpenChange={setIsPopoverOpen} open={isPopoverOpen}>
          <PopoverTrigger asChild>
            <DataTableActionBarAction
              isPending={getIsActionPending("update-total_population")}
              size="icon"
              tooltip="עדכון אוכלוסייה"
            >
              <Users />
            </DataTableActionBarAction>
          </PopoverTrigger>
          <PopoverContent align="center" className="w-auto p-2" dir="rtl">
            <div className="flex items-center gap-2">
              <Input
                className="h-8 text-right"
                onChange={(e) => setPopulationInput(e.target.value)}
                placeholder="הזן מספר..."
                type="number"
                value={populationInput}
              />
              <Button
                className="h-8"
                disabled={isPending || !populationInput}
                onClick={() => {
                  onMunicipalityUpdate({
                    field: "total_population",
                    value: populationInput,
                  });
                }}
                size="sm"
                variant="outline"
              >
                עדכן
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        {/* Socio-Eco Cluster */}
        <Select
          dir="rtl"
          onValueChange={(value) =>
            onMunicipalityUpdate({ field: "socio_eco_cluster", value })
          }
        >
          <SelectTrigger asChild>
            <DataTableActionBarAction
              isPending={getIsActionPending("update-socio_eco_cluster")}
              size="icon"
              tooltip="עדכון סוציו"
            >
              <SquareAsterisk />
            </DataTableActionBarAction>
          </SelectTrigger>
          <SelectContent align="center">
            <SelectGroup>
              {Array.from({ length: 10 }, (_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {i + 1}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {/* Socio-Eco Rank */}
        <Select
          dir="rtl"
          onValueChange={(value) =>
            onMunicipalityUpdate({ field: "socio_eco_rank", value })
          }
        >
          <SelectTrigger asChild>
            <DataTableActionBarAction
              isPending={getIsActionPending("update-socio_eco_rank")}
              size="icon"
              tooltip="עדכון דירוג סוציו"
            >
              <BarChart />
            </DataTableActionBarAction>
          </SelectTrigger>
          <SelectContent align="center">
            <SelectGroup>
              {Array.from({ length: 255 }, (_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {i + 1}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {/* Acceleration Assistance */}
        <Select
          dir="rtl"
          onValueChange={(value) =>
            onMunicipalityUpdate({ field: "acceleration_assistance", value })
          }
        >
          <SelectTrigger asChild>
            <DataTableActionBarAction
              isPending={getIsActionPending("update-acceleration_assistance")}
              size="icon"
              tooltip="עדכון תנאי האצה"
            >
              <Award />
            </DataTableActionBarAction>
          </SelectTrigger>
          <SelectContent align="center">
            <SelectGroup>
              <SelectItem value="true">כן</SelectItem>
              <SelectItem value="false">לא</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        {/* Geographic Periphery */}
        <Select
          dir="rtl"
          onValueChange={(value) =>
            onMunicipalityUpdate({ field: "geographic_periphery", value })
          }
        >
          <SelectTrigger asChild>
            <DataTableActionBarAction
              isPending={getIsActionPending("update-geographic_periphery")}
              size="icon"
              tooltip="עדכון פריפריה גיאוגרפית"
            >
              <Mountain />
            </DataTableActionBarAction>
          </SelectTrigger>
          <SelectContent align="center">
            <SelectGroup>
              {Array.from({ length: 10 }, (_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {i + 1}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* Social Periphery */}
        <Select
          dir="rtl"
          onValueChange={(value) =>
            onMunicipalityUpdate({ field: "social_periphery", value })
          }
        >
          <SelectTrigger asChild>
            <DataTableActionBarAction
              isPending={getIsActionPending("update-social_periphery")}
              size="icon"
              tooltip="עדכון פריפריה חברתית"
            >
              <UserCircle /> {/* Re-using icon */}
            </DataTableActionBarAction>
          </SelectTrigger>
          <SelectContent align="center">
            <SelectGroup>
              <SelectItem value="true">כן</SelectItem>
              <SelectItem value="false">לא</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        {/* Golan Heights Settlement */}
        <Select
          dir="rtl"
          onValueChange={(value) =>
            onMunicipalityUpdate({ field: "golan_heights_settlement", value })
          }
        >
          <SelectTrigger asChild>
            <DataTableActionBarAction
              isPending={getIsActionPending("update-golan_heights_settlement")}
              size="icon"
              tooltip="עדכון יישוב רמת הגולן"
            >
              <Mountain />
            </DataTableActionBarAction>
          </SelectTrigger>
          <SelectContent align="center">
            <SelectGroup>
              <SelectItem value="true">כן</SelectItem>
              <SelectItem value="false">לא</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        {/* Northern Confrontation Line */}
        <Select
          dir="rtl"
          onValueChange={(value) =>
            onMunicipalityUpdate({
              field: "northern_confrontation_line",
              value,
            })
          }
        >
          <SelectTrigger asChild>
            <DataTableActionBarAction
              isPending={getIsActionPending(
                "update-northern_confrontation_line"
              )}
              size="icon"
              tooltip="עדכון יישוב קו העימות"
            >
              <Shield />
            </DataTableActionBarAction>
          </SelectTrigger>
          <SelectContent align="center">
            <SelectGroup>
              <SelectItem value="true">כן</SelectItem>
              <SelectItem value="false">לא</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* --- Other Actions --- */}
        <DataTableActionBarAction
          isPending={getIsActionPending("export")}
          onClick={onMunicipalityExport}
          size="icon"
          tooltip="ייצוא רשויות"
        >
          <Download />
        </DataTableActionBarAction>
        <DataTableActionBarAction
          isPending={getIsActionPending("delete")}
          onClick={onMunicipalityDelete}
          size="icon"
          tooltip="מחיקת רשויות"
        >
          <Trash2 />
        </DataTableActionBarAction>
      </div>
    </DataTableActionBar>
  );
}
