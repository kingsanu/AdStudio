import { FC, useEffect, useState } from 'react';
import axios from 'axios';
import { isMobile } from 'react-device-detect';
import { useEditor } from '@canva/hooks';
import Draggable from '@canva/layers/core/Dragable';
import { Delta } from '@canva/types';
import CloseSidebarButton from './CloseButton';
import FrameSearchBox from './components/FrameSearchBox';

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
  const { actions, query } = useEditor();

  useEffect(() => {
    async function fetchFrames() {
      const response = await axios.get<Frame[]>('/frames');
      setFrames(response.data);
      setIsLoading(false);
    }
    fetchFrames();
  }, []);

  const addFrame = async (frame: Frame, position?: Delta) => {
    const pageSize = query.getPageSize();
    const pageRatio = pageSize.width / pageSize.height;
    const frameRatio = frame.width / frame.height;
    const scale =
      pageRatio > frameRatio
        ? (pageSize.height * 0.5) / frame.height
        : (pageSize.width * 0.5) / frame.width;

    actions.addFrameLayer({
      type: {
        resolvedName: 'FrameLayer',
      },
      props: {
        position,
        boxSize: {
          width: frame.width * scale,
          height: frame.height * scale,
        },
        rotate: 0,
        clipPath: frame.clipPath,
        scale,
        image: {
          boxSize: {
            width: frame.width,
            height: frame.height,
          },
          position: {
            x: 0,
            y: 0,
          },
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
        padding: 16,
      }}
    >
      <CloseSidebarButton onClose={onClose} />
      <div
        css={{
          marginBottom: 16,
        }}
      >
        <FrameSearchBox />
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
