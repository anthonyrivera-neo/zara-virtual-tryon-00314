import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Camera, ThumbsUp, ThumbsDown, Sparkles, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { uploadUserPhoto, generateVirtualTryOn, saveUserResult } from "@/lib/tryOnSimulation";
import { CameraCapture } from "./CameraCapture";

interface VirtualFittingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProduct: {
    id: string;
    name: string;
    image: string;
  } | null;
}

type Step = "select" | "upload" | "result";

export const VirtualFittingModal = ({
  isOpen,
  onClose,
  selectedProduct,
}: VirtualFittingModalProps) => {
  const [step, setStep] = useState<Step>("upload");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (file: File) => {
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    setShowCamera(false);
  };

  const handleTryOn = async () => {
    if (!uploadedFile || !selectedProduct) return;

    setIsProcessing(true);
    const toastId = toast.loading("Subiendo tu foto...");
    
    try {
      // Subir foto del usuario a Supabase Storage
      const photoUrl = await uploadUserPhoto(uploadedFile);
      setUploadedPhotoUrl(photoUrl);
      
      // Generar imagen con IA real
      toast.loading("Procesando con IA generativa... Esto puede tomar 30-60 segundos", { id: toastId });
      const result = await generateVirtualTryOn(
        photoUrl, 
        selectedProduct.image,
        selectedProduct.name
      );
      setResultUrl(result);
      
      toast.success("¡Imagen generada con IA exitosamente!", { id: toastId });
      setStep("result");
    } catch (error) {
      console.error("Error in try-on:", error);
      const errorMessage = error instanceof Error ? error.message : "Error al procesar la imagen. Inténtalo de nuevo.";
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFeedback = async (positive: boolean) => {
    if (!uploadedPhotoUrl || !selectedProduct || !resultUrl) return;

    try {
      await saveUserResult(
        uploadedPhotoUrl,
        selectedProduct.image,
        selectedProduct.name,
        resultUrl,
        positive ? 'like' : 'dislike'
      );

      toast.success(
        positive
          ? "¡Gracias! Me alegra que te guste cómo se ve"
          : "Gracias por tu feedback. ¿Te gustaría probar otra prenda?"
      );
      
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error("Error saving feedback:", error);
      toast.error("Error al guardar tu feedback");
    }
  };

  const handleClose = () => {
    setStep("upload");
    setUploadedImage(null);
    setUploadedPhotoUrl(null);
    setResultUrl(null);
    setUploadedFile(null);
    setIsProcessing(false);
    setShowCamera(false);
    onClose();
  };

  const handleRetry = () => {
    setStep("upload");
    setResultUrl(null);
  };

  if (!isOpen || !selectedProduct) return null;

  return (
    <AnimatePresence>
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
      {isOpen && !showCamera && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={handleClose}
        >
          {/* Backdrop with blur */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-border">
              <h2 className="text-2xl font-light tracking-tight text-foreground">
                Virtual Fitting Room
              </h2>
              <button
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-8">
              {/* Step Indicators */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <StepIndicator number={1} active={step === "upload"} label="Sube tu foto" />
                <div className="w-12 h-px bg-border" />
                <StepIndicator number={2} active={step === "result"} label="Resultado" />
              </div>

              {/* Upload Step */}
              {step === "upload" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h3 className="text-xl font-light mb-2">
                      Probando: <span className="font-medium">{selectedProduct.name}</span>
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Sube una foto tuya para ver cómo te quedaría esta prenda
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Product Image */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-muted-foreground">Prenda seleccionada</p>
                      <img
                        src={selectedProduct.image}
                        alt={selectedProduct.name}
                        className="w-full aspect-square object-cover rounded-xl"
                      />
                    </div>

                    {/* Upload Area */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-muted-foreground">Tu foto</p>
                      {uploadedImage ? (
                        <div className="relative">
                          <img
                            src={uploadedImage}
                            alt="Uploaded"
                            className="w-full aspect-square object-cover rounded-xl"
                          />
                          <button
                            onClick={() => {
                              setUploadedImage(null);
                              setUploadedFile(null);
                            }}
                            className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm text-foreground p-2 rounded-full hover:bg-background transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <button
                            onClick={() => setShowCamera(true)}
                            className="w-full aspect-square border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-4 hover:border-accent hover:bg-secondary/50 transition-all group"
                          >
                            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                              <Camera className="text-muted-foreground group-hover:text-accent transition-colors" size={28} />
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-medium text-foreground">Tomar foto</p>
                              <p className="text-xs text-muted-foreground mt-1">con tu cámara</p>
                            </div>
                          </button>
                          
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-border"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                              <span className="bg-white px-2 text-muted-foreground">o</span>
                            </div>
                          </div>

                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-4 border-2 border-dashed border-border rounded-xl flex items-center justify-center gap-3 hover:border-accent hover:bg-secondary/50 transition-all group"
                          >
                            <Upload className="text-muted-foreground group-hover:text-accent transition-colors" size={20} />
                            <div className="text-center">
                              <p className="text-sm font-medium text-foreground">Subir foto</p>
                            </div>
                          </button>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={handleTryOn}
                      disabled={!uploadedImage || isProcessing}
                      className="px-12 py-6 text-base bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      {isProcessing ? (
                        <>
                          <Sparkles className="animate-spin mr-2" size={20} />
                          Procesando con IA...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2" size={20} />
                          Generar con IA
                        </>
                      )}
                    </Button>
                  </div>

                  {!uploadedImage && (
                    <div className="text-center pt-4">
                      <p className="text-xs text-muted-foreground">
                        Powered by Lovable AI • Generación realista con IA
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Result Step */}
              {step === "result" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", damping: 15 }}
                    >
                      <Sparkles className="mx-auto text-accent mb-3" size={32} />
                    </motion.div>
                    <h3 className="text-xl font-light mb-2">¡Así te quedaría esta prenda!</h3>
                    <p className="text-muted-foreground text-sm">¿Te gusta cómo se ve?</p>
                  </div>

                  {/* Result Image - AI Generated */}
                  <div className="relative">
                    <img
                      src={resultUrl || uploadedImage || selectedProduct.image}
                      alt="Result"
                      className="w-full max-w-md mx-auto aspect-[3/4] object-cover rounded-xl shadow-lg"
                    />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                      <div className="bg-background/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Sparkles size={16} className="text-accent" />
                          Generado con IA
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {/* Retry Button */}
                    <div className="flex justify-center">
                      <button
                        onClick={handleRetry}
                        className="flex items-center gap-2 px-6 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <RotateCcw size={16} />
                        <span>Volver a intentar</span>
                      </button>
                    </div>

                    {/* Feedback Buttons */}
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={() => handleFeedback(false)}
                        className="flex items-center gap-2 px-6 py-3 bg-secondary hover:bg-muted text-foreground rounded-full transition-colors"
                      >
                        <ThumbsDown size={20} />
                        <span className="font-medium">No me convence</span>
                      </button>
                      <button
                        onClick={() => handleFeedback(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-accent-foreground rounded-full transition-colors"
                      >
                        <ThumbsUp size={20} />
                        <span className="font-medium">¡Me encanta!</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const StepIndicator = ({
  number,
  active,
  label,
}: {
  number: number;
  active: boolean;
  label: string;
}) => (
  <div className="flex items-center gap-2">
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
        active
          ? "bg-accent text-accent-foreground"
          : "bg-secondary text-muted-foreground"
      }`}
    >
      {number}
    </div>
    <span
      className={`text-sm font-medium transition-colors ${
        active ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      {label}
    </span>
  </div>
);
