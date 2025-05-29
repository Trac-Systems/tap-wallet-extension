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

const LazyIframe = forwardRef<HTMLIFrameElement, IframeProps>(
  ({ preview, style, className }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

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

    return (
      <div ref={containerRef} style={{ minHeight: style?.height || '300px' }}>
        {isVisible && (
          <iframe
            ref={ref}
            onClick={(e) => e.preventDefault()}
            className={className}
            style={{
              pointerEvents: 'none',
              ...style,
            }}
            src={preview}
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
