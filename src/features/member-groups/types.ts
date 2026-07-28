export interface MemberGroup {
  id: string;
  key: string;
  name: string;
  description: string;
  grants: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MemberGroupInput {
  key: string;
  name: string;
  description?: string;
  grants: string[];
}

export interface MemberGroupListParams {
  page?: number;
  limit?: number;
  search?: string;
}
