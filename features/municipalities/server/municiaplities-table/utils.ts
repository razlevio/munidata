import {
  Building,
  Building2,
  CircleDotDashed,
  LandPlot,
  type LucideIcon,
  Map as MapIcon,
  MapPin,
  Mountain,
  PalmtreeIcon,
} from "lucide-react";

// Classification icons
export function getClassificationIcon(classification?: string): LucideIcon {
  switch (classification) {
    case "מועצה אזורית":
      return LandPlot;
    case "עירייה":
      return Building;
    case "מועצה מקומית":
      return Building2;
    default:
      return Building;
  }
}

// District icons
export function getDistrictIcon(district?: string): LucideIcon {
  switch (district) {
    case "אזור יהודה והשומרון":
      return Mountain;
    case "הדרום":
      return PalmtreeIcon;
    case "המרכז":
      return Building2;
    case "הצפון":
      return MapIcon;
    case "חיפה":
      return MapPin;
    case "ירושלים":
      return Building;
    case "תל אביב":
      return Building2;
    default:
      return CircleDotDashed;
  }
}

// Format number with commas
export function formatNumber(num?: number): string {
  if (num === undefined || num === null) {
    return "";
  }
  return new Intl.NumberFormat().format(num);
}

// Format socio-economic cluster
export function formatSocioEconomicCluster(cluster?: number): string {
  if (cluster === undefined || cluster === null) {
    return "";
  }
  return `${cluster} / 10`;
}

// Get socio-economic cluster color
export function getSocioEconomicClusterColor(cluster?: number): string {
  if (cluster === undefined || cluster === null) {
    return "bg-gray-200";
  }

  if (cluster <= 3) {
    return "bg-red-200 text-red-800";
  }
  if (cluster <= 6) {
    return "bg-yellow-200 text-yellow-800";
  }
  return "bg-green-200 text-green-800";
}
