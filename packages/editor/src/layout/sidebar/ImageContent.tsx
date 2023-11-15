import React, { FC, useEffect, useState } from 'react';
import axios from 'axios';
import { getThumbnail } from '../../utils/thumbnail';
import { isMobile } from 'react-device-detect';
import { useEditor } from '@canva/hooks';
import Draggable from '@canva/layers/core/Dragable';
import { Delta } from '@canva/types';
import CloseSidebarButton from './CloseButton';
import ImageSearchBox from './components/ImageSearchBox';
import HorizontalCarousel from '@canva/components/carousel/HorizontalCarousel';
import OutlineButton from '@canva/components/button/OutlineButton';

const ImageContent: FC<{ onClose: () => void }> = ({ onClose }) => {
  const [images, setImages] = useState<{ img: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    async function fetchImages() {
      const response = await axios.get<{ img: string }[]>('/images');
      setImages(response.data);
      setIsLoading(false);
    }
    fetchImages();
  }, []);

  const { actions } = useEditor();
  const addImage = async (thumb: string, url: string, position?: Delta) => {
    const img = new Image();
    img.onerror = (err) => {
      // Sentry.captureException(err); // TODO
      window.alert(err);
    };
    img.src = url;
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      actions.addImageLayer(
        { thumb, url, position },
        { width: img.naturalWidth, height: img.naturalHeight }
      );
      if (isMobile) {
        onClose();
      }
    };
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
        <ImageSearchBox />
        <div css={{ paddingTop: 8 }}>
          <HorizontalCarousel>
            <div className='carousel-item'>
              <OutlineButton onClick={() => {}}>Christmas</OutlineButton>
            </div>
            <div className='carousel-item'>
              <OutlineButton onClick={() => {}}>Background</OutlineButton>
            </div>
            <div className='carousel-item'>
              <OutlineButton onClick={() => {}}>Thanksgiving</OutlineButton>
            </div>
            <div className='carousel-item'>
              <OutlineButton onClick={() => {}}>Black</OutlineButton>
            </div>
          </HorizontalCarousel>
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
          }}
        >
          {isLoading && <div>Loading...</div>}
          {images.map((item, idx) => (
            <Draggable
              key={idx}
              onDrop={(pos) => {
                if (pos) {
                  addImage(getThumbnail(item.img), item.img, pos);
                }
              }}
              onClick={() => {
                addImage(getThumbnail(item.img), item.img);
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
                  src={getThumbnail(item.img)}
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
            </Draggable>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageContent;
