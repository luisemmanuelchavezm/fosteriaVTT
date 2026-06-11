import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface MorkBorgDisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MorkBorgDisclaimerModal({
  isOpen,
  onClose,
}: MorkBorgDisclaimerModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl rounded-2xl border border-amber-400/20 bg-stone-950 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 shrink-0">
          <h2 className="text-sm font-bold text-amber-300 uppercase tracking-widest">
            Disclaimer Mork Borg
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-500 hover:text-stone-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-5 text-stone-300 text-sm leading-relaxed">
          <p>
            FosteriaVTT is an independent production by Luis Emmanuel Chavez
            Malave and is not affiliated with Ockult Örtmästare Games or
            Stockholm Kartell. It is published under the MÖRK BORG Third Party
            License.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-10 rounded-lg bg-amber-800/60 hover:bg-amber-700 text-white text-sm font-bold border border-amber-600/30 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
