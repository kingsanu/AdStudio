import React from "react";

const AdminUnlockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Lock body (unlocked) */}
      <rect
        x="6"
        y="10"
        width="12"
        height="8"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      {/* Open shackle */}
      <path
        d="M8 10V7a4 4 0 1 1 8 0v1"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Unlock keyhole */}
      <circle cx="12" cy="13" r="1" fill="currentColor" />
      <path
        d="M12 14v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Admin indicator */}
      <circle
        cx="16"
        cy="8"
        r="2"
        fill="#10B981"
        stroke="white"
        strokeWidth="1"
      />
      <path
        d="M15 8l1 1 2-2"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default AdminUnlockIcon;
