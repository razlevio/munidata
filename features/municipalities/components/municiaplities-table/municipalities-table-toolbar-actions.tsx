"use client";

import type { Municipality } from "@prisma/client";
import type { Table } from "@tanstack/react-table";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { exportTableToCSV } from "@/lib/export";

interface MunicipalitiesTableToolbarActionsProps {
  table: Table<Municipality>;
}

export function MunicipalitiesTableToolbarActions({
  table,
}: MunicipalitiesTableToolbarActionsProps) {
  return (
    <div className="flex items-center gap-2">
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
        Export
      </Button>
    </div>
  );
}
