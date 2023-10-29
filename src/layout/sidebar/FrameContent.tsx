import { FC, useEffect, useState } from 'react';
import axios from 'axios';
import { isMobile } from 'react-device-detect';
import { useEditor } from '@canva/hooks';
import CloseIcon from '@canva/icons/CloseIcon';
import Draggable from '@canva/layers/core/Dragable';

interface Frame {
  img: string;
  desc: string;
  clipPath: string;
  width: number;
  height: number;
}
const FrameContent: FC<{ onClose: () => void }> = ({ onClose }) => {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { actions } = useEditor();

  useEffect(() => {
    async function fetchFrames() {
      const response = await axios.get<Frame[]>('/frames');
      setFrames(response.data);
      setIsLoading(false);
    }
    fetchFrames();
  }, []);

  const addFrame = async (
    frame: Frame,
    position?: { x: number; y: number }
  ) => {
    actions.addFrameLayer({
      type: {
        resolvedName: 'FrameLayer',
      },
      props: {
        position,
        boxSize: {
          width: frame.width,
          height: frame.height,
        },
        rotate: 0,
        image: {
          boxSize: {
            width: frame.width,
            height: frame.height,
          },
          position,
          rotate: 0,
          thumb: frame.img,
          url: frame.img,
        },
      },
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
          Frames
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
          {isLoading && <div>Loading...</div>}
          {frames.map((frame, index) => (
            <Draggable
              key={index}
              onDrop={(pos) => {
                if (pos) {
                  addFrame(frame, pos);
                }
              }}
              onClick={() => {
                addFrame(frame);
              }}
            >
              <div css={{ cursor: 'pointer', position: 'relative' }}>
                <div css={{ paddingBottom: '100%' }} />
                <div
                  css={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={frame.img}
                    css={{
                      maxHeight: '100%',
                      maxWidth: '100%',
                    }}
                  />
                </div>
              </div>
            </Draggable>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FrameContent;
