export interface PermissionGroup {
  id: string;
  key: string;
  name: string;
  description: string;
  grants: string[];
  ownerId: string | null;
  assignerUserIds: string[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionGroupInput {
  key: string;
  name: string;
  description?: string;
  grants: string[];
}

export interface GroupListParams {
  page?: number;
  limit?: number;
  search?: string;
}
