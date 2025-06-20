import React, { forwardRef } from "react";
import { motion } from "motion/react";
import { Image, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BORDER_RADIUS } from "@/constants/styles";

interface TemplateCardProps {
  title: string;
  thumbnailUrl?: string;
  type: "template" | "design";
  onClick: () => void;
}

export const TemplateCard = forwardRef<HTMLDivElement, TemplateCardProps>(
  ({ title, thumbnailUrl, type, onClick }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{ y: -6, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex-shrink-0 w-auto group"
      >
        <Card
          className="cursor-pointer border-0 overflow-hidden h-full bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 hover:shadow-2xl transition-all duration-500"
          style={{
            borderRadius: BORDER_RADIUS.xl,
            boxShadow:
              "0 8px 25px rgba(15, 23, 42, 0.08), 0 3px 10px rgba(15, 23, 42, 0.03)",
            border: "1px solid rgba(148, 163, 184, 0.1)",
          }}
          onClick={onClick}
        >
          <CardContent className="p-0">
            {/* Enhanced image section */}
            <div className="aspect-[4/3] overflow-hidden relative">
              {thumbnailUrl ? (
                <>
                  <img
                    src={thumbnailUrl}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Overlay elements */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                      <ChevronRight className="h-4 w-4 text-white" />
                    </div>
                  </div>

                  <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-xs px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white font-medium">
                      {type === "template" ? "Template" : "Your Design"}
                    </span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
                  <div className="p-4 rounded-full bg-white/50 dark:bg-slate-600/50 backdrop-blur-sm">
                    <Image className="h-8 w-8 text-slate-500 dark:text-slate-400" />
                  </div>

                  {/* Decorative background elements */}
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-purple-500/10 rounded-full blur-xl" />
                </div>
              )}
            </div>

            {/* Enhanced content section */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 truncate pr-2">
                  {title}
                </h4>
                {!thumbnailUrl && (
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-200 mt-0.5 flex-shrink-0" />
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      type === "template" ? "bg-blue-500" : "bg-green-500"
                    }`}
                  ></div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {type === "template" ? "Template" : "Your Design"}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Ready
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
);

TemplateCard.displayName = "TemplateCard";
