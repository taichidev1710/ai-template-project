# Ví dụ · Form (AntD)

Trích từ `src/features/users/components/UserFormModal.tsx`.

## Pattern form trong modal
```tsx
export function UserFormModal({ open, initialValue, confirmLoading, onSubmit, onCancel }) {
  const { t } = useTranslation();
  const [form] = Form.useForm<UserInput>();
  const isEdit = Boolean(initialValue);

  // prefill / reset whenever the modal opens
  useEffect(() => {
    if (open) form.setFieldsValue(initialValue ?? { name: '', email: '', role: 'viewer' });
  }, [open, initialValue, form]);

  return (
    <Modal
      open={open}
      title={isEdit ? t('user.editTitle') : t('user.createTitle')}
      okText={t('action.save')}
      cancelText={t('action.cancel')}
      confirmLoading={confirmLoading}
      onOk={() => form.submit()}   // OK triggers form validation + onFinish
      onCancel={onCancel}
      destroyOnHidden
    >
      <Form<UserInput> form={form} layout="vertical" onFinish={onSubmit} requiredMark={false}>
        <Form.Item name="name" label={t('user.name')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="email" label={t('user.email')} rules={[{ required: true, type: 'email' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="role" label={t('user.role')} rules={[{ required: true }]}>
          <Select options={[
            { value: 'admin', label: 'Admin' },
            { value: 'editor', label: 'Editor' },
            { value: 'viewer', label: 'Viewer' },
          ]} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
```

## Tóm tắt quy tắc
- `Form.useForm<Input>()` có gõ kiểu; validation trong `rules`; submit qua `onFinish`.
- Page sở hữu state `open` và truyền `onSubmit`/`onCancel`; modal ở dạng trình bày
  (không fetch dữ liệu bên trong).
- Mọi label/thông báo đều là key i18n.
- `confirmLoading` phản ánh `isPending` của mutation.
