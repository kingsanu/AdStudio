/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC, useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useEditor } from "canva-editor/hooks";
import { BoxSize, Delta, LayerId, SerializedLayers } from "canva-editor/types";
import { getPositionWhenLayerCenter } from "canva-editor/utils/layer/getPositionWhenLayerCenter";
import Draggable from "canva-editor/layers/core/Dragable";
import { generateRandomID } from "canva-editor/utils/identityGenerator";
import Button from "canva-editor/components/button/Button";
import CloseSidebarButton from "./CloseButton";
import styled from "@emotion/styled";
import TextSearchBox from "./components/TextSearchBox";
import useMobileDetect from "canva-editor/hooks/useMobileDetect";
import Cookies from "js-cookie";
import { unpack } from "canva-editor/utils/minifier";
import { toast } from "sonner";

const DefaultTextButton = styled(Button)`
  background-color: #313334;
  color: #fff;
`;

const simpleTxtLayer = (
  text: string,
  boxSize: BoxSize,
  position: Delta,
  fontSize = 18
) => ({
  type: {
    resolvedName: "TextLayer",
  },
  props: {
    position,
    boxSize,
    scale: 1,
    rotate: 0,
    text: `<p style="text-align: center;font-family: 'Canva Sans Regular';font-size: ${fontSize}px;color: rgb(0, 0, 0);line-height: 1.4;letter-spacing: normal;"><strong><span style="color: rgb(0, 0, 0);">${text}</span></strong></p>`,
    fonts: [
      {
        family: "Canva Sans",
        name: "Canva Sans Regular",
        url: "http://fonts.gstatic.com/s/alexandria/v3/UMBCrPdDqW66y0Y2usFeQCH18mulUxBvI9r7TqbCHJ8BRq0b.woff2",
        style: "regular",
        styles: [
          {
            family: "Canva Sans",
            name: "Canva Sans Bold 300",
            url: "http://fonts.gstatic.com/s/alexandria/v3/UMBCrPdDqW66y0Y2usFeQCH18mulUxBvI9qlTqbCHJ8BRq0b.woff2",
            style: "300",
          },
          {
            family: "Canva Sans",
            name: "Canva Sans Bold 500",
            url: "http://fonts.gstatic.com/s/alexandria/v3/UMBCrPdDqW66y0Y2usFeQCH18mulUxBvI9rJTqbCHJ8BRq0b.woff2",
            style: "500",
          },
        ],
      },
    ],
    colors: ["rgb(0, 0, 0)"],
    fontSizes: [fontSize],
    effect: null,
  },
  locked: false,
  child: [],
  parent: "ROOT",
});
interface Text {
  img: string;
  data: string;
}

interface TextTemplate {
  _id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  templateUrl: string;
  tags: string[];
  createdAt: string;
  userId: string;
  isPublic: boolean;
}
const TextContent: FC<{ onClose: () => void }> = ({ onClose }) => {
  const { actions, state, config } = useEditor();
  const [texts, setTexts] = useState<Text[]>([]);
  const [customTemplates, setCustomTemplates] = useState<TextTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCustom, setIsLoadingCustom] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const dataRef = useRef(false);
  const [keyword, setKeyword] = useState("");
  const isMobile = useMobileDetect();

  // Helper function to process template data in various formats
  const processTemplateData = (templateData: any) => {
    try {
      console.log("Processing template data:", templateData);

      // Check if we have the minified format
      const isMinifiedFormat = (() => {
        if (!Array.isArray(templateData) && !templateData) return false;

        const obj = Array.isArray(templateData)
          ? templateData[0]
          : templateData;
        if (!obj) return false;

        // Check if the object has any of the known minified keys
        const minifiedKeys = [
          "a",
          "b",
          "c",
          "as",
          "aq",
          "ar",
          "au",
          "av",
          "aw",
          "ax",
          "be",
          "bq",
          "br",
          "bs",
          "bt",
          "bu",
          "bv",
          "bw",
          "bx",
          "by",
          "bz",
          "ca",
        ];

        // Also check for the layers property which indicates a different format
        if (Object.prototype.hasOwnProperty.call(obj, "layers")) {
          // Check if there are minified properties inside the layers
          const layers = obj.layers;
          for (const layerId in layers) {
            const layer = layers[layerId];
            if (layer && layer.props) {
              // Check for minified properties in position, boxSize, etc.
              if (
                layer.props.position &&
                (layer.props.position.by !== undefined ||
                  layer.props.position.bz !== undefined)
              ) {
                return true;
              }
              if (
                layer.props.boxSize &&
                (layer.props.boxSize.bv !== undefined ||
                  layer.props.boxSize.bw !== undefined)
              ) {
                return true;
              }
            }
          }
        }

        // Check if any of the minified keys exist in the object
        return minifiedKeys.some((key) =>
          Object.prototype.hasOwnProperty.call(obj, key)
        );
      })();

      // Convert from minified format if needed
      let convertedData;
      if (isMinifiedFormat) {
        console.log("Detected minified format, using unpack function...");

        // Handle array format
        if (Array.isArray(templateData)) {
          convertedData = unpack(templateData[0]);
        } else {
          convertedData = unpack(templateData);
        }

        console.log("Unpacked data:", convertedData);
      } else {
        convertedData = templateData;
      }

      // Update the parent of the text layer to point to ROOT
      // layers[layerId].parent = "ROOT";
      // convertedData.layers["ROOT"].child.forEach((layerId) => {
      //   convertedData.layers[layerId].parent = "ROOT";
      // });

      // convertedData.layers.ROOT = null;

      // Example implementation
      const processLayers = (layers) => {
        console.log(layers);
        // Find the template's root layer
        const templateRootId = "ROOT";

        if (templateRootId) {
          // Get all direct children of the template root
          const rootChildren = Object.keys(layers).filter(
            (id) => layers[id].parent === templateRootId
          );

          // Reassign all children to the canvas ROOT
          rootChildren.forEach((childId) => {
            layers[childId].parent = "ROOT";
          });

          // Remove the template root layer
          delete layers[templateRootId];
        }

        return layers;
      };

      Object.entries(convertedData.layers).forEach(([layerId, layerData]) => {
        // Skip if this is the ROOT layer or has properties indicating it's a root container
        if (
          layerId === "ROOT" ||
          layerData.type?.resolvedName === "RootLayer" ||
          (!layerData.parent && layerId.toLowerCase().includes("root"))
        ) {
          console.log(`Skipping root layer: ${layerId}`);
          return; // Skip this iteration
        }

        // For non-root layers, if they were children of the template's root,
        // make them children of the canvas ROOT
        if (
          !layerData.parent ||
          layerData.parent === "ROOT" ||
          convertedData.layers[layerData.parent]?.type?.resolvedName ===
            "RootLayer"
        ) {
          // This was a direct child of the template's root, so attach it to canvas ROOT
          const modifiedLayerData = {
            ...layerData,
            parent: "ROOT", // Set parent to canvas ROOT
          };

          // Add the layer
          actions.addLayer(modifiedLayerData);
          console.log(`Added layer ${layerId} as child of ROOT`);
        } else {
          // This is a nested layer, preserve its original parent
          actions.addLayer(layerData);
          console.log(
            `Added layer ${layerId} with original parent ${layerData.parent}`
          );
        }
      });
      // Then use it before addLayerTree
      // const processedLayers = processLayers(convertedData.layers);
      // convertedData.layers.ROOT = undefined;
      // const newLayers = convertedData.layers;
      // return actions.addLayerTree({
      //   rootId: "ROOT",
      //   layers: newLayers,
      // });

      return;
    } catch (error) {
      console.error("Error processing template data:", error);
      toast.error("Failed to load template: " + (error as Error).message);

      // Even if there's an error, try to create a default text layer
      try {
        console.warn("Creating default text layer after error");
        const position = getPositionWhenLayerCenter(state.pageSize, {
          width: 300,
          height: 100,
        });
        const layerId = generateRandomID();
        const layers: SerializedLayers = {};

        // Create a ROOT layer
        layers.ROOT = {
          type: {
            resolvedName: "RootLayer",
          },
          props: {
            boxSize: { width: 1640, height: 924 },
            position: { x: 0, y: 0 },
            rotate: 0,
            color: "rgb(255, 255, 255)",
            image: null,
            gradientBackground: null,
          },
          locked: false,
          child: [layerId],
          parent: null,
        };

        // Create a text layer as a child of ROOT
        layers[layerId] = simpleTxtLayer(
          "Text layer",
          { width: 300, height: 100 },
          position,
          18
        );

        // Update the parent of the text layer to point to ROOT
        layers[layerId].parent = "ROOT";

        return actions.addLayerTree({
          rootId: "ROOT",
          layers,
        });
      } catch (fallbackError) {
        console.error("Failed to create fallback text layer:", fallbackError);
      }
    }
  };

  const loadData = useCallback(
    async (offset = 0, kw = "") => {
      dataRef.current = true;
      setIsLoading(true);
      const res: any = await axios.get<Text[]>(
        `${config.apis.url}${config.apis.searchTexts}?ps=6&pi=${offset}&kw=${kw}`
      );
      setTexts((texts) => [...texts, ...res.data]);
      setIsLoading(false);
      if (res.data.length > 0) {
        dataRef.current = false;
      }
    },
    [config.apis.url, config.apis.searchTexts, setIsLoading]
  );

  // Load custom text templates from MongoDB
  const loadCustomTemplates = useCallback(
    async (kw = "") => {
      try {
        setIsLoadingCustom(true);
        // Get user ID from cookies or localStorage
        const userId =
          Cookies.get("auth_token") || localStorage.getItem("auth_token") || "";

        // Build query parameters
        const params = new URLSearchParams();
        if (userId) params.append("userId", userId);
        if (kw) params.append("kw", kw);

        // Always include public templates
        params.append("includePublic", "true");

        // Fetch custom text templates
        const response = await axios.get(
          `${config.apis.url}/text-templates?${params.toString()}`
        );

        console.log("Loaded text templates:", response.data);
        setCustomTemplates(response.data);
      } catch (error) {
        console.error("Error loading custom text templates:", error);
        setCustomTemplates([]);
      } finally {
        setIsLoadingCustom(false);
      }
    },
    [config.apis.url]
  );

  useEffect(() => {
    loadData(offset, keyword);
    loadCustomTemplates(keyword);
  }, [offset, keyword, loadCustomTemplates, loadData]);

  useEffect(() => {
    const handleLoadMore = async (e: Event) => {
      const node = e.target as HTMLDivElement;
      if (
        node.scrollHeight - node.scrollTop - 80 <= node.clientHeight &&
        !dataRef.current
      ) {
        setOffset((prevOffset) => prevOffset + 1);
      }
    };

    const currentScrollRef = scrollRef.current;
    currentScrollRef?.addEventListener("scroll", handleLoadMore);
    return () => {
      currentScrollRef?.removeEventListener("scroll", handleLoadMore);
    };
  }, [loadData]);

  const handleSearch = async (kw: string) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    setOffset(0);
    setKeyword(kw);
    setTexts([]);
    // Also search custom templates
    loadCustomTemplates(kw);
  };

  const handleAddText = (data: {
    rootId: LayerId;
    layers: SerializedLayers;
  }) => {
    console.log("Adding layer tree:", data);

    try {
      // Make sure all layers are included
      const { rootId, layers } = data;

      if (!rootId || !layers) {
        console.error("Invalid layer data: missing rootId or layers", data);
        return;
      }

      const allLayers = { ...layers };

      // Validate the rootId exists in the layers
      if (!allLayers[rootId]) {
        console.warn(
          `RootId ${rootId} not found in layers, trying to find a valid layer to use as root`
        );

        // First try to find any non-ROOT layer to use as rootId
        const anyLayerId = Object.keys(allLayers).find((id) => {
          return id !== "ROOT" && id !== "at";
        });

        if (anyLayerId) {
          console.log(`Using ${anyLayerId} as rootId instead`);
          // Add the layer tree to the editor with the new rootId
          actions.addLayerTree({
            rootId: anyLayerId,
            layers: allLayers,
          });

          if (isMobile) {
            onClose();
          }
          return;
        }

        // If no suitable layer found, try to use a child of ROOT
        if (
          allLayers.ROOT &&
          allLayers.ROOT.child &&
          allLayers.ROOT.child.length > 0
        ) {
          const firstChildId = allLayers.ROOT.child[0];
          if (allLayers[firstChildId]) {
            console.log(`Using first child of ROOT as rootId: ${firstChildId}`);
            actions.addLayerTree({
              rootId: firstChildId,
              layers: allLayers,
            });

            if (isMobile) {
              onClose();
            }
            return;
          }
        }

        // If still no suitable layer found, error out
        console.error("No valid layer found to use as root in template");
        return;
      }

      // Check for any special layers that need processing
      for (const id in layers) {
        const layer = layers[id];
        // Log text layers with effects for debugging
        if (layer.type?.resolvedName === "TextLayer" && layer.props?.effect) {
          console.log(`Text layer ${id} has effect:`, layer.props.effect);
        }
        // Process shape layers
        if (layer.type?.resolvedName === "ShapeLayer") {
          console.log(`Shape layer ${id} found`);

          // Make sure shape layers have the shapeSize property
          if (!layer.props.shapeSize && layer.props.viewBox) {
            console.log(`Adding shapeSize to shape layer ${id}`);

            // Get width and height from viewBox
            let width = 100;
            let height = 100;

            if (typeof layer.props.viewBox === "object") {
              const viewBox = layer.props.viewBox as any;
              width = viewBox.width || 100;
              height = viewBox.height || 100;
            }

            layer.props.shapeSize = {
              width,
              height,
            };
          }
        }
        // Log frame layers for debugging
        if (layer.type?.resolvedName === "FrameLayer") {
          console.log(`Frame layer ${id} found`);
        }
      }

      // Add the layer tree to the editor
      actions.addLayerTree({
        rootId,
        layers: allLayers,
      });

      if (isMobile) {
        onClose();
      }
    } catch (error) {
      console.error("Error adding layer tree:", error);
    }
  };

  const handleAddNewText = (
    text = "Your text here!",
    boxSize = {
      width: 309.91666666666606,
      height: 28,
    },
    fontSize = 18
  ) => {
    const position = getPositionWhenLayerCenter(state.pageSize, {
      width: boxSize.width,
      height: boxSize.height,
    });
    const layers: SerializedLayers = {};
    const layerId = generateRandomID();
    layers[layerId] = simpleTxtLayer(text, boxSize, position, fontSize);
    actions.addLayerTree({
      rootId: layerId,
      layers,
    });
    if (isMobile) {
      onClose();
    }
  };
  return (
    <div
      css={{
        width: "100%",
        height: "100%",
        flexDirection: "column",
        display: "flex",
        padding: 16,
      }}
    >
      {!isMobile && <CloseSidebarButton onClose={onClose} />}
      <div
        css={{
          marginBottom: 16,
        }}
      >
        <TextSearchBox onStartSearch={handleSearch} />
      </div>
      <div
        css={{
          marginBottom: 16,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <Button
          onClick={() => handleAddNewText()}
          text="Add a text box"
          style={{ width: "100%" }}
        />
        <div css={{ marginTop: 8, marginBottom: 8, position: "relative" }}>
          <div
            css={{
              height: 1,
              backgroundColor: "#e5e7eb",
              width: "100%",
              position: "absolute",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          />
          <div
            css={{
              position: "relative",
              textAlign: "center",
              backgroundColor: "white",
              display: "inline-block",
              padding: "0 10px",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: 12,
              color: "#6b7280",
            }}
          >
            OR
          </div>
        </div>
        <Button
          onClick={() => {
            // Navigate to the text template editor
            window.location.href = "/new-text";
          }}
          text="Create Text Template"
          style={{
            width: "100%",
            backgroundColor: "#0070f3",
            color: "white",
            fontWeight: "bold",
            padding: "10px 0",
            "&:hover": {
              backgroundColor: "#0060d3",
            },
          }}
        />
      </div>
      <div
        ref={scrollRef}
        css={{
          flexDirection: "column",
          overflowY: "auto",
          display: "flex",
        }}
      >
        <p
          css={{
            fontWeight: 600,
            margin: "0 16px 16px 0",
          }}
        >
          Default text styles
        </p>
        <div
          css={{
            display: "flex",
            flexDirection: "column",
            rowGap: 8,
          }}
        >
          <DefaultTextButton
            onClick={() =>
              handleAddNewText(
                "Add a heading",
                {
                  width: 400,
                  height: 70,
                },
                45
              )
            }
            text="Add a heading"
            css={{
              fontSize: 28,
              height: "auto",
              fontWeight: 600,
              padding: "10px 6px",
            }}
          />
          <DefaultTextButton
            onClick={() =>
              handleAddNewText(
                "Add a subheading",
                {
                  width: 300,
                  height: 45,
                },
                32
              )
            }
            text="Add a subheading"
            css={{
              fontSize: 18,
              height: 52,
              fontWeight: 600,
            }}
          />
          <DefaultTextButton
            onClick={() =>
              handleAddNewText(
                "Add a little bit of body text",
                {
                  width: 300,
                  height: 22,
                },
                16
              )
            }
            text="Add a little bit of body text"
            css={{
              fontSize: 14,
              height: 48,
            }}
          />
        </div>
        {/* Custom Text Templates Section */}
        {customTemplates.length > 0 && (
          <>
            <p
              css={{
                fontWeight: 600,
                margin: "16px 0",
              }}
            >
              My Text Templates
            </p>
            <div
              css={{
                flexGrow: 1,
                display: "grid",
                gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                gridGap: 8,
                padding: "16px",
              }}
            >
              {customTemplates.map((template) => (
                <Draggable
                  key={template._id}
                  onDrop={async (pos) => {
                    if (pos) {
                      try {
                        // Extract the filename from the templateUrl
                        const file = template.templateUrl.split("/");
                        const filename = file[file.length - 1];

                        // Fetch the template data
                        const response = await axios.get(
                          `${config.apis.url}/get-text-template/${filename}`
                        );

                        // Format the data correctly for the editor
                        // The editor expects a SerializedLayerTree with rootId and layers
                        const templateData = response.data;
                        console.log("Response data:", response.data);
                        console.log("Template data:", templateData);
                        // Check if we have the minified format by checking for the existence of minified keys
                        const isMinifiedFormat = (() => {
                          if (!Array.isArray(templateData) || !templateData[0])
                            return false;

                          // Check if the object has any of the known minified keys
                          const obj = templateData[0];
                          const minifiedKeys = [
                            "a",
                            "b",
                            "c",
                            "as",
                            "aq",
                            "ar",
                            "au",
                            "av",
                            "aw",
                            "ax",
                            "be",
                          ];

                          // Check if any of the minified keys exist in the object
                          return minifiedKeys.some((key) =>
                            Object.prototype.hasOwnProperty.call(obj, key)
                          );
                        })();
                        console.log(
                          "Is array format:",
                          Array.isArray(templateData)
                        );
                        console.log("Is minified format:", isMinifiedFormat);

                        // Log the detected format for debugging
                        if (Array.isArray(templateData) && templateData[0]) {
                          const obj = templateData[0];
                          console.log(
                            "Has 'a' property:",
                            Object.prototype.hasOwnProperty.call(obj, "a")
                          );
                          console.log(
                            "Has 'layers' property:",
                            Object.prototype.hasOwnProperty.call(obj, "layers")
                          );
                          console.log(
                            "Detected keys:",
                            Object.keys(obj).filter((key) => key.length <= 3)
                          );
                        }
                        // Convert from minified format if needed
                        let convertedData;
                        if (isMinifiedFormat) {
                          console.log(
                            "Detected minified format, using unpack function..."
                          );
                          convertedData = unpack(templateData);
                          console.log(convertedData);
                        } else {
                          convertedData = templateData;
                        }

                        // Handle different layer formats
                        let layers: any = {};
                        if (convertedData.layers) {
                          layers = convertedData.layers;
                        } else if (convertedData.as) {
                          // Handle the new format with 'as' property
                          layers = convertedData.as;
                          console.log("Using 'as' property as layers");
                        }
                        console.log("Converted layers:", layers);

                        // Find all non-ROOT layers to use as potential root layers
                        const layerIds = [];
                        for (const id in layers) {
                          if (id !== "ROOT" && id !== "at") {
                            const layer = layers[id];
                            // Check if it's any valid layer type
                            const isValidLayer =
                              layer.type?.resolvedName === "TextLayer" || // Text layer
                              layer.type?.resolvedName === "ShapeLayer" || // Shape layer
                              layer.type?.resolvedName === "FrameLayer" || // Frame layer
                              layer.type?.resolvedName === "GroupLayer" || // Group layer
                              layer.type?.resolvedName === "ImageLayer" || // Image layer
                              (layer.props?.text &&
                                typeof layer.props.text === "string") || // Has text property
                              (layer.props?.effect &&
                                layer.type?.resolvedName === "EffectLayer"); // Effect layer

                            if (isValidLayer) {
                              layerIds.push(id);
                            }
                          }
                        }

                        // If no layers found, check ROOT's children
                        if (layerIds.length === 0) {
                          // Check for ROOT in standard format
                          if (layers.ROOT?.child?.length > 0) {
                            // Standard format with ROOT
                            console.log(
                              "Found ROOT with children in standard format"
                            );
                          } else if (layers.at?.be?.length > 0) {
                            // New format with 'at' as root and 'be' as children
                            console.log(
                              "Found 'at' with 'be' children in new format"
                            );

                            // Convert the new format to the format expected by the editor
                            const convertedLayers: any = {};

                            // Convert the root layer
                            if (layers.at) {
                              convertedLayers.ROOT = {
                                type: {
                                  resolvedName: layers.at.au?.av || "RootLayer",
                                },
                                props: {
                                  boxSize: layers.at.aw?.ax || {
                                    width: 1640,
                                    height: 924,
                                  },
                                  position: layers.at.aw?.ba || { x: 0, y: 0 },
                                  rotate: layers.at.aw?.bb || 0,
                                  color:
                                    layers.at.aw?.bc || "rgb(255, 255, 255)",
                                  image: layers.at.aw?.bd || null,
                                },
                                locked: layers.at.ar || false,
                                child: layers.at.be || [],
                                parent: null,
                              };
                            }

                            // Convert all other layers
                            for (const id in layers) {
                              if (id !== "at" && id !== "ROOT") {
                                const layer = layers[id];
                                if (layer) {
                                  // Check if it's any valid layer type
                                  const isValidLayer =
                                    layer.au?.av === "TextLayer" || // Text layer
                                    layer.au?.av === "ShapeLayer" || // Shape layer
                                    layer.au?.av === "FrameLayer" || // Frame layer
                                    layer.au?.av === "GroupLayer" || // Group layer
                                    layer.au?.av === "ImageLayer" || // Image layer
                                    (layer.aw?.bj &&
                                      typeof layer.aw.bj === "string") || // Has text property
                                    layer.au?.av === "EffectLayer"; // Effect layer

                                  if (isValidLayer) {
                                    // Determine the layer type
                                    const resolvedName =
                                      layer.au?.av || "TextLayer";

                                    // Create the base layer structure
                                    convertedLayers[id] = {
                                      type: {
                                        resolvedName: resolvedName,
                                      },
                                      props: {
                                        position: layer.aw?.ba || {
                                          x: 0,
                                          y: 0,
                                        },
                                        boxSize: layer.aw?.ax || {
                                          width: 300,
                                          height: 100,
                                        },
                                        scale: layer.aw?.bi || 1,
                                        rotate: layer.aw?.bb || 0,
                                      },
                                      locked: layer.ar || false,
                                      child: layer.be || [],
                                      parent: layer.bf || "ROOT",
                                    };

                                    // Add type-specific properties
                                    if (resolvedName === "TextLayer") {
                                      // Text layer properties
                                      convertedLayers[id].props.text =
                                        layer.aw?.bj || "<p>Text</p>";
                                      convertedLayers[id].props.fonts = [];
                                      convertedLayers[id].props.colors = layer
                                        .aw?.bn || ["rgb(0, 0, 0)"];
                                      convertedLayers[id].props.fontSizes =
                                        layer.aw?.bo || [18];
                                      convertedLayers[id].props.effect = null;
                                    } else if (resolvedName === "ShapeLayer") {
                                      // Shape layer properties
                                      convertedLayers[id].props.clipPath =
                                        layer.aw?.ah || null;
                                      convertedLayers[id].props.color =
                                        layer.aw?.o || "rgb(0, 0, 0)";
                                      convertedLayers[
                                        id
                                      ].props.gradientBackground =
                                        layer.aw?.q || null;
                                      convertedLayers[id].props.shapeSize =
                                        layer.aw?.ai || {
                                          width: 256,
                                          height: 256,
                                        };
                                    } else if (resolvedName === "FrameLayer") {
                                      // Frame layer properties
                                      convertedLayers[id].props.clipPath =
                                        layer.aw?.ah || null;
                                      convertedLayers[id].props.image =
                                        layer.aw?.p || null;
                                    }

                                    // Handle effect separately with proper mapping
                                    if (layer.aw?.bp) {
                                      const effectData = layer.aw.bp;
                                      convertedLayers[id].props.effect = {
                                        name: effectData.name,
                                        settings: {},
                                      };

                                      // Map effect settings
                                      if (effectData.bq) {
                                        const settings = effectData.bq;
                                        const mappedSettings: any = {};

                                        // Map known properties
                                        if (settings.br !== undefined)
                                          mappedSettings.position = settings.br;
                                        if (settings.bs !== undefined)
                                          mappedSettings.transparency =
                                            settings.bs;
                                        if (settings.bt !== undefined)
                                          mappedSettings.thickness =
                                            settings.bt;
                                        if (settings.color !== undefined)
                                          mappedSettings.color = settings.color;

                                        convertedLayers[
                                          id
                                        ].props.effect.settings =
                                          mappedSettings;
                                      }
                                    }

                                    // Handle fonts with proper mapping
                                    if (
                                      layer.aw?.bk &&
                                      layer.aw.bk.length > 0
                                    ) {
                                      const mappedFonts = layer.aw.bk.map(
                                        (font: any) => ({
                                          family: font.x || "",
                                          name: font.name || "",
                                          url: font.y || "",
                                          style: font.bl || "regular",
                                          styles: font.bm || [],
                                        })
                                      );
                                      convertedLayers[id].props.fonts =
                                        mappedFonts;
                                    }
                                    layerIds.push(id);
                                  }
                                }
                              }
                            }

                            // Use the converted layers instead of the original ones
                            layers = convertedLayers;
                          }
                        }

                        // If still no layers found, use the template data as is
                        if (layerIds.length === 0) {
                          console.warn(
                            "No valid layers found in template, using original template data"
                          );

                          // Instead of creating a new layer, check if we can use existing data
                          if (convertedData.rootId && convertedData.layers) {
                            console.log("Using original template structure");
                            // Use the original template structure
                            return handleAddText({
                              rootId: convertedData.rootId,
                              layers: convertedData.layers,
                            });
                          } else if (convertedData.effect) {
                            console.log("Using effect property structure");

                            // Check if we have any layers in the effect property
                            const effectLayers = Object.keys(
                              convertedData.effect
                            ).filter(
                              (id) =>
                                id !== "bq" &&
                                id !== "name" &&
                                id !== "colors" &&
                                id !== "fontSizes"
                            );

                            if (effectLayers.length > 0) {
                              console.log(
                                `Found ${effectLayers.length} layers in effect property`
                              );

                              // Add all effect layers to layerIds
                              effectLayers.forEach((id) => {
                                if (layers[id]) {
                                  console.log(
                                    `Adding effect layer ${id} to layerIds`
                                  );
                                  layerIds.push(id);
                                }
                              });
                            }
                          } else if (
                            layers.ROOT &&
                            layers.ROOT.child &&
                            layers.ROOT.child.length > 0
                          ) {
                            // Standard format with ROOT
                            // If ROOT has children, use the first child as rootId
                            const firstChildId = layers.ROOT.child[0];
                            if (layers[firstChildId]) {
                              console.log(
                                `Using first child of ROOT as rootId: ${firstChildId}`
                              );
                              layerIds.push(firstChildId);
                            }
                          } else if (layers.at?.be?.length > 0) {
                            // New format with 'at' as root and 'be' as children
                            console.log(
                              "Found 'at' with 'be' children in new format"
                            );
                            const firstChildId = layers.at.be[0];
                            if (layers[firstChildId]) {
                              console.log(
                                `Using first child of 'at' as rootId: ${firstChildId}`
                              );
                              layerIds.push(firstChildId);
                            }
                          } else {
                            // Only as a last resort, create a default text layer
                            console.warn(
                              "Creating default text layer as last resort"
                            );
                            const defaultTextLayerId = generateRandomID();

                            // Add a default text layer
                            const position = {
                              x: 100,
                              y: 100,
                            };
                            const boxSize = {
                              width: 300,
                              height: 100,
                            };
                            const fontSize = 18;

                            // Try to extract text content from the template data if available
                            let text;

                            // Look for existing text layers in the template
                            const existingTextLayer = Object.values(
                              layers
                            ).find(
                              (layer: any) =>
                                layer.type?.resolvedName === "TextLayer" &&
                                layer.props?.text &&
                                typeof layer.props.text === "string"
                            ) as any;

                            if (
                              existingTextLayer &&
                              existingTextLayer.props?.text
                            ) {
                              // Extract the actual text content from the HTML
                              const textMatch =
                                existingTextLayer.props.text.match(/>([^<]+)</);
                              if (textMatch && textMatch[1]) {
                                text = textMatch[1];
                              } else {
                                text = "Text from template";
                              }
                            } else if (
                              template.description &&
                              template.description.length > 0
                            ) {
                              text = template.description;
                            } else if (
                              template.title &&
                              template.title.length > 0
                            ) {
                              text = template.title;
                            } else {
                              text = "Double-click to edit this text";
                            }

                            // Create a properly formatted text layer with HTML content
                            layers[defaultTextLayerId] = {
                              type: {
                                resolvedName: "TextLayer",
                              },
                              props: {
                                position,
                                boxSize,
                                scale: 1,
                                rotate: 0,
                                text: `<p style="text-align: center;font-family: 'Canva Sans Regular';font-size: ${fontSize}px;color: rgb(0, 0, 0);line-height: 1.4;letter-spacing: normal;"><strong><span style="color: rgb(0, 0, 0);">${text}</span></strong></p>`,
                                fonts: [
                                  {
                                    family: "Canva Sans",
                                    name: "Canva Sans Regular",
                                    url: "http://fonts.gstatic.com/s/alexandria/v3/UMBCrPdDqW66y0Y2usFeQCH18mulUxBvI9r7TqbCHJ8BRq0b.woff2",
                                    style: "regular",
                                    styles: [
                                      {
                                        family: "Canva Sans",
                                        name: "Canva Sans Bold 300",
                                        url: "http://fonts.gstatic.com/s/alexandria/v3/UMBCrPdDqW66y0Y2usFeQCH18mulUxBvI9qlTqbCHJ8BRq0b.woff2",
                                        style: "300",
                                      },
                                      {
                                        family: "Canva Sans",
                                        name: "Canva Sans Bold 500",
                                        url: "http://fonts.gstatic.com/s/alexandria/v3/UMBCrPdDqW66y0Y2usFeQCH18mulUxBvI9rJTqbCHJ8BRq0b.woff2",
                                        style: "500",
                                      },
                                    ],
                                  },
                                ],
                                colors: ["rgb(0, 0, 0)"],
                                fontSizes: [fontSize],
                                effect: null,
                              },
                              locked: false,
                              child: [],
                              parent: "ROOT",
                            };

                            // Add to ROOT's children if ROOT exists
                            if (layers.ROOT) {
                              if (!layers.ROOT.child) {
                                layers.ROOT.child = [];
                              }
                              layers.ROOT.child.push(defaultTextLayerId);
                            }

                            layerIds.push(defaultTextLayerId);
                          }
                        }

                        // Use the first layer as rootId
                        const rootId = layerIds[0];

                        // Create a properly formatted layer tree
                        const formattedData = {
                          rootId,
                          layers,
                        };

                        // Add the template to the editor
                        handleAddText(formattedData);
                      } catch (error) {
                        console.error("Error loading template:", error);
                      }
                    }
                  }}
                  onClick={async () => {
                    try {
                      // Extract the filename from the templateUrl
                      const file = template.templateUrl.split("/");
                      const filename = file[file.length - 1];
                      console.log("Loading template:", filename);

                      // Show loading toast
                      toast.loading("Loading template...");

                      // Fetch the template data
                      const response = await axios.get(
                        `${config.apis.url}/get-text-template/${filename}`
                      );
                      const unpacked = unpack(response.data);
                      console.log(unpacked);
                      // Process the template data using our helper function
                      processTemplateData(response.data);

                      // Close the toast
                      toast.dismiss();
                      toast.success("Template loaded successfully");

                      // Close the sidebar on mobile
                      if (isMobile) {
                        onClose();
                      }
                    } catch (error) {
                      console.error("Error loading template:", error);
                      toast.error(
                        `Failed to load template: ${(error as Error).message}`
                      );
                    }
                  }}
                >
                  <div
                    css={{
                      cursor: "pointer",
                      position: "relative",
                      paddingBottom: "100%",
                      width: "100%",
                      borderRadius: "8px",
                      overflow: "hidden",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    <img
                      src={template.thumbnailUrl}
                      alt={template.title}
                      css={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <div
                      css={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: "8px",
                        background: "rgba(0,0,0,0.6)",
                        color: "white",
                        fontSize: "12px",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                      }}
                    >
                      {template.title}
                    </div>
                  </div>
                </Draggable>
              ))}
              {isLoadingCustom && <div>Loading custom templates...</div>}
            </div>
          </>
        )}

        <p
          css={{
            fontWeight: 600,
            margin: "16px 0",
          }}
        >
          Font combinations
        </p>
        <div
          css={{
            flexGrow: 1,
            display: "grid",
            gridTemplateColumns: "repeat(2,minmax(0,1fr))",
            gridGap: 8,
            padding: "16px",
          }}
        >
          {texts.map(({ img, data }, idx) => (
            <Draggable
              key={idx}
              onDrop={(pos) => {
                if (pos) {
                  try {
                    const parsedData = JSON.parse(data);
                    console.log("Parsed prebuilt template data:", parsedData);
                    processTemplateData(parsedData);
                  } catch (error) {
                    console.error("Error parsing prebuilt template:", error);
                  }
                }
              }}
              onClick={() => {
                try {
                  const parsedData = JSON.parse(data);
                  console.log("Parsed prebuilt template data:", parsedData);
                  processTemplateData(parsedData);
                } catch (error) {
                  console.error("Error parsing prebuilt template:", error);
                }
              }}
            >
              <div
                css={{
                  cursor: "pointer",
                  position: "relative",
                  paddingBottom: "100%",
                  width: "100%",
                }}
              >
                <img
                  src={img}
                  css={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    objectFit: "cover",
                    margin: "auto",
                  }}
                />
              </div>
            </Draggable>
          ))}
          {isLoading && <div>Loading...</div>}
        </div>
      </div>
    </div>
  );
};

export default TextContent;
