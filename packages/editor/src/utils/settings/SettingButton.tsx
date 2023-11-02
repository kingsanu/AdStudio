import Button from '@canva/components/Button';
import {
  forwardRef,
  ForwardRefRenderFunction,
  HTMLProps,
  PropsWithChildren,
} from 'react';
interface SettingButtonProps extends HTMLProps<HTMLElement> {
  isActive?: boolean;
}
const SettingButton: ForwardRefRenderFunction<
  HTMLDivElement,
  PropsWithChildren<SettingButtonProps>
> = ({ children, isActive, disabled, onClick, ...props }, ref) => {
  return (
    <Button
      ref={ref as any}
      onClick={(e) => !disabled && onClick && onClick(e)}
      {...props}
    >
      {children}
    </Button>
  );
};
export default forwardRef<
  HTMLDivElement,
  PropsWithChildren<SettingButtonProps>
>(SettingButton);
