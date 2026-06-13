export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  avatar: string;
  campañaCount: number;
  marketplaceCount: number;
}

export type SortField =
  | "none"
  | "marketplace"
  | "campañas"
  | "alfabetico"
  | "creacion";

export type SortDir = "asc" | "desc";
