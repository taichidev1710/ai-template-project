export interface FeatureActionItem {
  key: string;
  label: string;
}

export interface FeatureItem {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  actions: FeatureActionItem[];
  enabled: boolean;
  order: number;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureInput {
  key: string;
  name: string;
  description?: string;
  icon?: string;
  actions: FeatureActionItem[];
  enabled: boolean;
  order?: number;
}

export interface FeatureListParams {
  page?: number;
  limit?: number;
  search?: string;
}
