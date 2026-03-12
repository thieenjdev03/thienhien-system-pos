/**
 * Vietnamese localization strings for POS MVP
 * All user-facing text must be Vietnamese
 */

const vi = {
  // App
  appName: 'Quản lý bán hàng',
  dashboard: 'Tổng quan',
  welcome: 'Chào mừng đến với hệ thống quản lý bán hàng.',
  quickActions: 'Thao tác nhanh',

  // Navigation
  nav: {
    home: 'Trang chủ',
    products: 'Sản phẩm',
    customers: 'Khách hàng',
    invoices: 'Hóa đơn',
  },

  // Common actions
  actions: {
    add: 'Thêm',
    edit: 'Sửa',
    delete: 'Xóa',
    save: 'Lưu',
    cancel: 'Hủy',
    search: 'Tìm kiếm',
    loading: 'Đang tải...',
    saving: 'Đang lưu...',
    update: 'Cập nhật',
    create: 'Tạo mới',
    back: 'Quay lại',
    clear: 'Xóa lựa chọn',
    confirm: 'Xác nhận',
    disable: 'Ngưng bán',
    enable: 'Kích hoạt',
  },

  // Products
  products: {
    title: 'Sản phẩm',
    addProduct: 'Thêm sản phẩm',
    editProduct: 'Sửa sản phẩm',
    name: 'Tên sản phẩm',
    category: 'Danh mục',
    unit: 'Đơn vị',
    price: 'Giá',
    price1: 'Giá 1',
    price2: 'Giá 2',
    price3: 'Giá 3',
    note: 'Ghi chú',
    status: 'Trạng thái',
    active: 'Đang bán',
    inactive: 'Ngưng bán',
    searchPlaceholder: 'Tìm sản phẩm...',
    emptyState: 'Chưa có sản phẩm.',
    emptySearch: 'Không tìm thấy sản phẩm.',
    confirmDisable: 'Bạn có chắc muốn ngưng bán sản phẩm này không?',
    unitPlaceholder: 'VD: cái, kg, hộp',
    // Sorting
    sortBy: 'Sắp xếp theo',
    sortByName: 'Tên sản phẩm',
    sortByCategory: 'Danh mục',
    sortByUpdatedAt: 'Cập nhật gần nhất',
    sortOrder: 'Thứ tự',
    sortAsc: 'Tăng dần (A → Z)',
    sortDesc: 'Giảm dần (Z → A)',
    sortTooltipAsc: 'Sắp xếp tăng dần',
    sortTooltipDesc: 'Sắp xếp giảm dần',
  },

  // Product Import
  productImport: {
    title: 'Nhập sản phẩm từ JSON',
    importBtn: 'Nhập JSON',
    uploadFile: 'Tải file JSON',
    pasteJson: 'Hoặc dán JSON vào đây',
    importMode: 'Chế độ nhập',
    modeUpsert: 'Gộp / Cập nhật (Upsert)',
    modeUpsertDesc: 'Cập nhật sản phẩm trùng, thêm sản phẩm mới',
    modeReplace: 'Thay thế toàn bộ (Replace all)',
    modeReplaceDesc: 'Xóa tất cả sản phẩm hiện có, nhập mới',
    confirmReplace: 'Thao tác này sẽ xóa toàn bộ sản phẩm hiện có. Bạn chắc chắn chứ?',
    confirmLargeImport: 'File chứa hơn 50,000 sản phẩm. Bạn có muốn tiếp tục không?',
    importing: 'Đang nhập...',
    importSuccess: 'Nhập thành công!',
    import: 'Nhập',
    cancel: 'Hủy',
    invalidJson: 'File JSON không hợp lệ.',
    noData: 'Không có dữ liệu để nhập.',
    // Status
    statusTitle: 'Kết quả nhập',
    totalParsed: 'Tổng số đọc được',
    created: 'Tạo mới',
    updated: 'Cập nhật',
    skipped: 'Bỏ qua',
    errors: 'Lỗi',
    errorDetails: 'Chi tiết lỗi (10 đầu tiên)',
    // Preview
    preview: 'Xem trước',
    scrollToViewAll: 'Cuộn để xem tất cả',
    downloadSample: 'Tải file mẫu',
    // Validation errors
    rowError: 'Dòng {row}: {message}',
    missingName: 'Thiếu tên sản phẩm',
    missingUnit: 'Thiếu đơn vị',
    invalidPrice: 'Giá không hợp lệ',
  },

  // Customers
  customers: {
    title: 'Khách hàng',
    addCustomer: 'Thêm khách hàng',
    editCustomer: 'Sửa khách hàng',
    name: 'Tên',
    phone: 'Số điện thoại',
    address: 'Địa chỉ',
    note: 'Ghi chú',
    debt: 'Công nợ',
    currentDebt: 'Công nợ hiện tại',
    searchPlaceholder: 'Tìm theo tên hoặc SĐT...',
    emptyState: 'Chưa có khách hàng.',
    emptySearch: 'Không tìm thấy khách hàng.',
    confirmDelete: 'Bạn có chắc muốn xóa khách hàng này không?',
    walkIn: 'Bán lẻ',
    walkInDescription: 'Khách vãng lai',
    phonePlaceholder: 'VD: 0901234567',
  },

  // Invoices
  invoices: {
    title: 'Hóa đơn',
    newInvoice: 'Tạo hóa đơn',
    invoiceDetail: 'Chi tiết hóa đơn',
    invoiceNo: 'Số hóa đơn',
    createdAt: 'Ngày tạo',
    customer: 'Khách hàng',
    subtotal: 'Tạm tính',
    discount: 'Giảm giá',
    total: 'Tổng cộng',
    paid: 'Khách đưa',
    change: 'Tiền thừa',
    debtIncrease: 'Phát sinh công nợ',
    note: 'Ghi chú',
    emptyState: 'Chưa có hóa đơn.',
    backToList: 'Quay lại danh sách',
    saveInvoice: 'Lưu hóa đơn',
    productSearch: 'Tìm sản phẩm',
    priceTierLabel: 'Loại giá',
    priceTierHint: 'Loại giá áp dụng cho sản phẩm thêm mới.',
    tierRetail: 'Bán lẻ',
    tierWholesale: 'Sỉ',
    tierDealer: 'Đại lý',
    tierChangeConfirm: 'Áp dụng cho toàn bộ sản phẩm trong giỏ?',
    customPrice: 'Giá chỉnh tay',
    resetToTier: 'Reset về giá tier',
    itemRemoved: 'Đã xoá',
    undo: 'Hoàn tác',
    owing: 'Còn thiếu',
    discountAmount: 'Giảm tiền',
    discountPercent: 'Giảm %',
    invoiceCreated: 'Đã tạo hoá đơn',
  },

  // Invoice items / Cart
  cart: {
    title: 'Giỏ hàng',
    addProducts: 'Thêm sản phẩm',
    productName: 'Tên sản phẩm',
    category: 'Danh mục',
    unit: 'Đơn vị',
    qty: 'Số lượng',
    unitPrice: 'Đơn giá',
    lineTotal: 'Thành tiền',
    note: 'Ghi chú',
    emptyCart: 'Thêm sản phẩm vào giỏ hàng',
    searchProducts: 'Tìm sản phẩm để thêm...',
    inCart: 'trong giỏ',
    priceTier: 'Chọn giá',
  },

  // Payment
  payment: {
    title: 'Thanh toán',
    selectPriceTier: 'Chọn mức giá',
  },

  // Backup
  backup: {
    export: 'Xuất JSON',
    import: 'Nhập JSON',
    exporting: 'Đang xuất...',
    importing: 'Đang nhập...',
    exportSuccess: 'Xuất dữ liệu thành công',
    importSuccess: 'Nhập thành công',
    importWarning: 'CẢNH BÁO: Nhập dữ liệu sẽ THAY THẾ toàn bộ dữ liệu hiện có!\n\nBạn có chắc muốn tiếp tục không?',
    invalidData: 'Dữ liệu không hợp lệ',
    invalidFormat: 'Định dạng file không hợp lệ',
  },

  // Validation messages
  validation: {
    required: 'Vui lòng nhập {field}.',
    nameRequired: 'Vui lòng nhập tên.',
    priceNonNegative: 'Đơn giá phải lớn hơn hoặc bằng 0.',
    qtyPositive: 'Số lượng phải lớn hơn 0.',
    invalidValue: 'Giá trị không hợp lệ.',
    atLeastOneItem: 'Vui lòng thêm ít nhất một sản phẩm.',
    discountNonNegative: 'Giảm giá không được âm.',
    paidNonNegative: 'Số tiền khách đưa không được âm.',
  },

  // Status badges
  status: {
    active: 'Đang bán',
    inactive: 'Ngưng bán',
  },

  // Authentication
  auth: {
    loginTitle: 'Đăng nhập',
    pin: 'Mã PIN',
    pinPlaceholder: 'Nhập mã PIN (4-6 số)',
    loginButton: 'Đăng nhập',
    loggingIn: 'Đang đăng nhập...',
    logout: 'Đăng xuất',
    invalidPin: 'Mã PIN không đúng.',
    pinRequired: 'Vui lòng nhập mã PIN.',
    pinLength: 'Mã PIN phải từ 4-6 chữ số.',
    pinMismatch: 'Mã PIN không khớp.',
    sessionExpired: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    setupTitle: 'Thiết lập tài khoản',
    setupDescription: 'Tạo mã PIN để bảo vệ ứng dụng',
    confirmPin: 'Xác nhận mã PIN',
    createAccount: 'Tạo tài khoản',
    creating: 'Đang tạo...',
    continue: 'Tiếp tục',
    back: 'Quay lại',
    complete: 'Hoàn tất',
  },
} as const;

// Type-safe translation function
export function t(key: string): string {
  const keys = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any = vi;

  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = result[k];
    } else {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }

  return typeof result === 'string' ? result : key;
}

// Export the translations object for direct access
export { vi };
export default vi;
