import { motion } from "framer-motion";
import { Shirt } from "lucide-react";
import { useShop } from "@/contexts/ShopContext";

interface FloatingButtonProps {
  onChatClick: () => void;
}

export const FloatingButton = ({ onChatClick }: FloatingButtonProps) => {
  const { isTryOnModeActive } = useShop();

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onChatClick}
      className="fixed bottom-8 left-8 w-16 h-16 bg-accent hover:bg-accent/90 text-accent-foreground rounded-full shadow-2xl flex items-center justify-center z-50 transition-all hover:shadow-accent/30 relative"
    >
      <Shirt size={28} />
      {isTryOnModeActive && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"
        />
      )}
    </motion.button>
  );
};
