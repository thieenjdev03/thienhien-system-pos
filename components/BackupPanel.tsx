import { useState, useRef } from 'react';
import { backupRepo } from '../repos/backupRepo';
import { vi } from '../shared/i18n/vi';
import { cn } from '@/lib/utils';

export function BackupPanel() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear message after 5 seconds
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Handle export
  const handleExport = async () => {
    setExporting(true);
    setMessage(null);

    try {
      const payload = await backupRepo.exportData();
      backupRepo.downloadAsFile(payload);
      showMessage('success', vi.backup.exportSuccess);
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : vi.backup.invalidData);
    } finally {
      setExporting(false);
    }
  };

  // Handle import button click
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input so same file can be selected again
    e.target.value = '';

    // Confirm before import
    const confirmed = window.confirm(vi.backup.importWarning);

    if (!confirmed) return;

    setImporting(true);
    setMessage(null);

    try {
      // Read file
      const raw = await backupRepo.readFile(file);

      // Validate payload
      const payload = backupRepo.validatePayload(raw);

      // Import data
      await backupRepo.importData(payload.data);

      showMessage('success', vi.backup.importSuccess);

      // Reload page to refresh all live queries
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error('Import error:', err);
      if (err instanceof Error) {
        // Handle Zod validation errors
        if (err.message.includes('Expected')) {
          showMessage('error', vi.backup.invalidFormat);
        } else {
          showMessage('error', err.message);
        }
      } else {
        showMessage('error', vi.backup.invalidData);
      }
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-[0.7rem] font-medium uppercase tracking-wide text-slate-900 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={handleExport}
        disabled={exporting || importing}
      >
        {exporting ? vi.backup.exporting : vi.backup.export}
      </button>

      <button
        className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-[0.7rem] font-medium uppercase tracking-wide text-slate-900 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={handleImportClick}
        disabled={exporting || importing}
      >
        {importing ? vi.backup.importing : vi.backup.import}
      </button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {message && (
        <span
          className={cn(
            'rounded-md px-2 py-1 text-xs font-medium',
            message.type === 'success'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          )}
        >
          {message.text}
        </span>
      )}
    </div>
  );
}
