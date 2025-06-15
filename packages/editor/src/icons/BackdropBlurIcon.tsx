import { FC } from "react";
import { IconProps } from "canva-editor/types";

const BackdropBlurIcon: FC<IconProps> = ({ ...props }) => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.3"
      />
      <rect
        x="6"
        y="6"
        width="12"
        height="12"
        rx="1"
        fill="currentColor"
        opacity="0.1"
      />
      <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.4" />
      <circle
        cx="12"
        cy="12"
        r="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.3"
      />
      <path
        d="M8 8l8 8M16 8l-8 8"
        stroke="currentColor"
        strokeWidth="0.5"
        opacity="0.2"
      />
    </svg>
  );
};

export default BackdropBlurIcon;
