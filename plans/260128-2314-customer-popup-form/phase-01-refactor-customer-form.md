# Phase 01: Refactor CustomerForm

## Context Links

- [Parent Plan](./plan.md)
- [Modal Component](../components/Modal.tsx)
- [CustomerForm](../app/(dashboard)/customers/CustomerForm.tsx)
- [CustomersPage](../app/(dashboard)/customers/CustomersPage.tsx)

## Overview

- **Priority:** P2
- **Status:** Pending
- **Description:** Integrate Modal component into CustomerForm, remove custom overlay

## Key Insights

1. **Modal component already has:**
   - ESC key handler
   - Overlay click-to-close
   - Focus management (store/restore)
   - Body scroll prevention
   - Aria accessibility (role="dialog", aria-modal, aria-labelledby)
   - Close button (X)

2. **CustomerForm currently:**
   - Wraps content in `<div className="form-modal">` overlay
   - Uses `<div className="form-modal-content">` for content box
   - Has Cancel button that calls `onCancel`
   - No ESC key handling (Modal provides this)

3. **Modal props needed:**
   - `isOpen: boolean` - control visibility
   - `onClose: () => void` - close handler
   - `title: string` - modal title
   - `children: ReactNode` - form content
   - `footer?: ReactNode` - optional footer (form actions)

## Requirements

### Functional
- CustomerForm displays in Modal popup when `showForm` is true
- Modal title shows "Thêm khách hàng" or "Sửa khách hàng" based on mode
- Form actions (Cancel/Save) in Modal footer
- All existing form validation preserved

### Non-Functional
- Consistent with existing Modal usage patterns
- Accessible (keyboard navigation, screen readers)
- No visual regression

## Architecture

```
CustomersPage
├── showForm state (boolean)
├── editingCustomer state (Customer | undefined)
└── CustomerForm (wrapped in Modal)
    ├── Modal (isOpen={showForm})
    │   ├── title={isEdit ? editCustomer : addCustomer}
    │   ├── onClose={onCancel}
    │   ├── children={form fields}
    │   └── footer={form actions}
    └── Form logic (validation, submit)
```

## Related Code Files

### Files to Modify

1. **`app/(dashboard)/customers/CustomerForm.tsx`**
   - Import Modal from `@/components/Modal`
   - Add `isOpen` prop to interface
   - Replace `<div className="form-modal">` with `<Modal>`
   - Move form actions to Modal `footer` prop
   - Remove self-managed overlay wrapper

2. **`app/(dashboard)/customers/CustomersPage.tsx`**
   - Pass `isOpen={showForm}` to CustomerForm
   - Update JSX if component signature changes

## Implementation Steps

### Step 1: Update CustomerForm Props

```typescript
interface CustomerFormProps {
  isOpen: boolean;  // NEW: control modal visibility
  customer?: Customer;
  onSave: (data: CustomerInput) => Promise<void>;
  onCancel: () => void;
}
```

### Step 2: Refactor CustomerForm Component

Replace:
```tsx
<div className="form-modal">
  <div className="form-modal-content">
    <h3>{title}</h3>
    <form>...</form>
  </div>
</div>
```

With:
```tsx
<Modal
  isOpen={isOpen}
  onClose={onCancel}
  title={isEdit ? vi.customers.editCustomer : vi.customers.addCustomer}
  footer={
    <>
      <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
        {vi.actions.cancel}
      </button>
      <button type="submit" form="customer-form" className="btn btn-primary" disabled={loading}>
        {loading ? vi.actions.saving : isEdit ? vi.actions.update : vi.actions.add}
      </button>
    </>
  }
>
  <form id="customer-form" onSubmit={handleSubmit}>
    {/* form fields */}
  </form>
</Modal>
```

### Step 3: Update CustomersPage

```tsx
{showForm && (
  <CustomerForm
    isOpen={showForm}
    customer={editingCustomer}
    onSave={handleSave}
    onCancel={handleCancel}
  />
)}
```

Or simplify to always render but control via `isOpen`:
```tsx
<CustomerForm
  isOpen={showForm}
  customer={editingCustomer}
  onSave={handleSave}
  onCancel={handleCancel}
/>
```

### Step 4: Handle Form Submit from Footer

Since submit button is in Modal footer (outside form), use:
- Add `id="customer-form"` to form element
- Add `form="customer-form"` to submit button

## Todo List

- [ ] Add `isOpen` prop to CustomerFormProps
- [ ] Import Modal from `@/components/Modal`
- [ ] Replace form-modal wrapper with Modal component
- [ ] Move title to Modal title prop
- [ ] Move form actions to Modal footer prop
- [ ] Add form id for external submit button
- [ ] Update CustomersPage to pass isOpen prop
- [ ] Test all close methods (ESC, overlay, X, Cancel)
- [ ] Test form submission (add/edit)
- [ ] Test validation errors display

## Success Criteria

- [ ] Form opens in centered Modal popup
- [ ] Modal closes on ESC key press
- [ ] Modal closes on overlay click
- [ ] Modal closes on X button click
- [ ] Modal closes on Cancel button click
- [ ] Form submits correctly (both add and edit modes)
- [ ] Validation errors display correctly
- [ ] Focus moves to Modal on open
- [ ] Focus restores after Modal close
- [ ] No console errors

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Form submit fails from footer | Low | High | Use form id + form attribute |
| Focus issues | Low | Medium | Modal already handles focus |
| Styling conflicts | Low | Low | Modal uses Tailwind, form keeps form-group classes |

## Security Considerations

- No security changes - form handling unchanged
- Input validation preserved

## Next Steps

After this phase:
1. Verify all functionality works → Phase 02
2. Consider applying same pattern to ProductForm (future task)
