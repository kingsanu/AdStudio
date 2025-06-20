import React from "react";
import { motion } from "motion/react";
import { LucideIcon, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BORDER_RADIUS } from "@/constants/styles";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient: string;
  onClick?: () => void;
  change?: number; // percentage change
  progress?: number; // progress value 0-100
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  gradient,
  onClick,
  change,
  progress,
}) => {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="group"
    >
      <Card
        className={`border-0 overflow-hidden bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 hover:shadow-2xl transition-all duration-500 py-0 ${
          onClick ? "cursor-pointer" : ""
        }`}
        style={{
          borderRadius: BORDER_RADIUS.xl,
          boxShadow:
            "0 8px 25px rgba(15, 23, 42, 0.08), 0 3px 10px rgba(15, 23, 42, 0.03)",
          border: "1px solid rgba(148, 163, 184, 0.1)",
        }}
        onClick={onClick}
      >
        <CardContent className="p-0">
          {/* Gradient header */}
          <div
            className="p-6 pb-4 relative overflow-hidden"
            style={{ background: gradient }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/10" />
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full blur-xl" />

            <div className="relative z-10 flex items-start justify-between">
              <div className="flex-1 h-18">
                <p className="text-white/90 text-sm font-medium mb-1">
                  {title}
                </p>
                <p className="text-white text-3xl font-bold group-hover:scale-105 transition-transform duration-300">
                  {value}
                </p>
              </div>

              <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
