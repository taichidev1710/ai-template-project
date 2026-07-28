export interface TierItem {
  id: string;
  key: string;
  name: string;
  description: string;
  rank: number;
  color: string;
  icon: string;
  permissionGroupIds: string[];
  perks: string[];
  limits: Record<string, number>;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TierInput {
  key: string;
  name: string;
  description?: string;
  rank?: number;
  color?: string;
  icon?: string;
  permissionGroupIds: string[];
  perks: string[];
  isDefault: boolean;
  isActive: boolean;
}

export interface TierListParams {
  page?: number;
  limit?: number;
  search?: string;
}
