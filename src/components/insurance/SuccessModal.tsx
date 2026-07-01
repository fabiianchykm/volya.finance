"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CheckCircle, Download, ExternalLink } from "lucide-react";

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
  contractId: string;
}

export function SuccessModal({ open, onClose, contractId }: SuccessModalProps) {
  const [loading, setLoading] = useState(false);
  const [contract, setContract] = useState<{ mtsbuLink: string; contract: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/insurance/contract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "download", contractId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setContract(json.data);
      if (json.data.contract) {
        window.open(json.data.contract, "_blank");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка завантаження");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col items-center gap-5 text-center py-2">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle className="h-9 w-9 text-emerald-500" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-zinc-900">Поліс оформлено!</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Договір надіслано на вашу email-адресу
          </p>
        </div>

        <div className="w-full space-y-3">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            loading={loading}
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
            Завантажити договір (PDF)
          </Button>

          {contract?.mtsbuLink && (
            <a href={contract.mtsbuLink} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="md" className="w-full">
                <ExternalLink className="h-4 w-4" />
                Перевірити в реєстрі МТСБУ
              </Button>
            </a>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <button
          onClick={onClose}
          className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          Закрити
        </button>
      </div>
    </Modal>
  );
}
