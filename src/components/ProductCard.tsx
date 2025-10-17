import { motion } from "framer-motion";
import { Eye } from "lucide-react";

interface ProductCardProps {
  id: string;
  name: string;
  price: string;
  image: string;
  onTryOn: () => void;
}

export const ProductCard = ({ name, price, image, onTryOn }: ProductCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group cursor-pointer"
    >
      <div className="relative overflow-hidden rounded-2xl bg-secondary aspect-square mb-4">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <button
              onClick={onTryOn}
              className="flex items-center gap-2 px-6 py-3 bg-white text-charcoal rounded-full font-medium hover:bg-accent hover:text-accent-foreground transition-all shadow-lg"
            >
              <Eye size={18} />
              Probar prenda
            </button>
          </div>
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="font-medium text-foreground">{name}</h3>
        <p className="text-muted-foreground">{price}</p>
      </div>
    </motion.div>
  );
};
