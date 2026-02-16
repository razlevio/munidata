import "server-only";
import type { Prisma } from "@prisma/client";
import { addDays, endOfDay, startOfDay } from "date-fns";
import { db } from "@/lib/db";
import { unstable_cache } from "@/lib/unstable-cache";
import type { ExtendedColumnFilter, JoinOperator } from "@/types/data-table";
import type { GetMunicipalitiesSchema } from "./validations";

type WhereCondition = Prisma.MunicipalityWhereInput;

// Helper function to build advanced where conditions using Prisma syntax
function buildAdvancedWherePrisma(
  filters: ExtendedColumnFilter<unknown>[],
  joinOperator: JoinOperator
): WhereCondition {
  if (!filters || filters.length === 0) {
    return {};
  }

  const conditions = filters
    .map((filter): WhereCondition | undefined => {
      const { id: columnId, operator, value, variant } = filter;

      // Skip filters with empty values unless the operator handles them
      if (
        (value === null || value === undefined || value === "") &&
        operator !== "isEmpty" &&
        operator !== "isNotEmpty"
      ) {
        return undefined;
      }

      switch (operator) {
        case "iLike": // contains (case-insensitive)
          return typeof value === "string"
            ? { [columnId]: { contains: value, mode: "insensitive" } }
            : undefined;

        case "notILike": // does not contain (case-insensitive)
          return typeof value === "string"
            ? { [columnId]: { not: { contains: value, mode: "insensitive" } } }
            : undefined;

        case "eq": // equals
          if (variant === "boolean" && typeof value === "string") {
            return { [columnId]: value === "true" };
          }
          if (variant === "date" || variant === "dateRange") {
            try {
              const date = new Date(String(value));
              if (Number.isNaN(date.getTime())) {
                return undefined; // Invalid date
              }
              return {
                [columnId]: {
                  gte: startOfDay(date),
                  lte: endOfDay(date),
                },
              };
            } catch {
              return undefined; // Handle potential errors from new Date()
            }
          }
          return { [columnId]: value };

        case "ne": // is not equal
          if (variant === "boolean" && typeof value === "string") {
            return { [columnId]: { not: value === "true" } };
          }
          if (variant === "date" || variant === "dateRange") {
            try {
              const date = new Date(String(value));
              if (Number.isNaN(date.getTime())) {
                return undefined; // Invalid date
              }
              return {
                [columnId]: {
                  OR: [{ lt: startOfDay(date) }, { gt: endOfDay(date) }],
                },
              };
            } catch {
              return undefined; // Handle potential errors from new Date()
            }
          }
          return { [columnId]: { not: value } };

        case "inArray": // has any of
          return Array.isArray(value) && value.length > 0
            ? { [columnId]: { in: value } }
            : undefined;

        case "notInArray": // has none of
          return Array.isArray(value) && value.length > 0
            ? { [columnId]: { not: { in: value } } }
            : undefined;

        case "lt": // less than
          if (variant === "number" || variant === "range") {
            const num = Number(value);
            return Number.isNaN(num) ? undefined : { [columnId]: { lt: num } };
          }
          if (variant === "date") {
            try {
              const date = new Date(String(value));
              if (Number.isNaN(date.getTime())) {
                return undefined; // Invalid date
              }
              // Drizzle logic implies end of the day for lt
              return { [columnId]: { lt: endOfDay(date) } };
            } catch {
              return undefined;
            }
          }
          return undefined;

        case "lte": // less than or equal
          if (variant === "number" || variant === "range") {
            const num = Number(value);
            return Number.isNaN(num) ? undefined : { [columnId]: { lte: num } };
          }
          if (variant === "date") {
            try {
              const date = new Date(String(value));
              if (Number.isNaN(date.getTime())) {
                return undefined; // Invalid date
              }
              // Drizzle logic implies end of the day for lte
              return { [columnId]: { lte: endOfDay(date) } };
            } catch {
              return undefined;
            }
          }
          return undefined;

        case "gt": // greater than
          if (variant === "number" || variant === "range") {
            const num = Number(value);
            return Number.isNaN(num) ? undefined : { [columnId]: { gt: num } };
          }
          if (variant === "date") {
            try {
              const date = new Date(String(value));
              if (Number.isNaN(date.getTime())) {
                return undefined; // Invalid date
              }
              // Drizzle logic implies start of the day for gt
              return { [columnId]: { gt: startOfDay(date) } };
            } catch {
              return undefined;
            }
          }
          return undefined;

        case "gte": // greater than or equal
          if (variant === "number" || variant === "range") {
            const num = Number(value);
            return Number.isNaN(num) ? undefined : { [columnId]: { gte: num } };
          }
          if (variant === "date") {
            try {
              const date = new Date(String(value));
              if (Number.isNaN(date.getTime())) {
                return undefined; // Invalid date
              }
              // Drizzle logic implies start of the day for gte
              return { [columnId]: { gte: startOfDay(date) } };
            } catch {
              return undefined;
            }
          }
          return undefined;

        case "isBetween": // is between
          if (!Array.isArray(value) || value.length !== 2) {
            return undefined;
          }

          if (variant === "date" || variant === "dateRange") {
            try {
              const startDate = value[0]
                ? startOfDay(new Date(String(value[0])))
                : undefined;
              const endDate = value[1]
                ? endOfDay(new Date(String(value[1])))
                : undefined;

              if (startDate && Number.isNaN(startDate.getTime())) {
                return undefined;
              }
              if (endDate && Number.isNaN(endDate.getTime())) {
                return undefined;
              }

              if (startDate && endDate) {
                return { [columnId]: { gte: startDate, lte: endDate } };
              }
              if (startDate) {
                return { [columnId]: { gte: startDate } };
              }
              if (endDate) {
                return { [columnId]: { lte: endDate } };
              }
              return undefined; // Both are null/invalid
            } catch {
              return undefined;
            }
          }

          if (variant === "number" || variant === "range") {
            const num1 =
              value[0] !== null && value[0] !== "" ? Number(value[0]) : null;
            const num2 =
              value[1] !== null && value[1] !== "" ? Number(value[1]) : null;

            if (num1 !== null && Number.isNaN(num1)) {
              return undefined; // Invalid number
            }
            if (num2 !== null && Number.isNaN(num2)) {
              return undefined; // Invalid number
            }

            if (num1 !== null && num2 !== null) {
              // Ensure order for range queries if necessary, Prisma handles gte/lte order automatically
              return {
                [columnId]: {
                  gte: Math.min(num1, num2),
                  lte: Math.max(num1, num2),
                },
              };
            }
            if (num1 !== null) {
              // Drizzle logic used eq, Prisma uses 'equals'
              return { [columnId]: { equals: num1 } };
            }
            if (num2 !== null) {
              // Drizzle logic used eq, Prisma uses 'equals'
              return { [columnId]: { equals: num2 } };
            }
            return undefined; // Both are null/invalid
          }
          return undefined;

        case "isRelativeToToday": // relative date (e.g., "7 days", "-2 weeks")
          if (
            (variant === "date" || variant === "dateRange") &&
            typeof value === "string"
          ) {
            try {
              const today = new Date();
              const parts = value.split(" ");
              if (parts.length !== 2) {
                return undefined;
              }

              const amount = Number.parseInt(parts[0], 10);
              const unit = parts[1].toLowerCase();
              if (Number.isNaN(amount)) {
                return undefined;
              }

              let startDate: Date;
              let endDate: Date;

              switch (unit) {
                case "day":
                case "days":
                  startDate = startOfDay(addDays(today, amount));
                  endDate = endOfDay(startDate);
                  break;
                case "week":
                case "weeks":
                  // Assuming relative to the start of *today's* week calculation
                  startDate = startOfDay(addDays(today, amount * 7));
                  endDate = endOfDay(addDays(startDate, 6)); // End of that week
                  break;
                case "month":
                case "months":
                  // Approximation using 30 days like Drizzle example
                  startDate = startOfDay(addDays(today, amount * 30));
                  endDate = endOfDay(addDays(startDate, 29)); // End of that approx month
                  break;
                default:
                  return undefined;
              }
              return { [columnId]: { gte: startDate, lte: endDate } };
            } catch {
              return undefined; // Error during date calculation
            }
          }
          return undefined;

        case "isEmpty": // is empty/null
          // Prisma uses 'equals' for null checks
          return { [columnId]: { equals: null } };

        case "isNotEmpty": // is not empty/null
          return { [columnId]: { not: null } };

        default:
          // Optional: Log unsupported operator if needed
          // console.warn(`Unsupported filter operator: ${operator}`);
          return undefined;
      }
    })
    .filter(
      (condition): condition is WhereCondition => condition !== undefined
    ); // Filter out undefined results

  // Combine valid conditions with AND or OR
  if (conditions.length === 0) {
    return {};
  }
  if (conditions.length === 1) {
    return conditions[0];
  }

  return joinOperator === "and" ? { AND: conditions } : { OR: conditions };
}

export async function getMunicipalities(input: GetMunicipalitiesSchema) {
  return await unstable_cache(
    async () => {
      try {
        const offset = (input.page - 1) * input.perPage;
        const advancedTable =
          input.filterFlag === "advancedFilters" ||
          input.filterFlag === "commandFilters";

        // Build where condition based on filter type
        let where: WhereCondition = {};

        if (advancedTable) {
          // Use the new advanced filtering function
          where = buildAdvancedWherePrisma(input.filters, input.joinOperator);
        } else {
          // Basic filtering
          if (input.name && input.name.length > 0) {
            if (input.name.length === 1) {
              // Single name filter
              where.name = {
                contains: input.name[0],
                mode: "insensitive",
              };
            } else {
              // Multiple name filter
              where.OR = input.name.map((name) => ({
                name: {
                  contains: name,
                  mode: "insensitive",
                },
              }));
            }
          }

          if (input.classification && input.classification.length > 0) {
            where.classification = {
              in: input.classification,
            };
          }

          if (input.district && input.district.length > 0) {
            where.district = {
              in: input.district,
            };
          }

          if (input.cluster && input.cluster.length > 0) {
            if (input.cluster.includes("ללא")) {
              where.parent_cluster_id = null;
            } else {
              where.parent_cluster = {
                name: {
                  in: input.cluster,
                },
              };
            }
          }

          if (input.authority_sector && input.authority_sector.length > 0) {
            where.authority_sector = {
              in: input.authority_sector,
            };
          }

          // Add total_population range filter
          const totalPopulationFilter: { gte?: number; lte?: number } = {};
          if (input.total_population && input.total_population.length > 0) {
            if (
              input.total_population[0] !== null &&
              input.total_population[0] !== undefined
            ) {
              totalPopulationFilter.gte = input.total_population[0];
            }
            if (
              input.total_population[1] !== null &&
              input.total_population[1] !== undefined
            ) {
              totalPopulationFilter.lte = input.total_population[1];
            }
            if (Object.keys(totalPopulationFilter).length > 0) {
              where.total_population = totalPopulationFilter;
            }
          }

          // Fixed: Avoid delete by constructing the filter conditionally
          const socioEcoClusterFilter: { gte?: number; lte?: number } = {};
          if (input.socio_eco_cluster && input.socio_eco_cluster.length > 0) {
            if (
              input.socio_eco_cluster[0] !== null &&
              input.socio_eco_cluster[0] !== undefined
            ) {
              socioEcoClusterFilter.gte = input.socio_eco_cluster[0];
            }
            if (
              input.socio_eco_cluster[1] !== null &&
              input.socio_eco_cluster[1] !== undefined
            ) {
              socioEcoClusterFilter.lte = input.socio_eco_cluster[1];
            }
            if (Object.keys(socioEcoClusterFilter).length > 0) {
              where.socio_eco_cluster = socioEcoClusterFilter;
            }
          }

          // Fixed: Avoid delete by constructing the filter conditionally
          const geographicPeripheryFilter: { gte?: number; lte?: number } = {};
          if (
            input.geographic_periphery &&
            input.geographic_periphery.length > 0
          ) {
            if (
              input.geographic_periphery[0] !== null &&
              input.geographic_periphery[0] !== undefined
            ) {
              geographicPeripheryFilter.gte = input.geographic_periphery[0];
            }
            if (
              input.geographic_periphery[1] !== null &&
              input.geographic_periphery[1] !== undefined
            ) {
              geographicPeripheryFilter.lte = input.geographic_periphery[1];
            }
            if (Object.keys(geographicPeripheryFilter).length > 0) {
              where.geographic_periphery = geographicPeripheryFilter;
            }
          }

          // Handle boolean fields that come as strings
          if (input.social_periphery === "true") {
            where.social_periphery = true;
          } else if (input.social_periphery === "false") {
            where.social_periphery = false;
          }

          if (input.golan_heights_settlement === "true") {
            where.golan_heights_settlement = true;
          } else if (input.golan_heights_settlement === "false") {
            where.golan_heights_settlement = false;
          }

          if (input.northern_confrontation_line === "true") {
            where.northern_confrontation_line = true;
          } else if (input.northern_confrontation_line === "false") {
            where.northern_confrontation_line = false;
          }
        }

        // Use Prisma transaction for consistent count and data fetch
        const [data, total] = await db.$transaction([
          db.municipality.findMany({
            take: input.perPage,
            skip: offset,
            where,
            orderBy: input.sort?.length
              ? input.sort.map(
                  (item): Prisma.MunicipalityOrderByWithRelationInput => {
                    return { [item.id]: item.desc ? "desc" : "asc" };
                  }
                )
              : [{ name: "asc" }],
            include: {
              parent_cluster: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          }),
          db.municipality.count({ where }),
        ]);

        const pageCount = Math.ceil(total / input.perPage);
        return { data, pageCount };
      } catch (err) {
        console.error("Error fetching municipalities:", err);
        return { data: [], pageCount: 0 };
      }
    },
    ["munis-municipalities", JSON.stringify(input)],
    {
      revalidate: 120, // 2 minutes TODO: It was 1 second everything worked
      tags: ["municipalities"],
    }
  )();
}

// Get classification counts for faceted filtering
export async function getMunicipalityClassificationCounts() {
  return await unstable_cache(
    async () => {
      try {
        const classifications = await db.municipality.groupBy({
          by: ["classification"],
          _count: true,
        });

        // Create a record of classification counts
        return classifications.reduce(
          (acc, curr) => {
            if (curr.classification) {
              acc[curr.classification] = curr._count;
            }
            return acc;
          },
          {} as Record<string, number>
        );
      } catch (error) {
        console.error(
          "Error fetching municipality classification counts:",
          error
        );
        return {};
      }
    },
    ["munis-classification-counts"],
    {
      revalidate: 120, // 2 minutes
      tags: ["municipalities", "munis-classifications"],
    }
  )();
}

// Get socio-economic counts for faceted filtering
export async function getMunicipalitySocioEconomicCounts() {
  return await unstable_cache(
    async () => {
      try {
        const districts = await db.municipality.groupBy({
          by: ["district"],
          _count: true,
        });

        // Create a record of district counts
        return districts.reduce(
          (acc, curr) => {
            if (curr.district) {
              acc[curr.district] = curr._count;
            }
            return acc;
          },
          {} as Record<string, number>
        );
      } catch (error) {
        console.error("Error fetching municipality district counts:", error);
        return {};
      }
    },
    ["munis-socio-economic-counts"],
    {
      revalidate: 120, // 2 minutes
      tags: ["municipalities", "munis-districts"],
    }
  )();
}

// Get min and max socio-economic cluster values for range filtering
export async function getMunicipalitySocioEcoClusterRange() {
  return await unstable_cache(
    async () => {
      try {
        const results = await db.$queryRaw<{ min: number; max: number }[]>`
          SELECT
            MIN("socio_eco_cluster") as min,
            MAX("socio_eco_cluster") as max
          FROM municipalities
          WHERE "socio_eco_cluster" IS NOT NULL
        `;

        if (results && results.length > 0 && results[0]) {
          return {
            min: Number(results[0].min) || 1,
            max: Number(results[0].max) || 10,
          };
        }

        return { min: 1, max: 10 };
      } catch (error) {
        console.error(
          "Error fetching municipality socio-eco cluster range:",
          error
        );
        return { min: 1, max: 10 };
      }
    },
    ["munis-socio-eco-cluster-range"],
    {
      revalidate: 120, // 2 minutes
      tags: ["municipalities", "munis-socio-eco-cluster"],
    }
  )();
}

// Get counts for boolean and categorical filters
export async function getMunicipalityFilterCounts() {
  return await unstable_cache(
    async () => {
      try {
        // Get authority sector counts
        const authoritySectors = await db.municipality.groupBy({
          by: ["authority_sector"],
          _count: true,
        });

        const booleanCounts = await db.$queryRaw<any[]>`
				  SELECT
					SUM(CASE WHEN social_periphery = true THEN 1 ELSE 0 END) as social_periphery_true,
					SUM(CASE WHEN social_periphery = false THEN 1 ELSE 0 END) as social_periphery_false,
					SUM(CASE WHEN golan_heights_settlement = true THEN 1 ELSE 0 END) as golan_heights_settlement_true,
					SUM(CASE WHEN golan_heights_settlement = false THEN 1 ELSE 0 END) as golan_heights_settlement_false,
					SUM(CASE WHEN northern_confrontation_line = true THEN 1 ELSE 0 END) as northern_confrontation_line_true,
					SUM(CASE WHEN northern_confrontation_line = false THEN 1 ELSE 0 END) as northern_confrontation_line_false
				  FROM municipalities
				`;

        // Format the authority sector counts
        const authoritySectorCounts = authoritySectors.reduce(
          (acc, curr) => {
            if (curr.authority_sector) {
              acc[curr.authority_sector] = curr._count;
            }
            return acc;
          },
          {} as Record<string, number>
        );

        const booleanFieldCounts =
          booleanCounts.length > 0
            ? {
                social_periphery: {
                  true: Number(booleanCounts[0].social_periphery_true) || 0,
                  false: Number(booleanCounts[0].social_periphery_false) || 0,
                },
                golan_heights_settlement: {
                  true:
                    Number(booleanCounts[0].golan_heights_settlement_true) || 0,
                  false:
                    Number(booleanCounts[0].golan_heights_settlement_false) ||
                    0,
                },
                northern_confrontation_line: {
                  true:
                    Number(booleanCounts[0].northern_confrontation_line_true) ||
                    0,
                  false:
                    Number(
                      booleanCounts[0].northern_confrontation_line_false
                    ) || 0,
                },
              }
            : {};

        return {
          authoritySectorCounts,
          booleanFieldCounts,
        };
      } catch (error) {
        console.error("Error fetching municipality filter counts:", error);
        return {
          authoritySectorCounts: {},
          booleanFieldCounts: {},
        };
      }
    },
    ["munis-filter-counts"],
    {
      revalidate: 120, // 2 minutes
      tags: ["municipalities", "munis-filters"],
    }
  )();
}

// Get all clusters options for filtering
export async function getClustersOptions() {
  return await unstable_cache(
    async () => {
      try {
        return await db.cluster.findMany({
          select: {
            id: true,
            name: true,
          },
          orderBy: {
            name: "asc",
          },
        });
      } catch (error) {
        console.error("Error fetching clusters options:", error);
        return [];
      }
    },
    ["munis-clusters-options"],
    {
      revalidate: 120, // 2 minutes
      tags: ["clusters"],
    }
  )();
}
