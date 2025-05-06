import { BoxSize, Delta, SerializedLayers } from "canva-editor/types";

// Helper function to create a simple text layer
export const simpleTxtLayer = (
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

// Process template data for adding to the editor
export const processTemplateData = (
  data: unknown,
  addLayerTree: (params: { rootId: string; layers: SerializedLayers }) => void
): boolean => {
  try {
    if (!data) return false;
    console.log("Processing template data:", data);

    let rootId: string;
    let allLayers: SerializedLayers = {};

    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch (error) {
        console.error("Error parsing template data:", error);
        return false;
      }
    }

    // Handle different data formats
    if (Array.isArray(data)) {
      // Array format - use first item
      const firstItem = data[0];
      if (firstItem && firstItem.layers && firstItem.layers.ROOT) {
        rootId = "ROOT";
        allLayers = firstItem.layers;
      } else if (firstItem && typeof firstItem === "object") {
        // Try to find layers in other properties
        const possibleLayersProps = ["layers", "as"];
        let foundLayers = false;

        for (const prop of possibleLayersProps) {
          if (firstItem[prop] && typeof firstItem[prop] === "object") {
            allLayers = firstItem[prop] as SerializedLayers;
            foundLayers = true;
            break;
          }
        }

        if (foundLayers) {
          // Find a suitable rootId
          if (allLayers.ROOT) {
            rootId = "ROOT";
          } else {
            // Find any layer that's not a child of another layer
            const layerIds = Object.keys(allLayers);
            rootId =
              layerIds.find(
                (id) =>
                  !layerIds.some((otherId) =>
                    allLayers[otherId]?.child?.includes(id)
                  )
              ) || layerIds[0];
          }
        } else {
          console.error("Could not find layers in array template format");
          return false;
        }
      } else {
        console.error("Invalid array template format");
        return false;
      }
    } else if (typeof data === "object" && data !== null) {
      // Object format
      const templateData = data as any;

      // Check for layers property
      if (templateData.layers) {
        allLayers = templateData.layers as SerializedLayers;

        // Find a suitable rootId
        if (allLayers.ROOT) {
          rootId = "ROOT";
        } else {
          // Find any non-child layer
          const layerIds = Object.keys(allLayers);
          rootId =
            layerIds.find(
              (id) =>
                !layerIds.some((otherId) =>
                  allLayers[otherId]?.child?.includes(id)
                )
            ) || layerIds[0];
        }
      } else if (templateData.as) {
        // Alternative format with 'as' property for layers
        allLayers = templateData.as as SerializedLayers;

        // Find a suitable rootId
        if (allLayers.ROOT || allLayers.at) {
          rootId = allLayers.ROOT ? "ROOT" : "at";
        } else {
          // Find any non-child layer
          const layerIds = Object.keys(allLayers);
          rootId =
            layerIds.find(
              (id) =>
                !layerIds.some(
                  (otherId) =>
                    allLayers[otherId]?.child?.includes(id) ||
                    allLayers[otherId]?.be?.includes(id)
                )
            ) || layerIds[0];
        }
      } else {
        // Try to find any property that might contain layers
        const possibleLayersProps = Object.keys(templateData).filter(
          (key) =>
            typeof templateData[key] === "object" && templateData[key] !== null
        );

        let foundLayers = false;
        for (const prop of possibleLayersProps) {
          const propValue = templateData[prop];
          if (
            typeof propValue === "object" &&
            Object.keys(propValue).length > 0 &&
            Object.values(propValue).some(
              (val: any) =>
                val &&
                typeof val === "object" &&
                (val.type || val.props || val.child)
            )
          ) {
            allLayers = propValue as SerializedLayers;
            foundLayers = true;

            // Find a suitable rootId
            const layerIds = Object.keys(allLayers);
            rootId =
              layerIds.find((id) => id === "ROOT") ||
              layerIds.find(
                (id) =>
                  !layerIds.some((otherId) =>
                    allLayers[otherId]?.child?.includes(id)
                  )
              ) ||
              layerIds[0];

            break;
          }
        }

        if (!foundLayers) {
          console.error("Could not find layers in template data");
          return false;
        }
      }
    } else {
      console.error("Unsupported template data format");
      return false;
    }

    // Process layers to ensure they're properly formatted
    Object.entries(allLayers).forEach(([id, layer]) => {
      // Skip ROOT layer
      if (id === "ROOT" || id === "at") return;

      // Ensure layer has proper parent
      if (!layer.parent) {
        layer.parent = "ROOT";
      }

      // Ensure layer has child array
      if (!layer.child) {
        layer.child = [];
      }
    });

    console.log("Adding layer tree with rootId:", rootId);
    console.log("Layers:", allLayers);

    // Add the layer tree to the editor
    addLayerTree({
      rootId,
      layers: allLayers,
    });

    return true;
  } catch (error) {
    console.error("Error processing template data:", error);
    return false;
  }
};
