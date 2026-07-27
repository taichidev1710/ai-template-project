export interface Role {
  id: string;
  key: string;
  name: string;
  description: string;
  permissions: string[];
  level: number;
  isSystem: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoleInput {
  key: string;
  name: string;
  description?: string;
  permissions: string[];
  level: number;
}

export interface RolesListParams {
  page?: number;
  limit?: number;
  search?: string;
}
