import { FC, useEffect, useState } from 'react';
import axios from 'axios';
import { getThumbnail } from '../../utils/thumbnail';
import { isMobile } from 'react-device-detect';
import { useEditor } from '@canva/hooks';
import { LayerId, SerializedLayers } from '@canva/types';
import CloseIcon from '@canva/icons/CloseIcon';
import { getPositionWhenLayerCenter } from '@canva/utils/layer/getPositionWhenLayerCenter';
import Draggable from '@canva/layers/core/Dragable';
const simpleTxt = (boxSize: any, position: any) => ({
  rootId: '7740b655-a0e2-44ec-9ecd-249ec6367582',
  layers: {
    '7740b655-a0e2-44ec-9ecd-249ec6367582': {
      type: {
        resolvedName: 'TextLayer',
      },
      props: {
        text: '<p style="font-weight: 500; font-style: normal; color: rgb(50, 38, 23); text-decoration: none; font-size: 20px; text-align: center;"><strong>Your text here!</strong></p>',
        position: position,
        boxSize: boxSize,
        scale: 1,
        rotate: 0,
        fonts: [],
        colors: ['rgb(50, 38, 23)'],
        fontSizes: [16],
        effect: null,
      },
      locked: false,
      child: [],
      parent: 'ROOT',
    },
  },
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

  const handleAddNewText = () => {
    const boxSize = {
      width: 300,
      height: 28,
      x: 45,
      y: 167,
    };
    const position = getPositionWhenLayerCenter(state.pageSize, {
      width: boxSize.width,
      height: boxSize.height,
    });
    const simpleText = simpleTxt(boxSize, position);
    actions.addLayerTree(simpleText);
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
        overflowY: 'auto',
        display: 'flex',
      }}
    >
      <div
        css={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          height: 48,
          borderBottom: '1px solid rgba(57,76,96,.15)',
          padding: '0 20px',
        }}
      >
        <p
          css={{
            lineHeight: '48px',
            fontWeight: 600,
            color: '#181C32',
            flexGrow: 1,
          }}
        >
          Text
        </p>
        <div
          css={{
            fontSize: 20,
            flexShrink: 0,
            width: 32,
            height: 32,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={onClose}
        >
          <CloseIcon />
        </div>
      </div>
      <div
        css={{ flexDirection: 'column', overflowY: 'auto', display: 'flex' }}
      >
        <div
          css={{
            flexGrow: 1,
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
            gridGap: 8,
            padding: '16px',
          }}
        >
          <button onClick={() => handleAddNewText()}>Add text</button>
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
