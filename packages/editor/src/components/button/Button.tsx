import React, { ButtonHTMLAttributes, ForwardedRef } from 'react';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: JSX.Element;
  text?: string;
  style?: any;
};

const Button = React.forwardRef(
  (
    { icon, text, onClick, type = 'button', style, ...rest }: ButtonProps,
    ref: ForwardedRef<HTMLButtonElement>
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        css={{
          border: '1px solid #000',
          borderRadius: 4,
          cursor: 'pointer',
          color: '#fff',
          backgroundColor: '#8b3dff',
          transition: 'background-color 0.3s ease',
          height: 40,
          padding: '0 6px',
          fontWeight: 400,
          '&:hover': {
            backgroundColor: '#7300e6'
          },
          ...style,
        }}
        {...rest}
      >
        {icon && <span css={{ marginRight: 5 }}>{icon}</span>}
        {text && <span css={{ verticalAlign: 'middle' }}>{text}</span>}
      </button>
    );
  }
);

export default Button;
