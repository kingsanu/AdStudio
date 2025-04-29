// Define a simple empty text template structure that matches what the editor expects
export const emptyTextTemplate = {
  name: "New Text Template",
  editorConfig: [
    {
      name: "Page 1",
      notes: "",
      layers: {
        ROOT: {
          type: {
            resolvedName: "RootLayer",
          },
          props: {
            boxSize: {
              width: 1640,
              height: 924,
            },
            position: {
              x: 0,
              y: 0,
            },
            rotate: 0,
            color: "rgb(255, 255, 255)",
            image: null,
          },
          locked: false,
          child: [],
          parent: null,
        },
      },
    },
  ],
};
