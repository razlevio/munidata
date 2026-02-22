import * as fs from "node:fs";
import * as path from "node:path";
import * as XLSX from "xlsx";
import { z } from "zod";

// ! AFTER RUNNING THIS SCRIPT -> Manually add to munis-lms.json the 3 munis that are not in the excel file:
// ! תפן, נאות חובב, צור הדסה
// ! THEN RUN import-munis-unit.ts -> This will construct the combined munis from lms and unit files.

// Validation schema for raw data
const municipalitySchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.union([z.string(), z.number()]).transform((val) => String(val)),
  district: z.string().nullable(),
  classification: z.string().nullable(),
  year_getting_classification: z
    .union([z.string(), z.number()])
    .transform((val) => (val ? Number(val) : null))
    .nullable(),
  area_km: z
    .union([z.string(), z.number()])
    .transform((val) => (val ? Number(val.toString().replace(/,/g, "")) : null))
    .nullable(),
  total_population: z
    .union([z.string(), z.number()])
    .transform((val) => (val ? Number(val.toString().replace(/,/g, "")) : null))
    .nullable(),
  population_density: z
    .union([z.string(), z.number()])
    .transform((val) => (val ? Number(val.toString().replace(/,/g, "")) : null))
    .nullable(),
  male_population: z
    .union([z.string(), z.number()])
    .transform((val) => (val ? Number(val.toString().replace(/,/g, "")) : null))
    .nullable(),
  female_population: z
    .union([z.string(), z.number()])
    .transform((val) => (val ? Number(val.toString().replace(/,/g, "")) : null))
    .nullable(),
  natural_increase: z
    .union([z.string(), z.number()])
    .transform((val) => (val ? Number(val.toString().replace(/,/g, "")) : null))
    .nullable(),
  percent_growth_rate: z
    .union([z.string(), z.number()])
    .transform((val) => (val ? Number(val.toString().replace(/,/g, "")) : null))
    .nullable(),
  immigration_balance: z
    .union([z.string(), z.number()])
    .transform((val) => (val ? Number(val.toString().replace(/,/g, "")) : null))
    .nullable(),
  // Socio-economic
  socio_eco_cluster: z
    .union([z.string(), z.number()])
    .transform((val) => (val ? Number(val.toString().replace(/,/g, "")) : null))
    .nullable(),
  socio_eco_index: z
    .union([z.string(), z.number()])
    .transform((val) => (val ? Number(val.toString().replace(/,/g, "")) : null))
    .nullable(),
  socio_eco_rank: z
    .union([z.string(), z.number()])
    .transform((val) => (val ? Number(val.toString().replace(/,/g, "")) : null))
    .nullable(),
  // Income
  total_number_of_income_earners: z
    .union([z.string(), z.number()])
    .transform((val) => (val ? Number(val.toString().replace(/,/g, "")) : null))
    .nullable(),
  avg_income_per_income_earner: z
    .union([z.string(), z.number()])
    .transform((val) => (val ? Number(val.toString().replace(/,/g, "")) : null))
    .nullable()
    .optional(),
  // Education
  total_kindergartens: z
    .union([z.string(), z.number()])
    .transform((val) => (val ? Number(val.toString().replace(/,/g, "")) : null))
    .nullable(),
  total_schools: z
    .union([z.string(), z.number()])
    .transform((val) => (val ? Number(val.toString().replace(/,/g, "")) : null))
    .nullable(),
  total_classes: z
    .union([z.string(), z.number()])
    .transform((val) => (val ? Number(val.toString().replace(/,/g, "")) : null))
    .nullable(),
  total_students: z
    .union([z.string(), z.number()])
    .transform((val) => (val ? Number(val.toString().replace(/,/g, "")) : null))
    .nullable(),
  // Marital status
  percentage_singels: z
    .union([z.string(), z.number()])
    .transform((val) => (val ? Number(val.toString().replace(/,/g, "")) : null))
    .nullable(),
  percentage_married: z
    .union([z.string(), z.number()])
    .transform((val) => (val ? Number(val.toString().replace(/,/g, "")) : null))
    .nullable(),
  percentage_divorced: z
    .union([z.string(), z.number()])
    .transform((val) => (val ? Number(val.toString().replace(/,/g, "")) : null))
    .nullable(),
  percentage_widowed: z
    .union([z.string(), z.number()])
    .transform((val) => (val ? Number(val.toString().replace(/,/g, "")) : null))
    .nullable(),
  // Transportation
  total_vehicles: z
    .union([z.string(), z.number()])
    .transform((val) => (val ? Number(val.toString().replace(/,/g, "")) : null))
    .nullable(),
  total_car_accidents: z
    .union([z.string(), z.number()])
    .transform((val) => (val ? Number(val.toString().replace(/,/g, "")) : null))
    .nullable(),
});

// Header mapping configuration - using exact headers from Excel
const headerMapping = {
  "שם  הרשות": "name",
  "סמל הרשות": "code",
  "מחוז ": "district",
  "מעמד מוניציפלי": "classification",
  "שנת קבלת מעמד מוניציפלי  ": "year_getting_classification",
  'שטח \r\n(קמ"ר)': "area_km",
  'סה"כ  אוכלוסייה בסוף השנה': "total_population",
  "צפיפות אוכלוסייה לקמ''ר ביישובים שמנו 5,000 תושבים ויותר":
    "population_density",
  'סה"כ גברים בסוף השנה': "male_population",
  'סה"כ נשים בסוף השנה': "female_population",
  'ריבוי טבעי\r\nסה"כ': "natural_increase",
  "אחוז גידול האוכלוסייה לעומת השנה הקודמת": "percent_growth_rate",
  'מאזן הגירה ביישוב\r\nסה"כ': "immigration_balance",
  "אשכול\r\n(מ-1 עד 10, 1 הנמוך ביותר)   ": "socio_eco_cluster",
  "ערך מדד  ": "socio_eco_index",
  "דירוג\r\n(מ-1 עד 255, 1 הנמוך ביותר)  ": "socio_eco_rank",
  "כלל בעלי הכנסה": "total_number_of_income_earners",
  "שכר ממוצע לבעל הכנסה": "avg_income_per_income_earner",
  "ילדים בגנים של משרד החינוך": "total_kindergartens",
  "בתי ספר": "total_schools",
  כיתות: "total_classes",
  תלמידים: "total_students",
  רווקים: "percentage_singels",
  נשואים: "percentage_married",
  גרושים: "percentage_divorced",
  אלמנים: "percentage_widowed",
  'כלי רכב מנועיים\r\nסה"כ': "total_vehicles",
  'תאונות דרכים עם נפגעים\r\nסה"כ': "total_car_accidents",
};

// Add this type to properly type the sheet data
type SheetRow = Record<string, string | number | null>;

// Update the helper function to handle dashes correctly
function cleanMunicipalityName(name: string): string {
  return name
    .replace(/[^א-ת\s-]/g, "") // Keep Hebrew chars, spaces, and dashes
    .replace(/-/g, " ") // Replace dashes with spaces
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim(); // Remove leading/trailing spaces
}

function importMunicipalityData(filePath: string) {
  try {
    const workbook = XLSX.readFile(filePath);
    console.log("Available sheets:", workbook.SheetNames);

    const sheetName = "נתונים פיזיים ונתוני אוכלוסייה ";
    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
      throw new Error(
        `Sheet "${sheetName}" not found. Available sheets: ${workbook.SheetNames.join(", ")}`
      );
    }

    // Get headers from row 4 (0-based index 3)
    const headers = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: true,
      range: 3, // Get row 4
    })[0];

    if (!(headers && Array.isArray(headers))) {
      throw new Error("Failed to read headers from row 4");
    }

    // Debug: Print all headers and their values from first data row
    const firstDataRow = XLSX.utils.sheet_to_json(worksheet, {
      raw: true,
      range: 9, // Row 10 (0-based)
    })[0];

    console.log("\nHeader Analysis:");
    console.log("================");
    headers.forEach((header, index) => {
      const mappedField = headerMapping[header as keyof typeof headerMapping];
      console.log(`${index + 1}. Excel Header: "${header}"`);
      console.log(`   Mapped To: ${mappedField || "NOT MAPPED"}`);
      console.log(
        `   First Row Value: ${firstDataRow?.[header as keyof typeof firstDataRow] || "N/A"}`
      );
      console.log("----------------");
    });

    // Print unmapped fields from our headerMapping
    const unmappedFields = Object.entries(headerMapping).filter(
      ([header]) => !headers.includes(header)
    );

    if (unmappedFields.length > 0) {
      console.log("\nUnmapped Fields in headerMapping:");
      console.log("=================================");
      for (const [header, field] of unmappedFields) {
        console.log(`Header: "${header}" -> Field: "${field}"`);
      }
    }

    // Get the last row number from worksheet range
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
    const lastRow = range.e.r;

    // Properly type the sheet_to_json result
    const rawData = XLSX.utils.sheet_to_json<SheetRow>(worksheet, {
      raw: true,
      defval: null,
      range: `A10:${XLSX.utils.encode_col(range.e.c)}${lastRow}`, // Dynamic range based on worksheet
      header: headers as string[],
    });

    console.log("First row sample:", rawData[0]);

    // Process and validate each row
    const processedData = rawData
      .filter((row): row is SheetRow => {
        const hasName = Boolean(row["שם  הרשות"]);
        if (!hasName) {
          console.log("Row filtered out due to missing name:", row);
        }
        return hasName;
      })
      .map((row) => {
        const mappedData: Record<string, any> = {};

        // Clean and set the municipality name
        const rawName = row["שם  הרשות"];
        mappedData.name = cleanMunicipalityName(rawName as string);

        // Map other fields
        for (const [hebrewKey, englishKey] of Object.entries(headerMapping)) {
          if (hebrewKey === "שם  הרשות") {
            continue; // Skip name as we already handled it
          }
          if (row[hebrewKey] !== undefined) {
            mappedData[englishKey] = row[hebrewKey] ?? null;
          }
        }

        return mappedData;
      })
      .sort((a, b) => a.name.localeCompare(b.name, "he")) // Sort alphabetically in Hebrew
      .map((data, index) => ({
        ...data,
        id: index + 1, // Assign sequential IDs from 1 to 256
      }));

    // Debug the processed data
    console.log(`Processed ${processedData.length} municipalities`);
    console.log("First few municipalities:", processedData.slice(0, 3));

    // In the importMunicipalityData function, before validation:
    console.log("Sample data before validation:", processedData[0]);

    // After mapping but before filtering:
    console.log("Number of records before validation:", processedData.length);

    // Validate and finalize data
    const validatedData = processedData
      .map((data) => {
        try {
          const validatedData = municipalitySchema.parse(data);
          // Include created_at and updated_at fields that the database would normally add
          const now = new Date();
          return {
            ...validatedData,
            created_at: now,
            updated_at: now,
          };
        } catch (error) {
          if (error instanceof z.ZodError) {
            console.error(
              `Validation error for municipality ${data.id}:`,
              JSON.stringify(error.issues, null, 2)
            );
          }
          return null;
        }
      })
      .filter(
        (
          data
        ): data is z.infer<typeof municipalitySchema> & {
          created_at: Date;
          updated_at: Date;
        } => data !== null
      );

    return validatedData;
  } catch (error) {
    console.error("Error importing municipality data:", error);
    throw error;
  }
}

// Modify main function to save data as JSON instead of inserting to DB
async function main() {
  try {
    const filePath = path.join(
      process.cwd(),
      "prisma",
      "data",
      "external",
      "munis-lms-22.xlsx"
    );

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Excel file not found at path: ${filePath}`);
    }

    // Ensure the data directory exists
    const dataDir = path.join(process.cwd(), "prisma", "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(`Created directory: ${dataDir}`);
    }

    console.log("Reading file from:", filePath);
    const municipalityData = await importMunicipalityData(filePath);

    // Define the additional records
    const additionalRecords = [
      {
        id: 257,
        name: "תפן",
        code: "5555",
        district: "הצפון",
        classification: "מועצה מקומית",
        year_getting_classification: 1991,
        area_km: 2.7,
        total_population: 0,
        population_density: 0,
        male_population: 0,
        female_population: 0,
        natural_increase: 0,
        percent_growth_rate: 0,
        immigration_balance: 0,
        socio_eco_cluster: 0,
        socio_eco_index: 0,
        socio_eco_rank: 0,
        total_number_of_income_earners: 0,
        avg_income_per_income_earner: null, // Added missing field
        total_kindergartens: 0,
        total_schools: 0,
        total_classes: 0,
        total_students: 0,
        percentage_singels: 0,
        percentage_married: 0,
        percentage_divorced: 0,
        percentage_widowed: 0,
        total_vehicles: 0,
        total_car_accidents: 0,
        created_at: new Date("2025-04-21T13:19:01.120Z"), // Use Date object
        updated_at: new Date("2025-04-21T13:19:01.120Z"), // Use Date object
      },
      {
        id: 258,
        name: "נאות חובב",
        code: "5556",
        district: "הדרום",
        classification: "מועצה מקומית",
        year_getting_classification: 1975,
        area_km: 0,
        total_population: 0,
        population_density: 0,
        male_population: 0,
        female_population: 0,
        natural_increase: 0,
        percent_growth_rate: 0,
        immigration_balance: 0,
        socio_eco_cluster: 0,
        socio_eco_index: 0,
        socio_eco_rank: 0,
        total_number_of_income_earners: 0,
        avg_income_per_income_earner: null, // Added missing field
        total_kindergartens: 0,
        total_schools: 0,
        total_classes: 0,
        total_students: 0,
        percentage_singels: 0,
        percentage_married: 0,
        percentage_divorced: 0,
        percentage_widowed: 0,
        total_vehicles: 0,
        total_car_accidents: 0,
        created_at: new Date("2025-04-21T13:19:01.120Z"), // Use Date object
        updated_at: new Date("2025-04-21T13:19:01.120Z"), // Use Date object
      },
      {
        id: 259,
        name: "צור הדסה",
        code: "5557",
        district: "ירושלים",
        classification: "מועצה מקומית",
        year_getting_classification: 1960,
        area_km: 0,
        total_population: 10_091,
        population_density: 0,
        male_population: 0,
        female_population: 0,
        natural_increase: 0,
        percent_growth_rate: 0,
        immigration_balance: 0,
        socio_eco_cluster: 0,
        socio_eco_index: 0,
        socio_eco_rank: 0,
        total_number_of_income_earners: 0,
        avg_income_per_income_earner: null, // Added missing field
        total_kindergartens: 0,
        total_schools: 0,
        total_classes: 0,
        total_students: 0,
        percentage_singels: 0,
        percentage_married: 0,
        percentage_divorced: 0,
        percentage_widowed: 0,
        total_vehicles: 0,
        total_car_accidents: 0,
        created_at: new Date("2025-04-21T13:19:01.120Z"), // Use Date object
        updated_at: new Date("2025-04-21T13:19:01.120Z"), // Use Date object
      },
    ];

    // Combine imported data with additional records
    const finalData = [...municipalityData, ...additionalRecords];

    // Save data to JSON file
    const outputPath = path.join(dataDir, "munis-lms.json");
    fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2));

    console.log(
      `Successfully exported ${finalData.length} municipalities to ${outputPath}`
    );
  } catch (error) {
    console.error("Export failed:", error);
    process.exit(1); // Exit with error code
  }
}

main();
