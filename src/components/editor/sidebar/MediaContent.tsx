import React, { FC, useState } from 'react';

interface MediaContentProps {
  onClose: () => void;
}

const MediaContent: FC<MediaContentProps> = ({ onClose }) => {
  const [showAllBackgrounds, setShowAllBackgrounds] = useState(false);
  const [showAllIllustrations, setShowAllIllustrations] = useState(false);
  const [showAllIcons, setShowAllIcons] = useState(false);
  const [showAll3dImages, setShowAll3dImages] = useState(false);

  const handleViewMore = (category: string) => {
    switch (category) {
      case 'Backgrounds':
        setShowAllBackgrounds(true);
        break;
      case 'Illustrations':
        setShowAllIllustrations(true);
        break;
      case 'Icons':
        setShowAllIcons(true);
        break;
      case '3D Images':
        setShowAll3dImages(true);
        break;
      default:
        break;
    }
  };

  const renderSection = (title: string, showAll: boolean, handleViewMoreClick: () => void) => (
    <div css={{ marginBottom: '20px' }}>
      <div css={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 10px' }}>
        <h3>{title}</h3>
        {!showAll && (
          <button
            css={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer' }}
            onClick={handleViewMoreClick}
          >
            View More
          </button>
        )}
      </div>
      <div css={{ overflowX: showAll ? 'hidden' : 'auto', display: 'flex', padding: '10px' }}>
        {/* Placeholder content - replace with actual image/item rendering */}
        {Array.from({ length: showAll ? 20 : 5 }).map((_, index) => (
          <div
            key={index}
            css={{
              flexShrink: 0,
              width: '100px',
              height: '100px',
              backgroundColor: '#f0f0f0',
              marginRight: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #ccc',
            }}
          >
            {title.slice(0, 1)} Item {index + 1}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div css={{ height: '100%', overflowY: 'auto' }}>
      <div css={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px' }}>
        <h2>Media</h2>
        <button
          css={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
          onClick={onClose}
        >
          &times;
        </button>
      </div>
      <div css={{ padding: '10px' }}>
        {renderSection('Backgrounds', showAllBackgrounds, () => handleViewMore('Backgrounds'))}
        {renderSection('Illustrations', showAllIllustrations, () => handleViewMore('Illustrations'))}
        {renderSection('Icons', showAllIcons, () => handleViewMore('Icons'))}
        {renderSection('3D Images', showAll3dImages, () => handleViewMore('3D Images'))}
      </div>
    </div>
  );
};

export default MediaContent;