import React, { FC, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useEditor } from '@canva/hooks';
import axios from 'axios';
import CloseSidebarButton from './CloseButton';

const VideoContent: FC<{ onClose: () => void }> = ({ onClose }) => {
  const [videos, setVideos] = useState<
    { img: string; url: string; width: number; height: number }[]
  >([
    {
      img: 'https://template.canva.com/EAFaarkqz_0/2/0/400w-IVVQCZOr1K4.jpg',
      url: 'https://template.canva.com/EAFaarkqz_0/2/0/400w-xadNArxL6gA.mp4',
      width: 400,
      height: 334,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { actions } = useEditor();
  useEffect(() => {
    async function fetchVideos() {
      const response = await axios.get<
        { img: string; url: string; width: number; height: number }[]
      >('/videos');
      setVideos(response.data);
      setIsLoading(false);
    }

    fetchVideos();
  }, []);

  const addVideo = ({
    url,
    width,
    height,
  }: {
    url: string;
    width: number;
    height: number;
  }) => {
    actions.addVideoLayer({ url }, { width, height });
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
      <CloseSidebarButton onClose={onClose} />
      <div
        css={{ flexDirection: 'column', overflowY: 'auto', display: 'flex' }}
      >
        <div
          css={{
            flexGrow: 1,
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
            padding: '16px',
            gridGap: 8,
          }}
        >
          {isLoading && <div>Loading...</div>}
          {videos.map((item, idx) => (
            <div
              key={idx}
              css={{
                cursor: 'pointer',
                position: 'relative',
                paddingBottom: '100%',
                width: '100%',
              }}
              onClick={() => addVideo(item)}
            >
              <img
                src={item.img}
                loading='lazy'
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoContent;
