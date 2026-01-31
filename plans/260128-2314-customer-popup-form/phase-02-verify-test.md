# Phase 02: Verify & Test

## Context Links

- [Parent Plan](./plan.md)
- [Phase 01: Refactor](./phase-01-refactor-customer-form.md)

## Overview

- **Priority:** P2
- **Status:** Pending
- **Description:** Verify refactored CustomerForm works correctly

## Key Insights

- Manual testing required (no automated tests for UI)
- Test both add and edit modes
- Verify all modal close methods

## Requirements

### Functional
- All modal interactions work
- Form CRUD operations work
- No regressions

### Non-Functional
- No console errors
- Smooth UX transitions

## Test Checklist

### Modal Behavior Tests

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Open Add Modal | Click "+ Thêm khách hàng" button | Modal opens with empty form, title "Thêm khách hàng" |
| Open Edit Modal | Click "Sửa" on customer row | Modal opens with customer data, title "Sửa khách hàng" |
| Close via ESC | Press ESC key while modal open | Modal closes |
| Close via Overlay | Click outside modal content | Modal closes |
| Close via X Button | Click X button in modal header | Modal closes |
| Close via Cancel | Click "Hủy" button | Modal closes |
| Focus on Open | Open modal | Focus moves to modal |
| Focus on Close | Close modal | Focus returns to trigger button |
| Body Scroll Lock | Open modal, try to scroll page | Page should not scroll |

### Form Behavior Tests

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Validation - Empty Name | Submit with empty name field | Error: "Tên là bắt buộc" |
| Validation - Negative Debt | Enter negative debt, submit | Error message shown |
| Add Customer | Fill form, click "Thêm" | Customer added, modal closes, list updates |
| Edit Customer | Modify fields, click "Cập nhật" | Customer updated, modal closes, list updates |
| Loading State | Submit form | Button shows "Đang lưu...", disabled |

### Edge Cases

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Cancel During Edit | Edit customer, change values, Cancel | Modal closes, no changes saved |
| Quick Open/Close | Rapidly open and close modal | No errors, clean state |
| Large Address | Enter very long address text | Textarea expands, no overflow |

## Implementation Steps

1. Start dev server: `npm run dev`
2. Navigate to /customers
3. Execute test cases from checklists
4. Document any failures
5. Fix issues if found
6. Re-test after fixes

## Todo List

- [ ] Run dev server
- [ ] Test modal open (add mode)
- [ ] Test modal open (edit mode)
- [ ] Test ESC key close
- [ ] Test overlay click close
- [ ] Test X button close
- [ ] Test Cancel button close
- [ ] Test focus management
- [ ] Test form validation
- [ ] Test add customer flow
- [ ] Test edit customer flow
- [ ] Test loading state
- [ ] Verify no console errors

## Success Criteria

- [ ] All modal tests pass
- [ ] All form tests pass
- [ ] All edge case tests pass
- [ ] No console errors
- [ ] No visual regressions

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Edge case bugs | Low | Low | Manual testing covers most cases |
| Browser compatibility | Low | Medium | Test in Chrome, Safari, Firefox |

## Security Considerations

- N/A - testing phase only

## Next Steps

After verification:
1. Mark plan as completed
2. Consider applying pattern to other forms (ProductForm, etc.)
