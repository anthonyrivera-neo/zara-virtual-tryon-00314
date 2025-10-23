import { useState } from "react";
import { FloatingButton } from "@/components/FloatingButton";
import { VirtualFittingModal } from "@/components/VirtualFittingModal";
import { ProductCard } from "@/components/ProductCard";
import { ChatbotAgent } from "@/components/ChatbotAgent";
import { OutfitButton } from "@/components/OutfitButton";
import { useShop } from "@/contexts/ShopContext";
import productTshirt from "@/assets/product-tshirt.jpg";
import productJacket from "@/assets/product-jacket.jpg";
import productCoat from "@/assets/product-coat.jpg";

const products = [
  {
    id: "1",
    name: "Camiseta Básica",
    price: "€29.95",
    image: productTshirt,
  },
  {
    id: "2",
    name: "Chaqueta de Cuero",
    price: "€199.95",
    image: productJacket,
  },
  {
    id: "3",
    name: "Abrigo Elegante",
    price: "€149.95",
    image: productCoat,
  },
];

const Index = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<typeof products[0] | null>(null);
  const [isOutfitMode, setIsOutfitMode] = useState(false);
  const { addTriedProduct, selectedProducts, clearSelectedProducts } = useShop();

  const handleTryOn = (product: typeof products[0]) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
    setIsOutfitMode(false);
    addTriedProduct(product);
  };

  const handleTryOutfit = () => {
    if (selectedProducts.length > 0) {
      setIsModalOpen(true);
      setIsOutfitMode(true);
      selectedProducts.forEach(product => addTriedProduct(product));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-light tracking-tight text-foreground">
              NEO FITTING
            </h1>
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Mujer
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Hombre
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Niños
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-5xl sm:text-6xl font-light tracking-tight text-foreground">
            Prueba antes de comprar
          </h2>
          <p className="text-xl text-muted-foreground font-light">
            Experimenta el futuro de las compras online con nuestro probador virtual impulsado por IA
          </p>
          <div className="pt-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full text-sm text-muted-foreground">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              Powered by Neo Consulting
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="mb-12">
          <h3 className="text-3xl font-light tracking-tight text-foreground mb-2">
            Nuevas llegadas
          </h3>
          <p className="text-muted-foreground">
            Haz clic en "Probar prenda" para ver cómo te quedaría
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div key={product.id} id={`product-${product.id}`} className="transition-all duration-300">
              <ProductCard
                {...product}
                onTryOn={() => handleTryOn(product)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-medium text-foreground mb-4">Sobre nosotros</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Nuestra historia
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Sostenibilidad
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Carreras
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-4">Ayuda</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Contacto
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Envíos
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Devoluciones
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Privacidad
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Términos
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Cookies
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-4">Newsletter</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Suscríbete para recibir ofertas exclusivas
              </p>
              <input
                type="email"
                placeholder="tu@email.com"
                className="w-full px-4 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© 2025 Neo Consulting. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Floating Button */}
      <FloatingButton onChatClick={() => setIsChatbotOpen(true)} />

      {/* Outfit Button */}
      <OutfitButton onTryOutfit={handleTryOutfit} />

      {/* Chatbot Agent */}
      <ChatbotAgent
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        products={products}
      />

      {/* Virtual Fitting Modal */}
      <VirtualFittingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
          setIsOutfitMode(false);
          if (isOutfitMode) {
            clearSelectedProducts();
          }
        }}
        selectedProduct={isOutfitMode ? null : selectedProduct}
        selectedProducts={isOutfitMode ? selectedProducts : undefined}
      />
    </div>
  );
};

export default Index;
