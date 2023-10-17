import { FC } from 'react';
import { useEditor } from '@canva/hooks';
import Page from '@canva/components/editor/Page';
import ArrowLeftIcon from '@canva/icons/ArrowLeftIcon';
import PlusIcon from '@canva/icons/PlusIcon';

interface PageSettingsProps {}
const PageSettings: FC<PageSettingsProps> = () => {
    const { actions, pages, pageSize } = useEditor((state) => {
        return {
            pages: state.pages,
            pageSize: state.pageSize,
        };
    });
    const contentWidth = window.innerWidth / 2 - 24 * 1.5 - 3 * 2;
    const scale = contentWidth / pageSize.width;
    const handleChangePage = (pageIndex: number) => {
        actions.setActivePage(pageIndex);
    };
    return (
        <div
            css={{
                top: 0,
                left: 0,
                height: 'calc(100% - 40px)',
                position: 'absolute',
                background: '#fff',
                zIndex: 2050,
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
                    Pages
                </p>
                <div
                    css={{
                        '@media (max-width: 900px)': {
                            pointerEvents: 'auto',
                            display: 'flex',
                            position: 'absolute',
                            bottom: 24,
                            left: 24,
                            background: '#3d8eff',
                            width: 48,
                            height: 48,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            color: '#fff',
                            fontSize: 24,
                        },
                    }}
                    onClick={() => {
                        actions.addPage();
                    }}
                >
                    <PlusIcon />
                </div>
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
                    onClick={() => actions.togglePageSettings()}
                >
                    <ArrowLeftIcon />
                </div>
            </div>
            <div
                css={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
                    gridGap: 24,
                    padding: 24,
                }}
            >
                {pages.map((page, index) => (
                    <div key={index} css={{ position: 'relative' }}>
                        <div
                            css={{
                                position: 'relative',
                                width: pageSize.width * scale + 6,
                                height: pageSize.height * scale + 6,
                                border: '3px solid #fff',
                                boxShadow: '0 0 0 1px rgba(64,87,109,.07),0 2px 8px rgba(57,76,96,.15)',
                                borderRadius: 8,
                            }}
                        >
                            <Page
                                pageIndex={index}
                                width={pageSize.width}
                                height={pageSize.height}
                                scale={scale}
                                isActive={true}
                            />
                        </div>
                        <p css={{ fontSize: 14, fontWeight: 700, textAlign: 'center', lineHeight: 2 }}>{index + 1}</p>
                        <div css={{ position: 'absolute', inset: 0 }} onClick={() => handleChangePage(index)} />
                    </div>
                ))}
            </div>
        </div>
    );
};
export default PageSettings;
