/* eslint-disable @typescript-eslint/no-unused-vars */
import { FC, useState } from "react";
import { useEditor, useSelectedLayers } from "canva-editor/hooks";
import {
  X,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface PropertiesPanelProps {
  onClose: () => void;
}

const PropertiesPanel: FC<PropertiesPanelProps> = ({ onClose }) => {
  const { actions } = useEditor();
  const { selectedLayerIds } = useSelectedLayers();
  const [activeTab, setActiveTab] = useState("text");
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [fontWeight, setFontWeight] = useState("normal");
  const [textAlign, setTextAlign] = useState("left");

  // Font options
  const fonts = [
    { name: "Inter", value: "Inter" },
    { name: "Arial", value: "Arial" },
    { name: "Helvetica", value: "Helvetica" },
    { name: "Times New Roman", value: "Times New Roman" },
    { name: "Georgia", value: "Georgia" },
  ];

  const handleFontSizeChange = (value: number[]) => {
    setFontSize(value[0]);
    // Update the text layer font size
    // actions.updateTextLayer({ fontSize: value[0] });
  };

  const handleLineHeightChange = (value: number[]) => {
    setLineHeight(value[0]);
    // Update the text layer line height
    // actions.updateTextLayer({ lineHeight: value[0] });
  };

  const toggleBold = () => {
    setFontWeight(fontWeight === "bold" ? "normal" : "bold");
    // Update the text layer font weight
    // actions.updateTextLayer({ fontWeight: fontWeight === "bold" ? "normal" : "bold" });
  };

  const handleTextAlignChange = (align: string) => {
    setTextAlign(align);
    // Update the text layer text align
    // actions.updateTextLayer({ textAlign: align });
  };

  return (
    <div className="absolute left-0 top-0 w-full bg-white border-b border-neutral-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Text</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="text" className="w-full">
        <TabsList className="w-full grid grid-cols-3 mb-4">
          <TabsTrigger value="text">Text</TabsTrigger>
          <TabsTrigger value="style">Style</TabsTrigger>
          <TabsTrigger value="box">Box</TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Font</label>
            <select
              className="w-full h-9 rounded-md border border-neutral-200 px-3 text-sm"
              defaultValue="Inter"
            >
              {fonts.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Font Size
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="h-9"
                />
                <span className="text-sm">px</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Line Height
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={lineHeight}
                  onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                  step={0.1}
                  className="h-9"
                />
                <span className="text-sm">px</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Line Spacing
            </label>
            <div className="flex items-center gap-2">
              <Input type="number" value={0} className="h-9" />
              <span className="text-sm">px</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Font Style</label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 w-9 p-0",
                  fontWeight === "bold" && "bg-neutral-100"
                )}
                onClick={toggleBold}
              >
                <Bold className="h-4 w-4" />
              </Button>

              <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                <Italic className="h-4 w-4" />
              </Button>

              <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                <Underline className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Text Alignment
            </label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 w-9 p-0",
                  textAlign === "left" && "bg-neutral-100"
                )}
                onClick={() => handleTextAlignChange("left")}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 w-9 p-0",
                  textAlign === "center" && "bg-neutral-100"
                )}
                onClick={() => handleTextAlignChange("center")}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 w-9 p-0",
                  textAlign === "right" && "bg-neutral-100"
                )}
                onClick={() => handleTextAlignChange("right")}
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Font Color</label>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-md border border-neutral-200 flex items-center justify-center overflow-hidden">
                <div className="w-7 h-7 rounded-sm bg-neutral-900"></div>
              </div>
              <Input type="text" value="#121212" className="h-9" />
              <div className="w-9 h-9 flex items-center justify-center">
                <span className="text-sm">100%</span>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="style">
          <div className="text-center py-8 text-neutral-500">
            Style options will appear here
          </div>
        </TabsContent>

        <TabsContent value="box">
          <div className="text-center py-8 text-neutral-500">
            Box options will appear here
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PropertiesPanel;
