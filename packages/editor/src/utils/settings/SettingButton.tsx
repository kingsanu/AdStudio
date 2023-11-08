import EditorButton from '@canva/components/EditorButton';
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
> = ({ children, disabled, onClick, ...props }, ref) => {
  return (
    <EditorButton
      ref={ref as any}
      onClick={(e) => !disabled && onClick && onClick(e)}
      disabled={disabled}
      {...props}
    >
      {children}
    </EditorButton>
  );
};
export default forwardRef<
  HTMLDivElement,
  PropsWithChildren<SettingButtonProps>
>(SettingButton);
