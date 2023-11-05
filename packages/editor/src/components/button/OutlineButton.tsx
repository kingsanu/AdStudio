import React, { ForwardedRef } from 'react';
import BaseButton, { ButtonProps } from './Button';

type OutlineButtonProps = ButtonProps & {
};

const OutlineButton = React.forwardRef(
  ({ icon, text, onClick, ...rest }: OutlineButtonProps, ref: ForwardedRef<HTMLButtonElement>) => {
    return (
      <BaseButton
        ref={ref}
        icon={icon}
        text={text}
        onClick={onClick}
        style={{
            backgroundColor: '#fff',
            color: '#000'
        }}
        {...rest}
      />
    );
  }
);

export default OutlineButton;
