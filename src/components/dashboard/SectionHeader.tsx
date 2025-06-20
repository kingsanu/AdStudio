import React from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COLORS } from "@/constants/styles";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  showViewAll?: boolean;
  onViewAllClick?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  showViewAll = true,
  onViewAllClick,
}) => {
  return (
    <div className="flex items-end justify-between mb-8 group">
      <div className="relative">
        {/* Decorative accent line */}
        <div className="absolute -left-1 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top" />

        <div className="pl-4">
          <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            {title}
          </h3>
          {subtitle && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
              <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                {subtitle}
              </p>
            </div>
          )}
        </div>
      </div>

      {showViewAll && (
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all duration-300 group/button border border-transparent hover:border-blue-200 dark:hover:border-blue-700 cursor-pointer"
          style={{ color: COLORS.brand.primary }}
          onClick={onViewAllClick}
        >
          <span className="font-medium">View all</span>
          <ChevronRight className="ml-1 h-4 w-4 group-hover/button:translate-x-1 transition-transform duration-200" />
        </Button>
      )}
    </div>
  );
};
