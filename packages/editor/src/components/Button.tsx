import { ForwardRefRenderFunction, PropsWithChildren, forwardRef } from 'react';

interface Props {
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  className?: string;
}
const Button: ForwardRefRenderFunction<
  HTMLButtonElement,
  PropsWithChildren<Props>
> = ({ children, className = '', ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={className}
      {...props}
      css={{
        padding: '0 8px',
        display: 'flex',
        height: 32,
        minWidth: 32,
        alignItems: 'center',
        transition: 'background-color 0.3s ease',
        color: '#000',
        borderRadius: 6,
        ':hover': {
          backgroundColor: 'rgba(64,87,109,.2)',
        },
      }}
    >
      {children}
    </button>
  );
};

export default forwardRef<HTMLButtonElement, PropsWithChildren<Props>>(Button);
