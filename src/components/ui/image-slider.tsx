import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../lib/utils";

type SlideItem = string | React.ReactNode;

interface ImageSliderProps extends React.HTMLAttributes<HTMLDivElement> {
  slides: SlideItem[];
  interval?: number;
  /** @deprecated use slides instead */
  images?: string[];
}

const ImageSlider = React.forwardRef<HTMLDivElement, ImageSliderProps>(
  ({ slides: slidesProp, images, interval = 5000, className, ...props }, ref) => {
    const slides: SlideItem[] = slidesProp ?? images ?? [];
    const [currentIndex, setCurrentIndex] = React.useState(0);

    React.useEffect(() => {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
      }, interval);
      return () => clearInterval(timer);
    }, [slides.length, interval]);

    return (
      <div
        ref={ref}
        className={cn("relative w-full h-full overflow-hidden bg-background", className)}
        {...props}
      >
        <AnimatePresence initial={false}>
          {typeof slides[currentIndex] === "string" ? (
            <motion.img
              key={currentIndex}
              src={slides[currentIndex] as string}
              alt={`Slide ${currentIndex + 1}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute top-0 left-0 w-full h-full object-cover"
            />
          ) : (
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute top-0 left-0 w-full h-full"
            >
              {slides[currentIndex] as React.ReactNode}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-colors duration-300",
                currentIndex === index ? "bg-white" : "bg-white/50 hover:bg-white"
              )}
              aria-label={`Aller à la diapositive ${index + 1}`}
            />
          ))}
        </div>
      </div>
    );
  }
);

ImageSlider.displayName = "ImageSlider";

export { ImageSlider };
