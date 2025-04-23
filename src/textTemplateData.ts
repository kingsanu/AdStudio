export const textTemplateData = [
  {
    name: "Text Template",
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
        child: ["text_heading"],
        parent: null,
      },
      text_heading: {
        type: {
          resolvedName: "TextLayer",
        },
        props: {
          position: {
            x: 520,
            y: 400,
          },
          boxSize: {
            width: 600,
            height: 120,
          },
          scale: 1,
          rotate: 0,
          text: '<p style="text-align: center;font-family: \'Canva Sans Regular\';font-size: 45px;color: rgb(0, 0, 0);line-height: 1.4;letter-spacing: normal;"><strong><span style="color: rgb(0, 0, 0);">Create Your Text Template</span></strong></p>',
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
          fontSizes: [45],
          effect: null,
        },
        locked: false,
        child: [],
        parent: "ROOT",
      },
    },
  },
];
