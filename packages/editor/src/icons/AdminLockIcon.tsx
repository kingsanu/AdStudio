import React from "react";

const AdminLockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Lock body */}
      <rect
        x="6"
        y="10"
        width="12"
        height="8"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="currentColor"
        fillOpacity="0.1"
      />
      {/* Lock shackle */}
      <path
        d="M8 10V7a4 4 0 1 1 8 0v3"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      {/* Admin crown/star indicator */}
      <path d="M12 13.5l1.5-1.5L12 10.5 10.5 12 12 13.5z" fill="currentColor" />
      {/* Small diamond indicator for admin */}
      <circle
        cx="16"
        cy="8"
        r="2"
        fill="#FF6B35"
        stroke="white"
        strokeWidth="1"
      />
      <path d="M16 7l0.5 1L16 9l-0.5-1z" fill="white" fontSize="8" />
    </svg>
  );
};

export default AdminLockIcon;
