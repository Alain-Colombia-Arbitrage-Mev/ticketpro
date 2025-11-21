import React, { useState, useEffect } from 'react'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

// Cache de imágenes para evitar recargas
const imageCache = new Set<string>();

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const { src, alt, style, className, loading = 'lazy', decoding = 'async', ...rest } = props

  // Prefetch de imagen si no está en cache
  useEffect(() => {
    if (!src || imageCache.has(src)) {
      setIsLoaded(true);
      return;
    }

    // Solo prefetch para las primeras 8 imágenes (above the fold)
    const img = new Image();
    img.src = src;
    img.onload = () => {
      imageCache.add(src);
      setIsLoaded(true);
    };
    img.onerror = () => {
      setDidError(true);
    };
  }, [src]);

  const handleError = () => {
    setDidError(true)
  }

  const handleLoad = () => {
    if (src) {
      imageCache.add(src);
    }
    setIsLoaded(true);
  }

  return didError ? (
    <div
      className={`inline-block bg-gray-900 text-center align-middle ${className ?? ''}`}
      style={style}
    >
      <div className="flex items-center justify-center w-full h-full">
        <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={src} />
      </div>
    </div>
  ) : (
    <img 
      src={src} 
      alt={alt} 
      className={`${className} ${!isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
      style={style} 
      loading={loading}
      decoding={decoding}
      {...rest} 
      onError={handleError}
      onLoad={handleLoad}
    />
  )
}
