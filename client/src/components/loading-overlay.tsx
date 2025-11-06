import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import LoadingIndicator from "./loading-indicator";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  onClose?: () => void;
}

export default function LoadingOverlay({
  isVisible,
  message = "Loading...",
  onClose,
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#820d2a] via-[#820d2a] to-[#820d2a]"
          onClick={onClose}
        >
          <LoadingIndicator
            variant="splash"
            message={message}
            className="relative z-10"
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
