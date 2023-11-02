import React, { useState } from 'react';
import styled from '@emotion/styled';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(217px, 1fr));
  gap: 10px;
  position: relative;
`;

const GridItem = styled.button<{isNew: boolean;}>`
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
  width: 100%;
  animation: ${({ isNew }) => (isNew ? 'floating 0.8s' : 'none')};

  @keyframes floating {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-20px);
    }
  }

  > div:nth-child(1) {
    background-color: #fff;
    border: 3px solid #8b3dff;
    pointer-events: none;
    padding: 2px;
    border-radius: 8px;
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 4px;
  }

  > div:nth-child(2) p {
    padding: 8px 8px 12px;
    font-weight: 600;
  }
`;

const AddButton = styled.button`
  display: none;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 10px;
  background: #fff;
  border: 1px solid #ccc;
  cursor: pointer;
  animation: fade 0.3s linear;
  @keyframes fade {
    0% { opacity: 0 }
    100% { opacity: 1 }
  }
`;

const Spacer = styled.div`
  width: 100%;
  position: absolute;
  top: 50%;
  left: 50%;
  pointer-events: none;
  transform: translate(-50%, -50%);
`;

const GridItemContainer = styled.div`
  position: relative;
  background-color: #8b3dff;
  border-radius: 8px;
  
  &:hover .add-btn {
    display: block;
  }
`;

export function GridView() {
    const [newItemIndex, setNewItemIndex] = useState(-1); 
  const [items, setItems] = useState([
    { name: 'Item 1', imageUrl: 'https://via.placeholder.com/150' },
    { name: 'Item 2', imageUrl: 'https://via.placeholder.com/150' },
    // Add more sample items as needed
  ]);

  const getRandomString = () => {
    return Math.random().toString(36).substring(7);
  };

  const handleAddItem = (index: number) => {
    const newItem = {
      name: `New Item ${getRandomString()}`,
      imageUrl: 'https://via.placeholder.com/150',
    };
    const newItems = [...items];
    newItems.splice(index + 1, 0, newItem);
    setItems(newItems);
    setNewItemIndex(-1);

    setTimeout(() => {
        setNewItemIndex(index + 1); // Cập nhật index của phần tử mới
    });
  };

  return (
    <Grid>
      {items.map((item: any, index: any) => (
        <GridItemContainer key={index}>
          <GridItem isNew={index === newItemIndex}>
            <div>
                <img src={item.imageUrl} alt={item.name} />
            </div>
            <div>
                <p>
                    {item.name}
                </p>
            </div>
          </GridItem>
          {index < items.length - 1 && (
            <AddButton className='add-btn' onClick={() => handleAddItem(index)}>
              Add
            </AddButton>
          )}
        </GridItemContainer>
      ))}
      <Spacer />
    </Grid>
  );
}
