import { createContext, useContext, useState, ReactNode } from "react";

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface ShopContextType {
  isTryOnModeActive: boolean;
  toggleTryOnMode: () => void;
  cart: CartItem[];
  addToCart: (product: Product) => void;
  triedProducts: Product[];
  addTriedProduct: (product: Product) => void;
  selectedProducts: Product[];
  toggleProductSelection: (product: Product) => void;
  clearSelectedProducts: () => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider = ({ children }: { children: ReactNode }) => {
  const [isTryOnModeActive, setIsTryOnModeActive] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [triedProducts, setTriedProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  const toggleTryOnMode = () => {
    setIsTryOnModeActive((prev) => !prev);
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const addTriedProduct = (product: Product) => {
    setTriedProducts((prev) => {
      if (prev.find((p) => p.id === product.id)) return prev;
      return [...prev, product];
    });
  };

  const toggleProductSelection = (product: Product) => {
    setSelectedProducts((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const clearSelectedProducts = () => {
    setSelectedProducts([]);
  };

  return (
    <ShopContext.Provider
      value={{
        isTryOnModeActive,
        toggleTryOnMode,
        cart,
        addToCart,
        triedProducts,
        addTriedProduct,
        selectedProducts,
        toggleProductSelection,
        clearSelectedProducts,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    // Fallback seguro si el proveedor no está montado aún
    return {
      isTryOnModeActive: true,
      toggleTryOnMode: () => {},
      cart: [],
      addToCart: () => {},
      triedProducts: [],
      addTriedProduct: () => {},
      selectedProducts: [],
      toggleProductSelection: () => {},
      clearSelectedProducts: () => {},
    } as ShopContextType;
  }
  return context;
};
