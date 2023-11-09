import { FC, useEffect, useState } from 'react';
import axios from 'axios';
import { getThumbnail } from '../../utils/thumbnail';
import { isMobile } from 'react-device-detect';
import { useEditor } from '@canva/hooks';
import { BoxSize, Delta, LayerId, SerializedLayers } from '@canva/types';
import { getPositionWhenLayerCenter } from '@canva/utils/layer/getPositionWhenLayerCenter';
import Draggable from '@canva/layers/core/Dragable';
import { generateRandomID } from '@canva/utils/identityGenerator';
import Button from '@canva/components/button/Button';
import CloseSidebarButton from './CloseButton';
import OutlineButton from '@canva/components/button/OutlineButton';
import styled from '@emotion/styled';

const DefaultTextButton = styled(OutlineButton)`
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
    resolvedName: 'TextLayer',
  },
  props: {
    position,
    boxSize,
    scale: 1,
    rotate: 0,
    text: `<p style="text-align: center;font-family: 'Canva Sans Regular';font-size: ${fontSize}px;color: rgb(0, 0, 0);line-height: 1.4;letter-spacing: normal;"><strong><span style="color: rgb(0, 0, 0);">${text}</span></strong></p>`,
    fonts: [
      {
        family: 'Canva Sans',
        name: 'Canva Sans Regular',
        url: 'http://fonts.gstatic.com/s/alexandria/v3/UMBCrPdDqW66y0Y2usFeQCH18mulUxBvI9r7TqbCHJ8BRq0b.woff2',
        style: 'regular',
        styles: [
          {
            family: 'Canva Sans',
            name: 'Canva Sans Bold 300',
            url: 'http://fonts.gstatic.com/s/alexandria/v3/UMBCrPdDqW66y0Y2usFeQCH18mulUxBvI9qlTqbCHJ8BRq0b.woff2',
            style: '300',
          },
          {
            family: 'Canva Sans',
            name: 'Canva Sans Bold 500',
            url: 'http://fonts.gstatic.com/s/alexandria/v3/UMBCrPdDqW66y0Y2usFeQCH18mulUxBvI9rJTqbCHJ8BRq0b.woff2',
            style: '500',
          },
        ],
      },
    ],
    colors: ['rgb(0, 0, 0)'],
    fontSizes: [fontSize],
    effect: null,
  },
  locked: false,
  child: [],
  parent: 'ROOT',
});
interface Text {
  img: string;
  data: string;
}
const TextContent: FC<{ onClose: () => void }> = ({ onClose }) => {
  const { actions, state } = useEditor();
  const [texts, setTexts] = useState<Text[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTexts() {
      const response = await axios.get<Text[]>('/texts');
      setTexts(response.data);
      setIsLoading(false);
    }

    fetchTexts();
  }, []);
  const handleAddText = (data: {
    rootId: LayerId;
    layers: SerializedLayers;
  }) => {
    actions.addLayerTree(data);
    if (isMobile) {
      onClose();
    }
  };

  const handleAddNewText = (
    text = 'Your text here!',
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
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        display: 'flex',
        padding: 16,
      }}
    >
      <CloseSidebarButton onClose={onClose} />
      <div>
        <Button
          onClick={() => handleAddNewText()}
          text='Add a text box'
          style={{ width: '100%' }}
        />
      </div>
      <p
        css={{
          fontWeight: 600,
          margin: '16px 0',
        }}
      >
        Default text styles
      </p>
      <div
        css={{
          display: 'flex',
          flexDirection: 'column',
          rowGap: 8,
        }}
      >
        <DefaultTextButton
          onClick={() =>
            handleAddNewText(
              'Add a heading',
              {
                width: 400,
                height: 70,
              },
              45
            )
          }
          text='Add a heading'
          css={{
            fontSize: 28,
            height: 60,
            fontWeight: 600,
            fontFamily: 'Canva Sans'
          }}
        />
        <DefaultTextButton
          onClick={() =>
            handleAddNewText(
              'Add a subheading',
              {
                width: 300,
                height: 45,
              },
              32
            )
          }
          text='Add a subheading'
          css={{
            fontSize: 18,
            height: 52,
            fontWeight: 600,
          }}
        />
        <DefaultTextButton
          onClick={() =>
            handleAddNewText(
              'Add a little bit of body text',
              {
                width: 300,
                height: 22,
              },
              16
            )
          }
          text='Add a little bit of body text'
          css={{
            fontSize: 14,
            height: 48,
          }}
        />
      </div>
      <p
        css={{
          fontWeight: 600,
          margin: '16px 0',
        }}
      >
        Font combinations
      </p>
      <div
        css={{
          flexDirection: 'column',
          overflowY: 'auto',
          display: 'flex',
        }}
      >
        <div
          css={{
            flexGrow: 1,
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
            gridGap: 8,
            padding: '16px',
          }}
        >
          {isLoading && <div>Loading...</div>}
          {texts.map(({ img, data }, idx) => (
            <Draggable
              key={idx}
              onDrop={(pos) => {
                if (pos) {
                  handleAddText(JSON.parse(data)); // Todo
                }
              }}
              onClick={() => {
                handleAddText(JSON.parse(data));
              }}
            >
              <div
                css={{
                  cursor: 'pointer',
                  position: 'relative',
                  paddingBottom: '100%',
                  width: '100%',
                }}
              >
                <img
                  src={getThumbnail(img)}
                  css={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: '100%',
                    objectFit: 'cover',
                  }}
                />
              </div>
            </Draggable>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TextContent;
