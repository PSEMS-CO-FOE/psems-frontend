import { useState } from 'react';
import { Button } from '@/components/ui';

/**
 * Building a PDF is slow enough to need a pending state and can fail, so every
 * download says so the same way rather than each screen inventing it.
 */
export function DownloadPdfButton({
  onDownload,
  label = 'Download PDF',
  disabled,
  variant = 'secondary',
}: {
  onDownload: () => Promise<void>;
  label?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'neutral';
}) {
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const run = async () => {
    setSaving(true);
    setFailed(false);
    try {
      await onDownload();
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button variant={variant} size="sm" onClick={run} disabled={disabled || saving}>
        {saving ? 'Preparing…' : label}
      </Button>
      {failed && (
        <span className="text-xs text-critical-700">
          The PDF could not be built. Try again, or reload the page.
        </span>
      )}
    </span>
  );
}
