// Sistema de caché para imágenes de Steam
class ImageCache {
    constructor() {
      this.cache = new Map();
      this.loadingPromises = new Map();
    }
  
    /**
     * Obtiene una imagen con caché
     */
    async getImage(url) {
      // Si ya está en caché, devolverla inmediatamente
      if (this.cache.has(url)) {
        return this.cache.get(url);
      }
  
      // Si ya se está cargando, esperar esa promesa
      if (this.loadingPromises.has(url)) {
        return this.loadingPromises.get(url);
      }
  
      // Crear nueva promesa de carga
      const loadPromise = this.loadImage(url);
      this.loadingPromises.set(url, loadPromise);
  
      try {
        const result = await loadPromise;
        this.cache.set(url, result);
        return result;
      } finally {
        this.loadingPromises.delete(url);
      }
    }
  
    /**
     * Carga una imagen y la convierte a base64
     */
    async loadImage(url) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            resolve(dataUrl);
          } catch (e) {
            // Si falla la conversión, usar la URL original
            resolve(url);
          }
        };
  
        img.onerror = () => {
          // Si falla la carga, intentar con la imagen horizontal
          resolve(null);
        };
  
        img.src = url;
      });
    }
  
    /**
     * Pre-carga múltiples imágenes
     */
    async preloadImages(urls) {
      const promises = urls.map(url => this.getImage(url));
      return Promise.allSettled(promises);
    }
  
    /**
     * Limpia el caché
     */
    clear() {
      this.cache.clear();
      this.loadingPromises.clear();
    }
  
    /**
     * Obtiene el tamaño del caché
     */
    get size() {
      return this.cache.size;
    }
  }
  
  // Instancia singleton
  export const imageCache = new ImageCache();
  
  /**
   * Hook personalizado para usar el caché de imágenes
   */
  export function useCachedImage(url, fallbackUrl) {
    const [cachedUrl, setCachedUrl] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState(false);
  
    React.useEffect(() => {
      let mounted = true;
  
      async function loadImage() {
        try {
          setIsLoading(true);
          const cached = await imageCache.getImage(url);
          
          if (!mounted) return;
  
          if (cached) {
            setCachedUrl(cached);
            setError(false);
          } else if (fallbackUrl) {
            // Si la imagen principal falla, intentar con el fallback
            const fallback = await imageCache.getImage(fallbackUrl);
            if (mounted && fallback) {
              setCachedUrl(fallback);
              setError(false);
            } else {
              setError(true);
            }
          } else {
            setError(true);
          }
        } catch (err) {
          if (mounted) {
            setError(true);
          }
        } finally {
          if (mounted) {
            setIsLoading(false);
          }
        }
      }
  
      loadImage();
  
      return () => {
        mounted = false;
      };
    }, [url, fallbackUrl]);
  
    return { cachedUrl, isLoading, error };
  }