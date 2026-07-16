/** Query key factory — scoped by the owning Loại sơ đồ (`typeId`). */
export const ruleSetsKeys = {
  all: (typeId: string) => ['rule-sets', typeId] as const,
  list: (typeId: string) => [...ruleSetsKeys.all(typeId), 'list'] as const,
};
