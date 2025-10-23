import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useShop } from "@/contexts/ShopContext";

interface OutfitButtonProps {
  onTryOutfit: () => void;
}

export const OutfitButton = ({ onTryOutfit }: OutfitButtonProps) => {
  const { selectedProducts } = useShop();
  
  if (selectedProducts.length === 0) return null;

  const getEmojis = () => {
    const emojis = ["👕", "👖", "🧥", "👗", "👠", "👟"];
    return selectedProducts.map((_, i) => emojis[i % emojis.length]).join("");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40"
      >
        <button
          onClick={onTryOutfit}
          className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-accent text-white rounded-full font-medium shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
        >
          <Sparkles className="animate-pulse" size={20} />
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold">Probar outfit completo</span>
            <span className="text-xs opacity-90">
              {selectedProducts.length} prenda{selectedProducts.length > 1 ? "s" : ""} seleccionada{selectedProducts.length > 1 ? "s" : ""} {getEmojis()}
            </span>
          </div>
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
