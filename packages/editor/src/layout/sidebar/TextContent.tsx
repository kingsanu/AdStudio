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
  const processTemplateData = (data: any) => {
    // Check if the data is already in the correct format
    if (data.rootId && data.layers) {
      return handleAddText(data);
    } else if (Array.isArray(data) && data[0]) {
      // Try to unpack if it's in minified format
      if (data[0].a) {
        const unpacked = unpack(data[0]);
        return handleAddText(unpacked);
      } else if (data[0].layers) {
        // It's in the array format but not minified
        const rootId =
          data[0].rootId ||
          Object.keys(data[0].layers).find((id) => id !== "ROOT") ||
          (data[0].layers.ROOT?.child && data[0].layers.ROOT.child[0]);

        if (rootId) {
          return handleAddText({
            rootId,
            layers: data[0].layers,
          });
        }
      }
    }

    console.error("Unrecognized template format", data);
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
    console.log("Adding text layer tree:", data);

    try {
      // Make sure all effect layers are included
      const { rootId, layers } = data;

      if (!rootId || !layers) {
        console.error("Invalid layer data: missing rootId or layers", data);
        return;
      }

      const allLayers = { ...layers };

      // Validate the rootId exists in the layers
      if (!allLayers[rootId]) {
        console.warn(
          `RootId ${rootId} not found in layers, trying to find a valid text layer`
        );

        // Try to find a valid text layer to use as rootId
        const textLayerId = Object.keys(allLayers).find((id) => {
          const layer = allLayers[id];
          return (
            layer.type?.resolvedName === "TextLayer" ||
            (layer.props?.text && typeof layer.props.text === "string")
          );
        });

        if (textLayerId) {
          console.log(`Using ${textLayerId} as rootId instead`);
          // Add the layer tree to the editor with the new rootId
          actions.addLayerTree({
            rootId: textLayerId,
            layers: allLayers,
          });

          if (isMobile) {
            onClose();
          }
          return;
        } else {
          console.error("No valid text layer found in template");
          return;
        }
      }

      // Check if any text layers have effects that need to be included
      for (const id in layers) {
        const layer = layers[id];
        if (layer.type?.resolvedName === "TextLayer" && layer.props?.effect) {
          console.log(`Text layer ${id} has effect:`, layer.props.effect);
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
      console.error("Error adding text layer tree:", error);
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
                        // Check if we have the minified format (with a, b, c or as, aq, ar properties)
                        const isMinifiedFormat =
                          Array.isArray(templateData) &&
                          templateData[0] &&
                          (templateData[0]?.a ||
                            templateData[0]?.as ||
                            templateData[0]?.layers);
                        console.log("Is minified format:", isMinifiedFormat);
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

                        // Find text layers (non-ROOT layers)
                        const textLayerIds = [];
                        for (const id in layers) {
                          if (id !== "ROOT" && id !== "at") {
                            const layer = layers[id];
                            // Check if it's a text layer by looking at type or properties
                            const isTextLayer =
                              layer.type?.resolvedName === "TextLayer" || // Check by type
                              (layer.props?.text &&
                                typeof layer.props.text === "string") || // Check by having text property
                              (layer.props?.effect &&
                                layer.type?.resolvedName === "EffectLayer" &&
                                layer.parent &&
                                layers[layer.parent]?.type?.resolvedName ===
                                  "TextLayer"); // Check for effect on text

                            if (isTextLayer) {
                              textLayerIds.push(id);
                            }
                          }
                        }

                        // If no text layers found, check ROOT's children
                        if (textLayerIds.length === 0) {
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
                                  // Check if it's a text layer
                                  const isTextLayer =
                                    layer.au?.av === "TextLayer" ||
                                    (layer.aw?.bj &&
                                      typeof layer.aw.bj === "string");

                                  if (isTextLayer) {
                                    // Convert text layer
                                    convertedLayers[id] = {
                                      type: {
                                        resolvedName: "TextLayer",
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
                                        text: layer.aw?.bj || "<p>Text</p>",
                                        fonts: [],
                                        colors: layer.aw?.bn || [
                                          "rgb(0, 0, 0)",
                                        ],
                                        fontSizes: layer.aw?.bo || [18],
                                        effect: null,
                                      },
                                      locked: layer.ar || false,
                                      child: layer.be || [],
                                      parent: layer.bf || "ROOT",
                                    };

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
                                    textLayerIds.push(id);
                                  }
                                }
                              }
                            }

                            // Use the converted layers instead of the original ones
                            layers = convertedLayers;
                          }
                        }

                        // If still no text layers, use the template data as is
                        if (textLayerIds.length === 0) {
                          console.warn(
                            "No valid text layers found in template, using original template data"
                          );

                          // Instead of creating a new layer, check if we can use existing data
                          if (convertedData.rootId && convertedData.layers) {
                            console.log("Using original template structure");
                            // Use the original template structure
                            return handleAddText({
                              rootId: convertedData.rootId,
                              layers: convertedData.layers,
                            });
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
                              textLayerIds.push(firstChildId);
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
                              textLayerIds.push(firstChildId);
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

                            textLayerIds.push(defaultTextLayerId);
                          }
                        }

                        // Use the first text layer as rootId
                        const rootId = textLayerIds[0];

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
                      console.log(file);
                      console.log(filename);
                      // Fetch the template data
                      const response = await axios.get(
                        `${config.apis.url}/get-text-template/${filename}`
                      );

                      // Format the data correctly for the editor
                      // The editor expects a SerializedLayerTree with rootId and layers
                      const templateData = response.data;
                      console.log("Response data:", response.data);
                      console.log("Fetching template data:", templateData);
                      // Check if we have the minified format (with a, b, c or as, aq, ar properties)
                      const isMinifiedFormat =
                        Array.isArray(templateData) &&
                        templateData[0] &&
                        (templateData[0]?.a ||
                          templateData[0]?.as ||
                          templateData[0]?.layers);
                      console.log(isMinifiedFormat);
                      // Convert from minified format if needed
                      let convertedData;
                      if (isMinifiedFormat) {
                        console.log(
                          "Detected minified format, using unpack function..."
                        );
                        // Use the built-in unpack function to convert from minified format
                        convertedData = unpack(templateData[0]);
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

                      // Find text layers (non-ROOT layers)
                      const textLayerIds = [];
                      for (const id in layers) {
                        if (id !== "ROOT" && id !== "at") {
                          const layer = layers[id];
                          // Check if it's a text layer by looking at type or properties
                          const isTextLayer =
                            layer.type?.resolvedName === "TextLayer" || // Check by type
                            (layer.props?.text &&
                              typeof layer.props.text === "string") || // Check by having text property
                            (layer.props?.effect &&
                              layer.type?.resolvedName === "EffectLayer" &&
                              layer.parent &&
                              layers[layer.parent]?.type?.resolvedName ===
                                "TextLayer"); // Check for effect on text

                          if (isTextLayer) {
                            textLayerIds.push(id);
                          }
                        }
                      }

                      // If no text layers found, check ROOT's children
                      if (textLayerIds.length === 0) {
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
                                color: layers.at.aw?.bc || "rgb(255, 255, 255)",
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
                                // Check if it's a text layer
                                const isTextLayer =
                                  layer.au?.av === "TextLayer" ||
                                  (layer.aw?.bj &&
                                    typeof layer.aw.bj === "string");

                                if (isTextLayer) {
                                  // Convert text layer
                                  convertedLayers[id] = {
                                    type: {
                                      resolvedName: "TextLayer",
                                    },
                                    props: {
                                      position: layer.aw?.ba || { x: 0, y: 0 },
                                      boxSize: layer.aw?.ax || {
                                        width: 300,
                                        height: 100,
                                      },
                                      scale: layer.aw?.bi || 1,
                                      rotate: layer.aw?.bb || 0,
                                      text: layer.aw?.bj || "<p>Text</p>",
                                      fonts: [],
                                      colors: layer.aw?.bn || ["rgb(0, 0, 0)"],
                                      fontSizes: layer.aw?.bo || [18],
                                      effect: null,
                                    },
                                    locked: layer.ar || false,
                                    child: layer.be || [],
                                    parent: layer.bf || "ROOT",
                                  };
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
                                        mappedSettings.thickness = settings.bt;
                                      if (settings.color !== undefined)
                                        mappedSettings.color = settings.color;

                                      convertedLayers[
                                        id
                                      ].props.effect.settings = mappedSettings;
                                    }
                                  }

                                  // Handle fonts with proper mapping
                                  if (layer.aw?.bk && layer.aw.bk.length > 0) {
                                    const mappedFonts = layer.aw.bk.map(
                                      (font: any) => ({
                                        family: font.x || "",
                                        name: font.name || "",
                                        url: font.y || "",
                                        style: font.bl || "regular",
                                        styles: font.bm || [],
                                        // Add any additional font properties that might be needed
                                      })
                                    );
                                    convertedLayers[id].props.fonts =
                                      mappedFonts;
                                  }

                                  textLayerIds.push(id);
                                }
                              }
                            }
                          }

                          // Use the converted layers instead of the original ones
                          layers = convertedLayers;
                        }
                      }

                      // If still no text layers, use the template data as is
                      if (textLayerIds.length === 0) {
                        console.warn(
                          "No valid text layers found in template, using original template data"
                        );

                        // Instead of creating a new layer, check if we can use existing data
                        if (convertedData.rootId && convertedData.layers) {
                          console.log("Using original template structure");
                          // Use the original template structure
                          return handleAddText({
                            rootId: convertedData.rootId,
                            layers: convertedData.layers,
                          });
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
                            textLayerIds.push(firstChildId);
                          }
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
                                color: layers.at.aw?.bc || "rgb(255, 255, 255)",
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
                                // Check if it's a text layer
                                const isTextLayer =
                                  layer.au?.av === "TextLayer" ||
                                  (layer.aw?.bj &&
                                    typeof layer.aw.bj === "string");

                                if (isTextLayer) {
                                  // Convert text layer
                                  convertedLayers[id] = {
                                    type: {
                                      resolvedName: "TextLayer",
                                    },
                                    props: {
                                      position: layer.aw?.ba || { x: 0, y: 0 },
                                      boxSize: layer.aw?.ax || {
                                        width: 300,
                                        height: 100,
                                      },
                                      scale: layer.aw?.bi || 1,
                                      rotate: layer.aw?.bb || 0,
                                      text: layer.aw?.bj || "<p>Text</p>",
                                      fonts: layer.aw?.bk || [],
                                      colors: layer.aw?.bn || ["rgb(0, 0, 0)"],
                                      fontSizes: layer.aw?.bo || [18],
                                      effect: layer.aw?.bp || null,
                                    },
                                    locked: layer.ar || false,
                                    child: layer.be || [],
                                    parent: layer.bf || "ROOT",
                                  };
                                  textLayerIds.push(id);
                                }
                              }
                            }
                          }

                          // Use the converted layers instead of the original ones
                          layers = convertedLayers;

                          // If we still don't have any text layers, use the first child of the root
                          if (
                            textLayerIds.length === 0 &&
                            convertedLayers.ROOT?.child?.length > 0
                          ) {
                            const firstChildId = convertedLayers.ROOT.child[0];
                            if (convertedLayers[firstChildId]) {
                              console.log(
                                `Using first child of ROOT as rootId: ${firstChildId}`
                              );
                              textLayerIds.push(firstChildId);
                            }
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
                          const existingTextLayer = Object.values(layers).find(
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

                          textLayerIds.push(defaultTextLayerId);
                        }
                      }

                      // Use the first text layer as rootId
                      const rootId = textLayerIds[0];

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
