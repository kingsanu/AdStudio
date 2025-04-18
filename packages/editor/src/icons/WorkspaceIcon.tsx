import React from "react";

const WorkspaceIcon = () => {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="#0070f3"
      xmlns="http://www.w3.org/2000/svg"
      stroke="#0070f3"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="4" ry="4"></rect>
      <line x1="9" y1="3" x2="9" y2="21" stroke="white"></line>
      <line x1="15" y1="3" x2="15" y2="21" stroke="white"></line>
      <line x1="3" y1="9" x2="21" y2="9" stroke="white"></line>
      <line x1="3" y1="15" x2="21" y2="15" stroke="white"></line>
    </svg>
  );
};

export default WorkspaceIcon;
