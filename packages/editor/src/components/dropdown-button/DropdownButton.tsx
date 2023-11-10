import { useState, useRef, useEffect, FC } from 'react';
import ArrowRightIcon from '@canva/icons/ArrowRightIcon';
import './DropdownButton.css';

export type DropdownMenuItem = {
  label: string;
  shortcut?: string;
  type?: 'normal' | 'submenu' | 'divider';
  items?: DropdownMenuItem[];
};
interface Props {
  text: string;
  items: DropdownMenuItem[];
}
const DropdownButton: FC<Props> = ({ text, items }) => {
  const [showMenu, setShowMenu] = useState(false);
  const dropdownRef = useRef<any>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setShowMenu(false);
    }
  };

  const handleButtonClick = () => {
    setShowMenu(!showMenu);
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const renderMenuItem = (item: DropdownMenuItem, index: number) => {
    if (item.type === 'divider') {
      return <div key={index} className='menu-divider'></div>;
    }

    return (
      <div
        key={index}
        className={`menu-item ${item.type === 'submenu' ? 'with-submenu' : ''}`}
      >
        <span>{item.label}</span>
        {item.type === 'submenu' && (
          <span className='submenu-arrow'>
            <ArrowRightIcon />
          </span>
        )}
        {item.shortcut && (
          <span className='shortcut'>
            <kbd>{item.shortcut}</kbd>
          </span>
        )}
        {item.items && (
          <div className='submenu'>
            {item.items.map((submenuItem, subIndex) => (
              <div key={subIndex} className='submenu-item'>
                <span>{submenuItem.label}</span>
                {submenuItem.shortcut && (
                  <span className='shortcut'>
                    <kbd>{submenuItem.shortcut}</kbd>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className='dropdown' ref={dropdownRef}>
      <button
        className={`dropdown-button ${showMenu ? 'is-active' : ''}`}
        onClick={handleButtonClick}
      >
        {text}
      </button>
      {showMenu && (
        <div className='dropdown-menu'>
          {items.map((item: DropdownMenuItem, index: number) =>
            renderMenuItem(item, index)
          )}
        </div>
      )}
    </div>
  );
};

export default DropdownButton;
