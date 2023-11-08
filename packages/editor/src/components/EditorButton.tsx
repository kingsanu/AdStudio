import { ForwardRefRenderFunction, PropsWithChildren, forwardRef } from 'react';

interface Props {
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  className?: string;
  disabled?: boolean;
  isActive?: boolean;
}
const EditorButton: ForwardRefRenderFunction<
  HTMLButtonElement,
  PropsWithChildren<Props>
> = (
  { children, disabled = false, isActive = false, className = '', ...props },
  ref
) => {
  return (
    <button
      ref={ref}
      className={className}
      {...props}
      css={{
        padding: '0 4px',
        display: 'flex',
        height: 32,
        minWidth: 32,
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.3s ease',
        borderRadius: 6,
        fontSize: 14,
        fontWeight: 400,
        ...(disabled
          ? { color: 'rgba(64,87,109,.4)', cursor: 'not-allowed' }
          : {
              color: '#0d1216',
              ':hover': {
                backgroundColor: 'rgba(64,87,109,.2)',
              },
              ...(isActive ? { backgroundColor: 'rgba(64,87,109,.2)' } : {}),
            }),
      }}
    >
      {children}
    </button>
  );
};

export default forwardRef<HTMLButtonElement, PropsWithChildren<Props>>(
  EditorButton
);
