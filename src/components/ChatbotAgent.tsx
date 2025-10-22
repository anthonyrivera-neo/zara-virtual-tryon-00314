import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, ShoppingCart, Shirt, Loader2 } from "lucide-react";
import { useShop } from "@/contexts/ShopContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
  products?: Array<{
    id: string;
    name: string;
    price: string;
    image: string;
  }>;
}

interface ChatbotAgentProps {
  isOpen: boolean;
  onClose: () => void;
  products: Array<{
    id: string;
    name: string;
    price: string;
    image: string;
  }>;
}

export const ChatbotAgent = ({ isOpen, onClose, products }: ChatbotAgentProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "¡Hola! Soy tu asistente de moda. Puedo ayudarte a activar/desactivar el modo de prueba, recomendar prendas similares o agregar productos al carrito. ¿En qué te puedo ayudar?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isTryOnModeActive, toggleTryOnMode, addToCart, triedProducts, cart } = useShop();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // Preparar contexto para el agente
      const context = {
        tryOnModeActive: isTryOnModeActive,
        triedProducts: triedProducts.map((p) => p.name),
        cartItems: cart.map((c) => `${c.name} (${c.quantity})`),
        availableProducts: products.map((p) => p.name),
      };

      const { data, error } = await supabase.functions.invoke("chatbot-agent", {
        body: {
          message: userMessage,
          context,
          conversationHistory: messages,
          products: products,
        },
      });

      if (error) throw error;

      // Procesar respuesta del agente
      const response = data.response;
      const action = data.action;
      const mentionedProducts = data.products || [];

      setMessages((prev) => [...prev, { role: "assistant", content: response, products: mentionedProducts }]);

      // Ejecutar acciones
      if (action?.type === "toggle_tryon") {
        toggleTryOnMode();
        toast.success(
          action.value
            ? "Modo de prueba activado ✨"
            : "Modo de prueba desactivado"
        );
      } else if (action?.type === "add_to_cart") {
        const product = products.find(
          (p) => p.name.toLowerCase() === action.productName.toLowerCase()
        );
        if (product) {
          addToCart(product);
          toast.success(`${product.name} agregado al carrito 🛒`);
        }
      }
    } catch (error) {
      console.error("Error en chatbot:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Lo siento, tuve un problema procesando tu mensaje. ¿Puedes intentar de nuevo?",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductClick = (productId: string) => {
    const element = document.getElementById(`product-${productId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("ring-2", "ring-accent", "ring-offset-2");
      setTimeout(() => {
        element.classList.remove("ring-2", "ring-accent", "ring-offset-2");
      }, 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="fixed bottom-24 left-8 w-96 h-[32rem] bg-white dark:bg-card rounded-2xl shadow-2xl flex flex-col z-50 border border-border"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                <Shirt className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Asistente de Moda</h3>
                <p className="text-xs text-muted-foreground">
                  {isTryOnModeActive ? "Modo prueba activo" : "Modo prueba inactivo"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-secondary rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.role === "user"
                      ? "bg-accent text-accent-foreground"
                      : "bg-secondary text-foreground"
                  }`}
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  
                  {/* Product Preview Cards */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.products.map((product) => (
                        <div
                          key={product.id}
                          className="bg-background border border-border rounded-lg p-2 flex gap-3 items-center hover:shadow-md transition-shadow"
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {product.name}
                            </p>
                            <p className="text-xs text-accent font-bold">
                              {product.price}
                            </p>
                          </div>
                          <button
                            onClick={() => handleProductClick(product.id)}
                            className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-xs hover:opacity-90 transition-opacity whitespace-nowrap"
                          >
                            Ver 🔗
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-secondary rounded-2xl px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Pensando...</span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje..."
                className="flex-1 px-4 py-2 bg-secondary border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="w-10 h-10 bg-accent text-accent-foreground rounded-full flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            {cart.length > 0 && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <ShoppingCart className="w-3 h-3" />
                <span>{cart.length} {cart.length === 1 ? "artículo" : "artículos"} en el carrito</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
