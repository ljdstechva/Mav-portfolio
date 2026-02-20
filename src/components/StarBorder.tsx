import React from 'react';

type StarBorderProps<T extends React.ElementType> = React.ComponentPropsWithoutRef<T> & {
  as?: T;
  className?: string;
  children?: React.ReactNode;
  color?: string;
  speed?: React.CSSProperties['animationDuration'];
  thickness?: number;
  innerClassName?: string; // Added to customize inner container
};

const StarBorder = <T extends React.ElementType = 'button'>({
  as,
  className = '',
  color = 'white',
  speed = '6s',
  thickness = 3,
  children,
  innerClassName = '', // Default empty, user needs to provide bg
  ...rest
}: StarBorderProps<T>) => {
  const Component = as || 'button';
  const { style: restStyle, ...componentProps } = rest as React.ComponentPropsWithoutRef<T> & {
    style?: React.CSSProperties;
  };

  return (
    <Component
      className={`relative inline-block overflow-hidden rounded-[20px] ${className}`}
      {...componentProps}
      style={{
        padding: `${thickness}px`,
        ...(restStyle ?? {})
      }}
    >
      <div
        className="absolute inset-0 z-0 overflow-hidden rounded-[20px]"
        style={{
          padding: `${thickness}px`,
          maskImage: 'linear-gradient(black, black), linear-gradient(black, black)',
          maskClip: 'content-box, border-box',
          maskComposite: 'exclude',
          WebkitMaskImage: 'linear-gradient(black, black), linear-gradient(black, black)',
          WebkitMaskClip: 'content-box, border-box',
          WebkitMaskComposite: 'xor',
        }}
      >
        <div
          className="absolute w-[300%] h-[50%] bottom-[-11px] right-[-250%] rounded-full animate-star-movement-bottom z-0"
          style={{
            background: `radial-gradient(circle, ${color}, transparent 10%)`,
            animationDuration: speed
          }}
        ></div>
        <div
          className="absolute w-[300%] h-[50%] top-[-10px] left-[-250%] rounded-full animate-star-movement-top z-0"
          style={{
            background: `radial-gradient(circle, ${color}, transparent 10%)`,
            animationDuration: speed
          }}
        ></div>
      </div>
      <div className={`relative z-1 text-white text-center text-[16px] py-[16px] px-[26px] rounded-[20px] h-full w-full ${innerClassName}`}>
        {children}
      </div>
    </Component>
  );
};

export default StarBorder;
