# 90 · Anti-Patterns (đọc trước khi sinh code)

Các ví dụ phản diện. Mỗi cái là một lỗi thật mà AI hay mắc trong stack này, kèm
phương án đúng.

### ❌ Hardcode màu / spacing
```tsx
<div style={{ color: '#1677ff', padding: 13 }} />
<div className="bg-[#ffffff] text-blue-500 p-[13px]" />
```
### ✅ Chỉ dùng token
```tsx
<div className="text-primary p-3 bg-surface" />        // p-3 = 12px
// or read AntD tokens: const { token } = theme.useToken();
```

---

### ❌ Fetch trong useEffect + tự quản state
```tsx
const [users, setUsers] = useState([]);
useEffect(() => { axios.get('/users').then(r => setUsers(r.data)); }, []);
```
### ✅ Hook TanStack Query
```tsx
const { data } = useUsers({ page, pageSize });
```

---

### ❌ Gọi HTTP client từ một component
```tsx
const onSave = () => axios.post('/users', values);
```
### ✅ Component → hook → tầng api
```tsx
const { create } = useUserMutations();
const onSave = (values) => create.mutate(values);
```

---

### ❌ Query key viết inline / trùng lặp
```tsx
useQuery({ queryKey: ['users', page], queryFn: ... });
```
### ✅ Key factory
```tsx
useQuery({ queryKey: usersKeys.list(params), queryFn: ... });
```

---

### ❌ Lưu dữ liệu server vào Zustand rồi đồng bộ thủ công
```tsx
const setUsers = useUserStore(s => s.setUsers); // then refetch/sync manually
```
### ✅ Server state thuộc về TanStack Query; Zustand chỉ dành cho client/UI state.

---

### ❌ Tạo một `tailwind.config.js`
Tailwind 4 theo hướng CSS-first. Cấu hình nằm trong `@theme` của `src/styles/index.css`.
### ✅ Thêm token/utility trong `index.css`, ánh xạ tới các biến `--app-*`.

---

### ❌ Feedback AntD tĩnh (mất context theme trong v6)
```tsx
import { message } from 'antd';
message.success('done');
```
### ✅ Feedback bám theo context
```tsx
const { message } = App.useApp();
message.success(t('action.save'));
```

---

### ❌ Chọc thẳng vào nội bộ của một feature
```tsx
import { UsersTable } from '@/features/users/components/UsersTable';
```
### ✅ Import qua API công khai của feature
```tsx
import { UsersPage } from '@/features/users';
```

---

### ❌ Hardcode chuỗi UI / path
```tsx
<Button>Delete</Button>   navigate('/users');
```
### ✅ Key i18n + hằng số path
```tsx
<Button>{t('action.delete')}</Button>   navigate(paths.users);
```

---

### ❌ Component mới trùng lặp với AntD hoặc một component shared sẵn có
### ✅ Tái sử dụng AntD + `src/shared/ui`; cấu hình qua props.

---

### ❌ Dùng `any`, `!` non-null khắp nơi, bỏ qua `undefined` từ truy cập index
### ✅ Type chính xác; xử lý `undefined` (`arr[0] ?? fallback`).
