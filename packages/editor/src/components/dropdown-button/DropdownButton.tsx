import { useState, useRef, useEffect, FC, ReactNode } from 'react';
import ArrowRightIcon from 'canva-editor/icons/ArrowRightIcon';
import './DropdownButton.css';

export type DropdownMenuItem = {
  label: string;
  shortcut?: string;
  action?: (...args: any[]) => void;
  icon?: ReactNode;
  type?: 'normal' | 'submenu' | 'divider' | 'groupname';
  items?: DropdownMenuItem[];
  disabled?: boolean;
  hint?: string;
};
interface Props {
  text: string;
  header?: ReactNode;
  items: DropdownMenuItem[];
}
const DropdownButton: FC<Props> = ({ text, header, items }) => {
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
    } else if (item.type === 'groupname') {
      return (
        <p key={index} className='menu-groupname'>
          {item.label}
        </p>
      );
    }

    const menuItemClassName = `menu-item ${
      item.type === 'submenu' ? 'with-submenu' : ''
    }`;

    return (
      <div key={index} className={menuItemClassName}>
        <button
          disabled={item.disabled}
          onClick={(...args: any[]) => {
            if (item.disabled || !item.action) return;
            item.action(...args);
            setShowMenu(false);
          }}
        >
          {item?.icon}
          <p
            css={{
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: 13,
            }}
          >
            {item.label}
          </p>
          {item.hint && <p className='hint'>{item.hint}</p>}
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
        </button>
        {item.items && (
          <div className='submenu'>
            {item.items.map((submenuItem, subIndex) =>
              renderMenuItem(submenuItem, subIndex)
            )}
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
          {header && (
            <>
              {header}
              <div key={-1} className='menu-divider'></div>
            </>
          )}
          {items.map((item: DropdownMenuItem, index: number) =>
            renderMenuItem(item, index)
          )}
        </div>
      )}
    </div>
  );
};

export default DropdownButton;
