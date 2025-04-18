import React, { FC, ReactNode, useState } from "react";

interface TabProps {
  tabs: {
    key: string;
    label: string;
    icon?: ReactNode;
  }[];
  activeTab?: string;
  onTabChange: (tabKey: string) => void;
}

const TabComponent: FC<TabProps> = ({ tabs, activeTab, onTabChange }) => {
  const [active, setActive] = useState(activeTab || tabs[0]?.key);

  const handleTabClick = (tabKey: string) => {
    setActive(tabKey);
    onTabChange(tabKey);
  };

  return (
    <div
      css={{
        display: "flex",
        borderBottom: "1px solid rgba(0,0,0,0.1)",
        marginBottom: 16,
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          css={{
            padding: "8px 16px",
            background: "transparent",
            border: "none",
            borderBottom:
              tab.key === active
                ? "2px solid #0066ff"
                : "2px solid transparent",
            color: tab.key === active ? "#0066ff" : "rgba(0,0,0,0.7)",
            fontWeight: tab.key === active ? 600 : 400,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            transition: "all 0.2s ease",
            ":hover": {
              color: "#0066ff",
            },
          }}
          onClick={() => handleTabClick(tab.key)}
        >
          {tab.icon && <span>{tab.icon}</span>}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default TabComponent;
