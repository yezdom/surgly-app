import { useState } from 'react';
import { ChevronLeft, ChevronRight, ThumbsUp, MessageCircle, Share2 } from 'lucide-react';

interface FacebookAdPreviewProps {
  primaryText: string;
  headline: string;
  description: string;
  cta: string;
  images: string[];
  ogImage?: string;
}

export default function FacebookAdPreview({
  primaryText,
  headline,
  description,
  cta,
  images,
  ogImage,
}: FacebookAdPreviewProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const displayImages = images.length > 0 ? images : (ogImage ? [ogImage] : []);
  const hasMultipleImages = displayImages.length > 1;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden max-w-xl mx-auto">
      {/* Facebook Post Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
            S
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 dark:text-white">Your Brand</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Sponsored</p>
          </div>
        </div>
      </div>

      {/* Primary Text */}
      {primaryText && (
        <div className="px-4 py-3">
          <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{primaryText}</p>
        </div>
      )}

      {/* Image Section with Carousel */}
      {displayImages.length > 0 && (
        <div className="relative bg-black">
          <img
            src={displayImages[currentImageIndex]}
            alt={`Ad visual ${currentImageIndex + 1}`}
            className="w-full h-auto max-h-96 object-contain"
            onError={(e) => {
              // Hide image if it fails to load
              e.currentTarget.style.display = 'none';
            }}
          />

          {hasMultipleImages && (
            <>
              {/* Navigation Buttons */}
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-lg"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5 text-gray-800" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-lg"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5 text-gray-800" />
              </button>

              {/* Image Counter */}
              <div className="absolute bottom-2 right-2 px-2 py-1 rounded-full bg-black/60 text-white text-xs font-medium">
                {currentImageIndex + 1} / {displayImages.length}
              </div>

              {/* Dot Indicators */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {displayImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition ${
                      index === currentImageIndex
                        ? 'bg-white'
                        : 'bg-white/40 hover:bg-white/60'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Link Card */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">yourwebsite.com</p>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{headline}</h3>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        )}
      </div>

      {/* CTA Button */}
      {cta && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <button className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition">
            {cta}
          </button>
        </div>
      )}

      {/* Engagement Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center gap-6 text-gray-600 dark:text-gray-400">
          <button className="flex items-center gap-2 hover:text-blue-600 transition">
            <ThumbsUp className="w-5 h-5" />
            <span className="text-sm font-medium">Like</span>
          </button>
          <button className="flex items-center gap-2 hover:text-blue-600 transition">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Comment</span>
          </button>
          <button className="flex items-center gap-2 hover:text-blue-600 transition">
            <Share2 className="w-5 h-5" />
            <span className="text-sm font-medium">Share</span>
          </button>
        </div>
      </div>

      {/* Preview Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 text-center">
        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
          Preview - How your ad will appear on Facebook
        </p>
      </div>
    </div>
  );
}
