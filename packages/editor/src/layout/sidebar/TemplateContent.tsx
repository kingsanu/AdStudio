import { FC, useEffect, useState } from 'react';
import axios from 'axios';
import { isMobile } from 'react-device-detect';
import { useEditor } from '@canva/hooks';
import { SerializedPage } from '@canva/types';
import CloseSidebarButton from './CloseButton';
import OutlineButton from '@canva/components/button/OutlineButton';
import TemplateSearchBox from './components/TemplateSearchBox';
interface Template {
  img: string;
  data: string;
}
const TemplateContent: FC<{ onClose: () => void }> = ({ onClose }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { actions, activePage } = useEditor((state) => ({
    activePage: state.activePage,
  }));
  useEffect(() => {
    async function fetchTemplates() {
      const response = await axios.get<Template[]>('/templates');
      setTemplates(response.data);
      setIsLoading(false);
    }

    fetchTemplates();
  }, []);

  const addPage = async (data: SerializedPage) => {
    actions.setPage(activePage, data);
    if (isMobile) {
      onClose();
    }
  };
  return (
    <div css={{padding: '16px'}}>
      <CloseSidebarButton onClose={onClose} />
      <div css={{
        marginBottom: 16
      }}>
        <TemplateSearchBox />
      </div>
      <div
        css={{ flexDirection: 'column', overflowY: 'auto', display: 'flex' }}
      >
        <div
          css={{
            flexGrow: 1,
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
            gridGap: 8,
          }}
        >
          {isLoading && <div>Loading...</div>}
          {templates.map((item, index) => (
            <div
              key={index}
              css={{ cursor: 'pointer' }}
              onClick={() => addPage(JSON.parse(item.data))}
            >
              <img src={item.img} loading='lazy' />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TemplateContent;
