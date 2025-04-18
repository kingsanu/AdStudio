import React from 'react';

const RemoveBackgroundIcon: React.FC = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Eraser body */}
      <path d="M18 13L11 20L4 13L11 6L18 13Z" />
      
      {/* Eraser top */}
      <path d="M20 9L13 2" />
      
      {/* Background element */}
      <path d="M11 15L16 20H22" />
      <path d="M22 20H16L11 15" />
      
      {/* Erased line */}
      <path d="M6 18L2 22" strokeDasharray="2 2" />
    </svg>
  );
};

export default RemoveBackgroundIcon;
