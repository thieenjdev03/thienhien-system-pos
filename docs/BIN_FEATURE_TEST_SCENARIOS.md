# BIN Setup Feature - Test Scenarios

## Test Execution Summary

### Unit Tests: isValidBin()

**Test Cases Covered:**
- Accept 6-character alphanumeric BIN (POS001, ABC123, ABCDEF, 123456)
- Accept 12-character alphanumeric BIN
- Accept 7-11 character BINs
- Handle both uppercase and lowercase input
- Reject BINs shorter than 6 chars (POS00, ABC12, empty string)
- Reject BINs longer than 12 chars
- Reject BINs with special characters (-, ., _, @, #)
- Reject BINs with spaces
- Reject BINs with symbols (!, &, *)

**Expected Result:** All 40+ validation cases pass

### Unit Tests: saveBin/getBin/clearBin

**saveBin() Tests:**
- Save BIN to localStorage
- Convert BIN to uppercase when saving
- Handle mixed case conversion (Pos001 -> POS001)
- Overwrite existing BIN
- Handle server-side (no window) gracefully

**getBin() Tests:**
- Retrieve stored BIN
- Return null when BIN not stored
- Return null server-side
- Handle multiple retrieval calls

**clearBin() Tests:**
- Remove BIN from localStorage
- Handle clearing when no BIN exists
- Handle server-side gracefully

**Integration Tests:**
- Save and retrieve round-trip with case conversion
- Save, clear, re-save sequence

**Expected Result:** All 15+ storage tests pass

### Unit Tests: PIN Functions

**isValidPin() Tests:**
- Accept valid 4-6 digit PINs
- Reject shorter/longer PINs
- Reject non-digit characters

**hashPin() Tests:**
- Return consistent hash for same PIN
- Return different hash for different PINs
- Return hex string format
- Handle all PIN lengths

**verifyPin() Tests:**
- Verify correct PIN
- Reject incorrect PIN
- Handle all PIN lengths

**Expected Result:** All 20+ PIN tests pass

---

## Integration Test Scenarios

### Scenario 1: Fresh Start - New Device Setup
**Flow:**
1. User opens app for first time (no BIN, no users)
2. AuthContext initializes with hasBin=false, hasUsers=null
3. User redirected to /bin-setup page
4. User enters "POS001" (valid 6-char BIN)
5. System validates with isValidBin() → true
6. saveBin() stores "POS001" in localStorage
7. checkHasUsers() finds no users → redirects to /setup
8. User creates account and PIN
9. checkHasUsers() returns true
10. User redirected to /login
11. Navbar shows BIN badge "POS001"

**Validation Points:**
- isValidBin('POS001') returns true
- localStorage.getItem('pos_device_bin') === 'POS001'
- hasBin state changes from false to true
- Redirect to /setup (no users) works
- Navbar displays BIN correctly

### Scenario 2: BIN Already Set - Existing Device
**Flow:**
1. User reopens app (BIN already in localStorage)
2. AuthContext loads BIN from storage
3. hasBin=true detected, no redirect to /bin-setup
4. checkHasUsers() returns true
5. User redirected to /login (existing users)
6. Login page shows BIN badge in Navbar
7. User enters PIN and logs in
8. Navbar displays user name and BIN

**Validation Points:**
- getBin() retrieves stored BIN correctly
- hasBin=true prevents /bin-setup redirect
- Navbar shows BIN badge
- Login proceeds normally

### Scenario 3: BIN Not Set - Redirect from Login
**Flow:**
1. User somehow reaches /login without BIN
2. hasBin=false detected
3. User redirected to /bin-setup
4. User enters BIN
5. Proceeds to setup/login flow

**Validation Points:**
- Login page detects hasBin=false
- Redirect to /bin-setup happens
- BIN setup page loads
- Can proceed after BIN entry

### Scenario 4: BIN Not Set - Redirect from Setup
**Flow:**
1. User reaches /setup without BIN
2. hasBin=false detected
3. User redirected to /bin-setup
4. User enters BIN
5. Proceeds to setup flow

**Validation Points:**
- Setup page detects hasBin=false
- Redirect to /bin-setup happens
- After BIN saved, user returns to /setup

### Scenario 5: Invalid BIN Entry - Multiple Attempts
**Flow:**
1. User on /bin-setup page
2. Tries "POS00" (5 chars - too short)
3. Error message: "Mã BIN phải từ 6-12 ký tự chữ hoặc số."
4. Button disabled until 6+ chars entered
5. User clears and tries "POS@001" (special char)
6. Error message displayed
7. User enters "POS001" (valid)
8. Submit succeeds

**Validation Points:**
- isValidBin('POS00') returns false
- isValidBin('POS@001') returns false
- Error message displays
- Button states update correctly
- Valid entry succeeds

### Scenario 6: BIN Case Conversion
**Flow:**
1. User enters "pos001" (lowercase)
2. Input field shows "POS001" (uppercase)
3. saveBin() receives "pos001"
4. localStorage stores "POS001" (uppercase)
5. getBin() returns "POS001"
6. Navbar displays "POS001"

**Validation Points:**
- Input field converts to uppercase live
- saveBin() converts to uppercase
- getBin() returns uppercase
- Case conversion is consistent

### Scenario 7: Multiple Device Setup
**Flow:**
1. Device A: Set BIN "STOREA01"
2. Device B: Set BIN "STOREB01"
3. Each device has independent localStorage
4. Navbars show correct BINs

**Validation Points:**
- Each device has separate BIN
- No cross-device interference
- clearBin() affects only current device

---

## Build Verification

**Expected Results:**
- `npm run build` completes successfully
- All TypeScript checks pass
- All Next.js routes generated
- No build warnings for BIN feature
- Production bundle includes all new files

**Files to verify exist:**
- `/app/(auth)/bin-setup/page.tsx`
- `/utils/auth.ts` (BIN functions)
- `/contexts/AuthContext.tsx` (BIN state)
- `/components/ui/Navbar.tsx` (BIN display)

---

## Lint Verification

**Expected Results:**
- No ESLint errors in feature files
- TypeScript strict mode passes
- No unused imports/variables
- Proper code formatting

**Files to lint:**
- `utils/auth.ts`
- `contexts/AuthContext.tsx`
- `app/(auth)/bin-setup/page.tsx`
- `app/(auth)/login/page.tsx`
- `app/(auth)/setup/page.tsx`
- `components/ui/Navbar.tsx`

---

## Test Coverage Goals

**Target:** 100% coverage for BIN utilities

**Covered Functions:**
- isValidBin() - 40+ test cases
- saveBin() - 5 test cases
- getBin() - 4 test cases
- clearBin() - 3 test cases
- Integration scenarios - 7+ flows

**Total Coverage:** 60+ automated test cases + 7 integration scenarios

---

## Known Limitations

1. Jest not configured yet - test files created but not runnable without setup
2. React Testing Library tests not created yet
3. E2E tests (Cypress/Playwright) not included
4. LocalStorage mock is basic - works for unit tests
5. No integration with actual Next.js app during tests

---

## Future Test Enhancements

1. Install and configure Jest + React Testing Library
2. Create component tests for BinSetupPage
3. Create component tests for redirect logic
4. Create E2E tests for full auth flow
5. Add performance tests for localStorage operations
6. Add accessibility tests for BIN input field
