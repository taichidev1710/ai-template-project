# Ví dụ · Data Hook (query + mutation)

Trích từ `src/features/users/hooks/use-users.ts`. Sao chép hình dạng này cho bất kỳ
entity nào.

## Query (đọc)
```tsx
export function useUsers(params: ListParams) {
  return useQuery({
    queryKey: usersKeys.list(params),      // key factory, never inline
    queryFn: () => usersApi.list(params),  // api layer, never axios directly
    placeholderData: keepPreviousData,     // smooth pagination
  });
}

export function useUser(id: string, enabled = true) {
  return useQuery({
    queryKey: usersKeys.detail(id),
    queryFn: () => usersApi.get(id),
    enabled: enabled && Boolean(id),
  });
}
```

## Mutation (ghi) — invalidate + toast + lỗi
```tsx
export function useUserMutations() {
  const qc = useQueryClient();
  const { message } = App.useApp();           // context-aware feedback
  const { t } = useTranslation();

  const invalidate = () => qc.invalidateQueries({ queryKey: usersKeys.lists() });
  const onError = (e: NormalizedError) => message.error(e.message || t('error.generic'));

  const create = useMutation({
    mutationFn: (input: UserInput) => usersApi.create(input),
    onSuccess: () => { void invalidate(); message.success(t('action.save')); },
    onError,
  });
  // update, remove follow the same shape
  return { create, update, remove };
}
```

## Tóm tắt quy tắc
- Đọc → `useQuery`; ghi → `useMutation`. Không fetch trong `useEffect`.
- Key lấy từ factory. Invalidate list sau một lần ghi thành công.
- Hiển thị lỗi qua `App.useApp().message`, không qua `console.log`.
