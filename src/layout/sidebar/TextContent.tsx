import { FC, useEffect, useState } from 'react';
import axios from 'axios';
import { getThumbnail } from '../../utils/thumbnail';
import XIcon from '@duyank/icons/regular/X';
import { isMobile } from 'react-device-detect';
import { useEditor } from '@canva/hooks';
import { LayerId, SerializedLayers } from '@canva/types';

interface Text {
    img: string;
    data: string;
}
const TextContent: FC<{ onClose: () => void }> = ({ onClose }) => {
    const { actions } = useEditor();
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
    const handleAddText = (data: { rootId: LayerId; layers: SerializedLayers }) => {
        actions.addLayerTree(data);
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
                    <XIcon />
                </div>
            </div>
            <div css={{ flexDirection: 'column', overflowY: 'auto', display: 'flex' }}>
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
                    {texts.map(({ img, data }, idx) => (
                        <div
                            key={idx}
                            css={{ cursor: 'pointer', position: 'relative', paddingBottom: '100%', width: '100%' }}
                            onClick={() => handleAddText(JSON.parse(data))}
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
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TextContent;
