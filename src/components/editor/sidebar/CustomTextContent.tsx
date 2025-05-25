/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { FC, useCallback, useEffect, useRef, useState } from "react";
import { useEditor } from "canva-editor/hooks";
import useMobileDetect from "canva-editor/hooks/useMobileDetect";
import CloseSidebarButton from "canva-editor/layout/sidebar/CloseButton";
import Button from "canva-editor/components/button/Button";
import styled from "@emotion/styled";
import { BoxSize, SerializedLayers, SerializedLayer } from "canva-editor/types";
import { generateRandomID } from "canva-editor/utils/identityGenerator";
import { getPositionWhenLayerCenter } from "canva-editor/utils/layer/getPositionWhenLayerCenter";
import axios from "axios";
import Fuse from "fuse.js";
import Draggable from "canva-editor/layers/core/Dragable";
import { unpack } from "canva-editor/utils/minifier";
import { toast } from "sonner";
import { useInfiniteQuery } from "@tanstack/react-query";

import { Text, TextTemplate } from "./types";
import { simpleTxtLayer } from "./utils";
import CustomTextSearchBox from "./CustomTextSearchBox";

// Custom styled button for text options
const DefaultTextButton = styled(Button)`
  background-color: #313334;
  color: #fff;
`;

interface CustomTextContentProps {
  onClose: () => void;
}

const CustomTextContent: FC<CustomTextContentProps> = ({ onClose }) => {
  const { actions, state, config } = useEditor();
  const [keyword, setKeyword] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useMobileDetect();
  const ITEMS_PER_PAGE = 10;
  const SCROLL_THRESHOLD = 100;
  const [isTemplateLoading, setIsTemplateLoading] = useState(false);

  // Fetch text templates using React Query's useInfiniteQuery
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["textTemplates", keyword],
    queryFn: async ({ pageParam = 0 }) => {
      if (!config.apis) {
        throw new Error("API configuration is missing");
      }

      console.log(
        `[CustomTextContent] Loading page ${pageParam} with keyword: ${
          keyword || "none"
        }`
      );

      try {
        // Load prebuilt text templates with pagination
        const textsResponse = await axios.get(
          `${config.apis.url}${
            config.apis.searchTexts
          }?ps=${ITEMS_PER_PAGE}&pi=${pageParam}${
            keyword ? `&kw=${keyword}` : ""
          }`
        );

        // Handle new response format for texts
        const textsData = textsResponse.data.data || textsResponse.data || [];
        const textsPaginationInfo = textsResponse.data.pagination;

        console.log(
          `[CustomTextContent] Loaded ${textsData.length} prebuilt text templates`
        );

        // Load custom text templates (public only) with pagination
        const templatesResponse = await axios.get(
          `${
            config.apis.url
          }/text-templates?isPublic=true&ps=${ITEMS_PER_PAGE}&pi=${pageParam}${
            keyword ? `&kw=${keyword}` : ""
          }`
        );

        // Handle new response format with pagination info
        const templatesData =
          templatesResponse.data.data || templatesResponse.data || [];
        const templatesPaginationInfo = templatesResponse.data.pagination;

        console.log(
          `[CustomTextContent] Loaded ${templatesData.length} custom text templates`
        );

        // Determine if there are more items to load
        let hasMoreItems = false;

        // Check if either API has more items
        if (textsPaginationInfo?.hasMore || templatesPaginationInfo?.hasMore) {
          hasMoreItems = true;
        } else if (!textsPaginationInfo && !templatesPaginationInfo) {
          // If pagination info is not available, check if we got full pages
          hasMoreItems =
            textsData.length === ITEMS_PER_PAGE ||
            templatesData.length === ITEMS_PER_PAGE;
        }

        console.log(`[CustomTextContent] Has more items: ${hasMoreItems}`);

        return {
          texts: textsData,
          customTemplates: templatesData,
          nextPage: hasMoreItems ? pageParam + 1 : undefined,
          hasMore: hasMoreItems,
        };
      } catch (error) {
        console.error("Error loading text templates:", error);
        throw error;
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });

  // Flatten the pages of templates into arrays
  const filteredTexts = useCallback(() => {
    return data?.pages.flatMap((page) => page.texts) || [];
  }, [data?.pages])();

  const filteredCustomTemplates = useCallback(() => {
    return data?.pages.flatMap((page) => page.customTemplates) || [];
  }, [data?.pages])();

  // Check if we need to load more data when the container is too small
  useEffect(() => {
    // Skip if already loading, no more content, or no templates yet
    if (
      isLoading ||
      !hasNextPage ||
      (filteredTexts.length === 0 && filteredCustomTemplates.length === 0)
    ) {
      return;
    }

    // Check if content fills the viewport
    const checkContentHeight = () => {
      if (!scrollRef.current) return;

      const scrollContainer = scrollRef.current;
      const isContentShorterThanContainer =
        scrollContainer.scrollHeight <= scrollContainer.clientHeight;

      // If content doesn't fill viewport and we have more to load, load next page
      if (isContentShorterThanContainer && hasNextPage && !isFetchingNextPage) {
        console.log(
          "[CustomTextContent] Content doesn't fill viewport, loading more templates"
        );
        fetchNextPage();
      }
    };

    // Check after a short delay to ensure DOM is updated
    const timer = setTimeout(checkContentHeight, 300);
    return () => clearTimeout(timer);
  }, [
    filteredTexts,
    filteredCustomTemplates,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  // Debug scroll container dimensions
  useEffect(() => {
    if (scrollRef.current) {
      const { scrollHeight, clientHeight, scrollTop } = scrollRef.current;
      console.log(
        `[CustomTextContent] Scroll container - scrollHeight: ${scrollHeight}, clientHeight: ${clientHeight}, scrollTop: ${scrollTop}, difference: ${
          scrollHeight - clientHeight
        }`
      );
    }
  }, [filteredTexts.length, filteredCustomTemplates.length]);

  // Check if we need to load more data when scrolling near the bottom
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || !hasNextPage || isFetchingNextPage) return;

    const node = scrollRef.current;
    const scrollPosition = node.scrollTop + node.clientHeight;
    const scrollThreshold = node.scrollHeight - SCROLL_THRESHOLD;

    // Log scroll position for debugging
    console.log(
      `[CustomTextContent] Scroll position: ${scrollPosition}, threshold: ${scrollThreshold}, diff: ${
        scrollThreshold - scrollPosition
      }`
    );

    // When user scrolls near the bottom, load more templates
    if (scrollPosition >= scrollThreshold) {
      console.log(
        "[CustomTextContent] User scrolled to bottom, loading more templates"
      );
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Add scroll event listener
  useEffect(() => {
    const handleScrollThrottled = () => {
      // Use requestAnimationFrame to throttle scroll events
      window.requestAnimationFrame(handleScroll);
    };

    const currentScrollRef = scrollRef.current;
    if (currentScrollRef) {
      console.log("[CustomTextContent] Adding scroll event listener");
      currentScrollRef.addEventListener("scroll", handleScrollThrottled);
    }

    return () => {
      if (currentScrollRef) {
        console.log("[CustomTextContent] Removing scroll event listener");
        currentScrollRef.removeEventListener("scroll", handleScrollThrottled);
      }
    };
  }, [handleScroll]);

  // Handle search
  const handleSearch = useCallback((kw: string) => {
    console.log(`[CustomTextContent] Searching for: ${kw || "empty"}`);

    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }

    setKeyword(kw);
  }, []);

  // Process template data in various formats
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

      Object.entries(convertedData.layers).forEach(
        ([layerId, layerDataUntyped]) => {
          // Type assertion to make TypeScript happy
          const layerData: Record<string, any> = layerDataUntyped as Record<
            string,
            any
          >;

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
            actions.addLayer(modifiedLayerData as any);
            console.log(`Added layer ${layerId} as child of ROOT`);
          } else {
            // This is a nested layer, preserve its original parent
            actions.addLayer(layerData as any);
            console.log(
              `Added layer ${layerId} with original parent ${layerData.parent}`
            );
          }
        }
      );
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

  // Add a new text layer
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
        <CustomTextSearchBox
          searchString={keyword}
          onStartSearch={handleSearch}
        />
      </div>

      <div
        ref={scrollRef}
        css={{
          flexDirection: "column",
          overflowY: "auto",
          overflowX: "hidden",
          display: "flex",
          flexGrow: 1,
          height: "calc(100% - 80px)", // Subtract header height
          WebkitOverflowScrolling: "touch", // Smooth scrolling on iOS
        }}
      >
        {/* Default text styles section - hide when searching */}
        {!keyword && (
          <>
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
                marginBottom: 24,
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
          </>
        )}

        {/* Custom text templates section */}
        {filteredCustomTemplates.length > 0 && (
          <>
            <p
              css={{
                fontWeight: 600,
                margin: "16px 0",
              }}
            >
              Text Templates
            </p>
            <div
              css={{
                display: "grid",
                gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                gridGap: 8,
                marginBottom: 24,
              }}
            >
              {filteredCustomTemplates.map((template) => (
                <Draggable
                  key={template._id}
                  onDrop={async (pos) => {
                    if (pos) {
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
            </div>
          </>
        )}

        {/* Prebuilt text templates section */}
        {filteredTexts.length > 0 && (
          <>
            <p
              css={{
                fontWeight: 600,
                margin: "16px 0",
              }}
            >
              Prebuilt Text Templates
            </p>
            <div
              css={{
                display: "grid",
                gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                gridGap: 8,
              }}
            >
              {filteredTexts.map((item, idx) => (
                <Draggable
                  key={idx}
                  onDrop={(pos) => {
                    if (pos) {
                      try {
                        const parsedData = JSON.parse(item.data);

                        // Show loading toast
                        toast.loading("Loading template...");

                        // Process the template data
                        processTemplateData(parsedData);

                        // Show success toast
                        toast.dismiss();
                        toast.success("Template added successfully");
                        if (isMobile) {
                          onClose();
                        }
                      } catch (error) {
                        console.error(
                          "Error parsing prebuilt template:",
                          error
                        );
                        toast.error(
                          "Error loading template: " + (error as Error).message
                        );
                      }
                    }
                  }}
                  onClick={() => {
                    try {
                      const parsedData = JSON.parse(item.data);

                      // Show loading toast
                      toast.loading("Loading template...");

                      // Process the template data
                      processTemplateData(parsedData);

                      // Show success toast
                      toast.dismiss();
                      toast.success("Template added successfully");
                      if (isMobile) {
                        onClose();
                      }
                    } catch (error) {
                      console.error("Error parsing prebuilt template:", error);
                      toast.error(
                        "Error loading template: " + (error as Error).message
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
                      src={item.img}
                      alt="Text template"
                      css={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                </Draggable>
              ))}
            </div>
          </>
        )}

        {/* Loading indicator - only shown when no content */}
        {isLoading &&
          filteredTexts.length === 0 &&
          filteredCustomTemplates.length === 0 &&
          !keyword && (
            <div css={{ textAlign: "center", padding: "20px 0" }}>
              Loading text templates...
            </div>
          )}

        {/* Loading more indicator - shown at bottom when scrolling */}
        {isFetchingNextPage && (
          <div
            css={{
              textAlign: "center",
              padding: "20px 0",
              gridColumn: "span 2",
            }}
          >
            <div
              css={{
                display: "inline-block",
                width: "30px",
                height: "30px",
                border: "3px solid rgba(0, 0, 0, 0.1)",
                borderTopColor: "#3498db",
                borderRadius: "50%",
                animation: "spin 1s ease-in-out infinite",
                "@keyframes spin": {
                  to: { transform: "rotate(360deg)" },
                },
              }}
            />
          </div>
        )}

        {/* End of templates message */}
        {!isLoading &&
          !hasNextPage &&
          (filteredTexts.length > 0 || filteredCustomTemplates.length > 0) && (
            <div
              css={{
                textAlign: "center",
                padding: "10px 0",
                fontSize: "12px",
                color: "#888",
              }}
            >
              End of templates
            </div>
          )}

        {/* No results message */}
        {!isLoading &&
          filteredTexts.length === 0 &&
          filteredCustomTemplates.length === 0 &&
          keyword && (
            <div css={{ textAlign: "center", padding: "20px 0" }}>
              {isError
                ? "Failed to load templates. Please try again."
                : "No text templates found. Try a different search term."}
            </div>
          )}
      </div>
    </div>
  );
};

export default CustomTextContent;
