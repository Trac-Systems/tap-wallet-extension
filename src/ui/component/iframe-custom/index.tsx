// import {CSSProperties, memo, useMemo} from 'react';

// export type IframeProps = {
//   preview: string;
//   style?: CSSProperties;
//   ref: any;
//   className?: string;
// };

// const Iframe = ({preview, style, ref, className}: IframeProps) => {
//   return useMemo(
//     () => (
//       <iframe
//         onClick={e => e.preventDefault()}
//         ref={ref}
//         className={className}
//         style={Object.assign({}, {pointerEvents: 'none'}, style)} // prevent events in iframe
//         src={preview}
//         sandbox="allow-scripts allow-same-origin allow-top-navigation"
//         scrolling="no"
//         loading="lazy"
//       />
//     ),
//     [preview],
//   );
// };

// export default memo(Iframe, (p, n) => {
//   return p.preview === n.preview;
// });


import {
  CSSProperties,
  memo,
  useEffect,
  useRef,
  useState,
  forwardRef,
} from 'react';

export type IframeProps = {
  preview: string;
  style?: CSSProperties;
  className?: string;
};

// Cache for checked URLs to avoid redundant fetches
const recursiveCheckCache = new Map<string, boolean>();

// Check if URL contains recursive inscription references
async function hasRecursiveRefs(previewUrl: string): Promise<boolean> {
  // Check cache first
  if (recursiveCheckCache.has(previewUrl)) {
    return recursiveCheckCache.get(previewUrl)!;
  }

  try {
    const response = await fetch(previewUrl);
    const html = await response.text();

    // Check for recursive patterns: /r/sat/, /r/blockheight/
    const hasRecursive = /\/r\/(sat|blockheight)\//.test(html);

    // Cache result
    recursiveCheckCache.set(previewUrl, hasRecursive);

    return hasRecursive;
  } catch (error) {
    console.error('[Iframe] Failed to check recursive refs:', error);
    recursiveCheckCache.set(previewUrl, false);
    return false;
  }
}

// Fallback URL helper
function getFallbackUrl(originalUrl: string): string {
  // Extract inscription ID from ord-tw URL
  const match = originalUrl.match(/\/preview\/([0-9a-f]+i\d+)/);
  if (match) {
    return `https://static.unisat.space/preview/${match[1]}`;
  }
  return originalUrl;
}

const LazyIframe = forwardRef<HTMLIFrameElement, IframeProps>(
  ({ preview, style, className }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [finalUrl, setFinalUrl] = useState(preview);
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect(); // Load only once
          }
        },
        {
          rootMargin: '200px', // Trigger a bit before visible
        }
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => {
        observer.disconnect();
      };
    }, []);

    // Smart fallback: check for recursive inscriptions when visible
    useEffect(() => {
      if (!isVisible) return;

      const checkAndFallback = async () => {
        // Only check ord-tw URLs
        if (!preview.includes('ord-tw.tap-hosting.xyz')) {
          setFinalUrl(preview);
          return;
        }

        setIsChecking(true);

        try {
          const isRecursive = await hasRecursiveRefs(preview);

          if (isRecursive) {
            const fallbackUrl = getFallbackUrl(preview);
            console.log(`[Iframe] Recursive inscription detected, using fallback: ${fallbackUrl}`);
            setFinalUrl(fallbackUrl);
          } else {
            setFinalUrl(preview);
          }
        } catch (error) {
          console.error('[Iframe] Fallback check failed, using original URL:', error);
          setFinalUrl(preview);
        } finally {
          setIsChecking(false);
        }
      };

      checkAndFallback();
    }, [isVisible, preview]);

    return (
      <div ref={containerRef}>
        {isVisible && !isChecking && (
          <iframe
            ref={ref}
            onClick={(e) => e.preventDefault()}
            className={className}
            style={{
              pointerEvents: 'none',
              ...style,
            }}
            src={finalUrl}
            sandbox="allow-scripts allow-same-origin allow-top-navigation"
            scrolling="no"
            loading="lazy"
          />
        )}
      </div>
    );
  }
);

// Prevent re-render if `preview` doesn't change
export default memo(LazyIframe, (prev, next) => prev.preview === next.preview);
