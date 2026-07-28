export interface MemberFeatureActionItem {
  key: string;
  label: string;
}

export interface MemberFeatureItem {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  actions: MemberFeatureActionItem[];
  enabled: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface MemberFeatureInput {
  key: string;
  name: string;
  description?: string;
  icon?: string;
  actions: MemberFeatureActionItem[];
  enabled: boolean;
  order?: number;
}

export interface MemberFeatureListParams {
  page?: number;
  limit?: number;
  search?: string;
}
