import React from "react";
import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { COLORS, BORDER_RADIUS } from "@/constants/styles";

interface DesignTemplateCardProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  dimensions: { width: number; height: number };
  isKiosk?: boolean;
  isLiveMenu?: boolean;
  onClick: () => void;
}

export const DesignTemplateCard: React.FC<DesignTemplateCardProps> = ({
  title,
  icon,
  color,
  dimensions,
  isKiosk,
  isLiveMenu,
  onClick,
}) => {
  const getTemplateBackground = (color: string) => {
    if (color.includes("blue")) return COLORS.gradients.cool;
    if (color.includes("purple")) return COLORS.gradients.primary;
    if (color.includes("green"))
      return `linear-gradient(105deg, ${COLORS.brand.success}56, ${COLORS.brand.success}99)`;
    if (color.includes("yellow")) return COLORS.gradients.warm;
    if (color.includes("red"))
      return `linear-gradient(135deg, ${COLORS.brand.error}20, ${COLORS.brand.error}05)`;
    return COLORS.gradients.accent;
  };

  const getTemplateTypeLabel = () => {
    if (isKiosk) return "Kiosk";
    if (isLiveMenu) return "Live Menu";
    return "Design";
  };
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="group"
    >
      <Card
        className="cursor-pointer border-0 flex-shrink-0 w-56 overflow-hidden bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 hover:shadow-2xl transition-all duration-500"
        style={{
          borderRadius: BORDER_RADIUS["2xl"],
          boxShadow:
            "0 8px 25px rgba(15, 23, 42, 0.08), 0 3px 10px rgba(15, 23, 42, 0.03)",
          border: "1px solid rgba(148, 163, 184, 0.1)",
        }}
        onClick={onClick}
      >
        <CardContent className="p-0">
          {/* Enhanced header section */}
          <div
            className="h-32 flex items-center justify-center relative overflow-hidden"
            style={{
              background: getTemplateBackground(color),
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-black/10" />
            <div className="absolute top-3 right-3">
              <span className="text-xs px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white font-medium">
                {getTemplateTypeLabel()}
              </span>
            </div>
            <div className="text-white relative z-10 group-hover:scale-110 transition-transform duration-300 drop-shadow-lg">
              {icon}
            </div>
            {/* Decorative elements */}
            <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-white/10 rounded-full blur-xl" />
            <div className="absolute -top-2 -left-2 w-12 h-12 bg-white/10 rounded-full blur-lg" />
          </div>

          {/* Enhanced content section */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                {title}
              </h3>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-200 mt-1" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                <span>
                  {dimensions.width} × {dimensions.height} px
                </span>
              </div>

              {/* Progress bar for visual appeal */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000 group-hover:w-full"
                  style={{ width: "60%" }}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Ready to use
                </span>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Available
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
