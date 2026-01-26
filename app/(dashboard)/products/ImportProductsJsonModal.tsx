/**
 * Import Products from JSON Modal
 * Supports file upload or paste JSON, upsert or replace modes
 */

import { useState, useRef, useCallback } from 'react';
import { vi } from '@/shared/i18n/vi';
import { ProductImportItemSchema, type ProductImportItem } from '@/domain/schemas';
import { productRepo, type ImportMode, type ImportResult } from '@/repos/productRepo';
import { formatCurrency } from '@/utils/formatters';

interface ImportProductsJsonModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface ParseResult {
  items: ProductImportItem[];
  errors: Array<{ row: number; message: string }>;
}

/**
 * Sample JSON for download
 */
const SAMPLE_JSON = [
  {
    id: 1,
    category: 'CHỮ VẠN',
    name: 'Chữ Vạn 8 phân',
    unit: 'Cái',
    price1: 50000,
    price2: 45000,
    price3: 40000,
    note: '80 x 750 x 2.5mm',
  },
  {
    id: 2,
    category: 'KHUNG',
    name: 'Khung gỗ nhỏ',
    unit: 'Cái',
    price1: 120000,
    price2: null,
    price3: null,
    note: '',
  },
];

export function ImportProductsJsonModal({ onClose, onSuccess }: ImportProductsJsonModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [jsonText, setJsonText] = useState('');
  const [importMode, setImportMode] = useState<ImportMode>('upsert');
  const [isLoading, setIsLoading] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Parse JSON string and validate each item
   */
  const parseJson = useCallback((jsonStr: string): ParseResult => {
    const result: ParseResult = { items: [], errors: [] };

    // Parse JSON
    let data: unknown;
    try {
      data = JSON.parse(jsonStr);
    } catch {
      throw new Error(vi.productImport.invalidJson);
    }

    // Extract array from various formats
    let items: unknown[];
    if (Array.isArray(data)) {
      items = data;
    } else if (data && typeof data === 'object' && 'products' in data && Array.isArray((data as { products: unknown[] }).products)) {
      items = (data as { products: unknown[] }).products;
    } else {
      throw new Error(vi.productImport.invalidJson);
    }

    if (items.length === 0) {
      throw new Error(vi.productImport.noData);
    }

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const parsed = ProductImportItemSchema.safeParse(item);

      if (parsed.success) {
        result.items.push(parsed.data);
      } else {
        const firstError = parsed.error.issues[0];
        result.errors.push({
          row: i + 1,
          message: firstError?.message || vi.validation.invalidValue,
        });
      }
    }

    return result;
  }, []);

  /**
   * Handle file upload
   */
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setError(null);
      setParseResult(null);
      setImportResult(null);

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setJsonText(text);

        try {
          const result = parseJson(text);
          setParseResult(result);
        } catch (err) {
          setError(err instanceof Error ? err.message : vi.productImport.invalidJson);
        }
      };
      reader.onerror = () => {
        setError(vi.productImport.invalidJson);
      };
      reader.readAsText(file);
    },
    [parseJson]
  );

  /**
   * Handle JSON text change
   */
  const handleJsonTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      setJsonText(text);
      setError(null);
      setParseResult(null);
      setImportResult(null);

      if (text.trim()) {
        try {
          const result = parseJson(text);
          setParseResult(result);
        } catch (err) {
          setError(err instanceof Error ? err.message : vi.productImport.invalidJson);
        }
      }
    },
    [parseJson]
  );

  /**
   * Handle import button click
   */
  const handleImport = useCallback(async () => {
    if (!parseResult || parseResult.items.length === 0) return;

    // Confirm for replace mode
    if (importMode === 'replace') {
      if (!window.confirm(vi.productImport.confirmReplace)) {
        return;
      }
    }

    // Confirm for large imports
    if (parseResult.items.length > 50000) {
      if (!window.confirm(vi.productImport.confirmLargeImport)) {
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await productRepo.bulkImport(parseResult.items, importMode);
      setImportResult(result);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : vi.validation.invalidValue);
    } finally {
      setIsLoading(false);
    }
  }, [parseResult, importMode, onSuccess]);

  /**
   * Download sample JSON
   */
  const handleDownloadSample = useCallback(() => {
    const blob = new Blob([JSON.stringify(SAMPLE_JSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products-sample.json';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="modal-overlay">
      <div className="modal import-products-modal">
        <div className="modal-header">
          <h3>{vi.productImport.title}</h3>
          <button className="btn-close" onClick={onClose} disabled={isLoading}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          {/* File Upload */}
          <div className="form-group">
            <label>{vi.productImport.uploadFile}</label>
            <div className="file-upload-row">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                disabled={isLoading}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleDownloadSample}
              >
                {vi.productImport.downloadSample}
              </button>
            </div>
          </div>

          {/* Paste JSON */}
          <div className="form-group">
            <label>{vi.productImport.pasteJson}</label>
            <textarea
              className="json-textarea"
              value={jsonText}
              onChange={handleJsonTextChange}
              placeholder='[{"name": "...", "unit": "...", ...}]'
              rows={6}
              disabled={isLoading}
            />
          </div>

          {/* Import Mode */}
          <div className="form-group">
            <label>{vi.productImport.importMode}</label>
            <div className="import-mode-options">
              <label className="radio-option">
                <input
                  type="radio"
                  name="importMode"
                  value="upsert"
                  checked={importMode === 'upsert'}
                  onChange={() => setImportMode('upsert')}
                  disabled={isLoading}
                />
                <div className="radio-content">
                  <span className="radio-label">{vi.productImport.modeUpsert}</span>
                  <span className="radio-desc">{vi.productImport.modeUpsertDesc}</span>
                </div>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  disabled={isLoading}
                />
                <div className="radio-content">
                  <span className="radio-label">{vi.productImport.modeReplace}</span>
                  <span className="radio-desc">{vi.productImport.modeReplaceDesc}</span>
                </div>
              </label>
            </div>
          </div>

          {/* Error Display */}
          {error && <div className="import-error">{error}</div>}

          {/* Parse Result Preview */}
          {parseResult && !importResult && (
            <div className="parse-result">
              <div className="parse-stats">
                <span className="stat">
                  {vi.productImport.totalParsed}: <strong>{parseResult.items.length}</strong>
                </span>
                {parseResult.errors.length > 0 && (
                  <span className="stat stat-error">
                    {vi.productImport.errors}: <strong>{parseResult.errors.length}</strong>
                  </span>
                )}
              </div>

              {/* Preview Table */}
              {parseResult.items.length > 0 && (
                <div className="preview-section">
                  <h4>{vi.productImport.preview}</h4>
                  <div className="preview-table-wrapper">
                    <table className="preview-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>{vi.products.category}</th>
                          <th>{vi.products.name}</th>
                          <th>{vi.products.unit}</th>
                          <th>{vi.products.price1}</th>
                          <th>{vi.products.price2}</th>
                          <th>{vi.products.price3}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parseResult.items.slice(0, 20).map((item, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td>{item.category || '-'}</td>
                            <td>{item.name}</td>
                            <td>{item.unit}</td>
                            <td>{item.price1 !== null ? formatCurrency(item.price1) : '-'}</td>
                            <td>{item.price2 !== null ? formatCurrency(item.price2) : '-'}</td>
                            <td>{item.price3 !== null ? formatCurrency(item.price3) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Parse Errors */}
              {parseResult.errors.length > 0 && (
                <div className="errors-section">
                  <h4>{vi.productImport.errorDetails}</h4>
                  <ul className="error-list">
                    {parseResult.errors.slice(0, 10).map((err, idx) => (
                      <li key={idx}>
                        {vi.productImport.rowError
                          .replace('{row}', String(err.row))
                          .replace('{message}', err.message)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div className="import-result import-success">
              <h4>{vi.productImport.statusTitle}</h4>
              <div className="result-stats">
                <div className="stat-item">
                  <span className="stat-label">{vi.productImport.created}:</span>
                  <span className="stat-value success">{importResult.created}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{vi.productImport.updated}:</span>
                  <span className="stat-value">{importResult.updated}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{vi.productImport.skipped}:</span>
                  <span className="stat-value">{importResult.skipped}</span>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="stat-item">
                    <span className="stat-label">{vi.productImport.errors}:</span>
                    <span className="stat-value error">{importResult.errors.length}</span>
                  </div>
                )}
              </div>
              <p className="success-message">{vi.productImport.importSuccess}</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
            {importResult ? vi.actions.back : vi.productImport.cancel}
          </button>
          {!importResult && (
            <button
              className="btn btn-primary"
              onClick={handleImport}
              disabled={isLoading || !parseResult || parseResult.items.length === 0}
            >
              {isLoading ? vi.productImport.importing : vi.productImport.import}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
