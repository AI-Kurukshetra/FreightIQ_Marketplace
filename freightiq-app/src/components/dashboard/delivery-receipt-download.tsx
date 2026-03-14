"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type DeliveryReceiptDownloadProps = {
  shipmentId: string;
  autoDownload?: boolean;
  className?: string;
};

function extractFileName(disposition: string | null, fallback: string) {
  if (!disposition) {
    return fallback;
  }

  const match = disposition.match(/filename="?([^"]+)"?/i);
  return match?.[1] ?? fallback;
}

export function DeliveryReceiptDownload({
  shipmentId,
  autoDownload = false,
  className,
}: DeliveryReceiptDownloadProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const didAutoRun = useRef(false);

  const fallbackName = useMemo(
    () => `shipment-receipt-${shipmentId.slice(0, 8).toLowerCase()}.pdf`,
    [shipmentId]
  );

  const download = useCallback(async () => {
    setError(null);
    setIsDownloading(true);

    try {
      const response = await fetch(`/api/carrier/shipments/${shipmentId}/receipt`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Receipt download failed.");
      }

      const blob = await response.blob();
      const filename = extractFileName(response.headers.get("content-disposition"), fallbackName);
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(href);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Receipt download failed.");
    } finally {
      setIsDownloading(false);
    }
  }, [fallbackName, shipmentId]);

  useEffect(() => {
    if (!autoDownload || didAutoRun.current) {
      return;
    }

    didAutoRun.current = true;
    void download().finally(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete("receipt");
      window.history.replaceState({}, "", url.toString());
    });
  }, [autoDownload, download]);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => {
          void download();
        }}
        disabled={isDownloading}
        className="rounded-2xl border border-[var(--brand)]/40 bg-[var(--brand)]/15 px-4 py-2 text-sm font-semibold text-[var(--brand)] transition hover:bg-[var(--brand)]/25 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isDownloading ? "Preparing receipt..." : "Download Delivery Receipt"}
      </button>
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
