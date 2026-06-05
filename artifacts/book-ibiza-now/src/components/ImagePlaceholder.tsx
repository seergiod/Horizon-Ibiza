import { useState } from "react";

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  width?: number;
  height?: number;
  loading?: "lazy" | "eager";
  decoding?: "async" | "sync" | "auto";
  fetchPriority?: "high" | "low" | "auto";
  label?: string;
  minHeight?: string;
}

export function ImageWithFallback({
  src,
  alt,
  className = "",
  style,
  width,
  height,
  loading,
  decoding,
  fetchPriority,
  label,
  minHeight = "100%",
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <ImagePlaceholder
        className={className}
        style={style}
        label={label}
        minHeight={minHeight}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      width={width}
      height={height}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      onError={() => setHasError(true)}
    />
  );
}

interface ImagePlaceholderProps {
  className?: string;
  style?: React.CSSProperties;
  label?: string;
  minHeight?: string;
}

export function ImagePlaceholder({
  className = "",
  style,
  label,
  minHeight = "100%",
}: ImagePlaceholderProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-[inherit] ${className}`}
      style={{
        background: "linear-gradient(135deg, #000000 0%, #0d0d0d 50%, #111111 100%)",
        minHeight,
        ...style,
      }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        {label && (
          <span className="text-[10px] font-medium uppercase tracking-widest text-white/20">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
