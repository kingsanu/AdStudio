import { FC } from "react";
import { IconProps } from "canva-editor/types";

const BlurIcon: FC<IconProps> = ({ ...props }) => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.3" />
      <circle
        cx="12"
        cy="12"
        r="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.5"
      />
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.2"
      />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
};

export default BlurIcon;
