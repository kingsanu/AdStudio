import React from "react";
import { motion } from "motion/react";
import { LucideIcon, Calendar, Users, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  COLORS,
  SHADOWS,
  BORDER_RADIUS,
  TRANSITIONS,
} from "@/constants/styles";

interface CampaignCardProps {
  title: string;
  description: string;
  status: "active" | "draft" | "completed";
  icon: LucideIcon;
  stats: {
    sent?: number;
    opened?: number;
    clicked?: number;
    redeemed?: number;
  };
  createdAt: string;
  onClick: () => void;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({
  title,
  description,
  status,
  icon: Icon,
  stats,
  createdAt,
  onClick,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case "active":
        return COLORS.brand.success;
      case "draft":
        return COLORS.brand.warning;
      case "completed":
        return COLORS.text.muted;
      default:
        return COLORS.text.muted;
    }
  };

  const getStatusBackground = () => {
    switch (status) {
      case "active":
        return `${COLORS.brand.success}20`;
      case "draft":
        return `${COLORS.brand.warning}20`;
      case "completed":
        return `${COLORS.neutral[200]}`;
      default:
        return `${COLORS.neutral[200]}`;
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex-shrink-0 w-80"
    >
      <Card
        className="cursor-pointer group border-0 overflow-hidden h-full"
        style={{
          background: COLORS.background.primary,
          borderRadius: BORDER_RADIUS.xl,
          boxShadow: SHADOWS.card,
          transition: TRANSITIONS.default,
        }}
        onClick={onClick}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: getStatusBackground() }}
              >
                <Icon className="h-5 w-5" style={{ color: getStatusColor() }} />
              </div>
              <div>
                <h4
                  className="font-semibold text-base mb-1"
                  style={{ color: COLORS.text.primary }}
                >
                  {title}
                </h4>
                <p className="text-sm" style={{ color: COLORS.text.muted }}>
                  {description}
                </p>
              </div>
            </div>
            <span
              className="text-xs px-2 py-1 rounded-full capitalize"
              style={{
                backgroundColor: getStatusBackground(),
                color: getStatusColor(),
              }}
            >
              {status}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {stats.sent && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Users
                    className="h-3 w-3"
                    style={{ color: COLORS.text.muted }}
                  />
                  <span
                    className="text-xs"
                    style={{ color: COLORS.text.muted }}
                  >
                    Sent
                  </span>
                </div>
                <p
                  className="font-semibold text-sm"
                  style={{ color: COLORS.text.primary }}
                >
                  {stats.sent}
                </p>
              </div>
            )}
            {stats.opened && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp
                    className="h-3 w-3"
                    style={{ color: COLORS.text.muted }}
                  />
                  <span
                    className="text-xs"
                    style={{ color: COLORS.text.muted }}
                  >
                    Opened
                  </span>
                </div>
                <p
                  className="font-semibold text-sm"
                  style={{ color: COLORS.text.primary }}
                >
                  {stats.opened}
                </p>
              </div>
            )}
            {(stats.clicked || stats.redeemed) && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp
                    className="h-3 w-3"
                    style={{ color: COLORS.text.muted }}
                  />
                  <span
                    className="text-xs"
                    style={{ color: COLORS.text.muted }}
                  >
                    {stats.clicked ? "Clicked" : "Redeemed"}
                  </span>
                </div>{" "}
                <p
                  className="font-semibold text-sm"
                  style={{ color: COLORS.text.primary }}
                >
                  {stats.clicked ?? stats.redeemed}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-1 text-xs"
              style={{ color: COLORS.text.muted }}
            >
              <Calendar className="h-3 w-3" />
              <span>{createdAt}</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs p-2 h-7"
              style={{ color: COLORS.brand.primary }}
            >
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
