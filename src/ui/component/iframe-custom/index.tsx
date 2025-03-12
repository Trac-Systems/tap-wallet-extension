import {CSSProperties, memo, useMemo} from 'react';

export type IframeProps = {
  preview: string;
  style?: CSSProperties;
  ref: any;
  className?: string;
};

const Iframe = ({preview, style, ref, className}: IframeProps) => {
  return useMemo(
    () => (
      <iframe
        onClick={e => e.preventDefault()}
        ref={ref}
        className={className}
        style={Object.assign({}, {pointerEvents: 'none'}, style)} // prevent events in iframe
        src={preview}
        sandbox="allow-scripts allow-same-origin allow-top-navigation"
        scrolling="no"
        loading="lazy"
      />
    ),
    [preview],
  );
};

export default memo(Iframe, (p, n) => {
  return p.preview === n.preview;
});
