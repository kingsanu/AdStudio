import React, { forwardRef, ForwardRefRenderFunction, useEffect, useMemo, useRef } from 'react';
import reverse from 'lodash/reverse';
import Sidebar, { SidebarProps } from './Sidebar';
import ReverseTransformLayer from './layer/ReverseTransformLayer';
import { useEditor, useSelectedLayers } from '@canva/hooks';
import { getPosition } from '@canva/utils';
import { PageContext } from '@canva/layers/core/PageContext';
import { isGroupLayer } from '@canva/utils/layer/layers';
import ArrowLeftIcon from '@canva/icons/ArrowLeftIcon';
import MoreVertIcon from '@canva/icons/MoreVertIcon';
import MoreHorizIcon from '@canva/icons/MoreHorizIcon';
import GroupingIcon from '@canva/icons/GroupingIcon';
import BackgroundSelectionIcon from '@canva/icons/BackgroundSelectionIcon';
import styled from '@emotion/styled';
import { Layer, LayerComponentProps } from '@canva/types';
import DragAndDrop from '@canva/drag-and-drop/DD';

const LayerItem = styled('div')`
    background: #F6F6F6;
    border-radius: 8px;
    padding: 8px;
    cursor: pointer;
    position: relative;
    border-width: 2px;
    border-style: solid;

    .drag-icon: {
        font-size: 24px;
        width: 40px;
        height: 40px;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-shrink: 0;
    }

    .more-btn {
        display: none;
        position: absolute;
        right: 4px;
        top: 4px;
        background: #5E6278;
        border-radius: 8px;
        color: #fff;
        padding: 0 6px;
    }
    :hover .more-btn {
        display: block;
    }
`;

type LayerSidebarProps = SidebarProps;
const LayerSidebar: ForwardRefRenderFunction<HTMLDivElement, LayerSidebarProps> = ({ ...props }, ref) => {
    const dataRef = useRef({ isMultipleSelect: false });
    const { selectedLayerIds } = useSelectedLayers();
    const { layers, actions, activePage } = useEditor((state) => ({
        layers: state.pages[state.activePage] && state.pages[state.activePage].layers,
        activePage: state.activePage,
    }));
    const layerList = useMemo(() => {
        if (!layers) {
            return;
        }
        return reverse(layers['ROOT'].data.child.map((layerId, order) => ({order, ...layers[layerId]})));
    }, [layers]);
    console.log(layerList)
    const rootLayer = useMemo(() => {
        if (!layers) {
            return;
        }
        return layers.ROOT;
    }, [layers]);

    const handleClickOption = (e: React.MouseEvent) => {
        actions.showContextMenu(getPosition(e.nativeEvent));
    };
    useEffect(() => {
        const enableMultipleSelect = (e: KeyboardEvent) => {
            dataRef.current.isMultipleSelect = e.shiftKey;
        };
        window.addEventListener('keydown', enableMultipleSelect);
        window.addEventListener('keyup', enableMultipleSelect);
        return () => {
            window.removeEventListener('keydown', enableMultipleSelect);
            window.removeEventListener('keyup', enableMultipleSelect);
        };
    }, []);

    const itemRenderer = (layer: Layer<LayerComponentProps>, index: number): JSX.Element => {
		return (
			<LayerItem className="item"
                                    key={layer.id}
                                    css={{
                                        borderColor: selectedLayerIds.includes(layer.id) ? '#3d8eff' : 'transparent',
                                    }}
                                    onMouseDown={() => {
                                        actions.selectLayers(
                                            activePage,
                                            layer.id,
                                            dataRef.current.isMultipleSelect ? 'add' : 'replace',
                                        );
                                    }}
                                >
                                    <div
                                        css={{
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <div
                                            className='drag-icon'
                                        >
                                            <MoreVertIcon />
                                        </div>
                                        <div css={{ minWidth: 0, flexGrow: 1 }}>
                                            <ReverseTransformLayer layer={layer} />
                                        </div>
                                        {isGroupLayer(layer) && (
                                            <div css={{ flexShrink: 0, fontSize: 24 }}>
                                                <GroupingIcon />
                                            </div>
                                        )}
                                    </div>
                                    <div
                                        className='more-btn'
                                        onClick={handleClickOption}
                                    >
                                        <MoreHorizIcon style={{ width: 16, height: 16 }} />
                                    </div>
                                </LayerItem>
		);
	}

    const handleDDChange = (reorderedItems: Array<Layer<LayerComponentProps>>) => {
		// console.log('Example.handleRLDDChange');
        console.log(reorderedItems)
	}
    return (
        <Sidebar {...props}>
            <PageContext.Provider value={{ pageIndex: activePage }}>
                <div
                    css={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}
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
                            Layers
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
                            onClick={() => {
                                actions.setSidebar();
                            }}
                        >
                            <ArrowLeftIcon />
                        </div>
                    </div>

                    <div
                        ref={ref}
                        css={{
                            flexGrow: 1,
                            overflowY: 'auto',
                        }}
                    >
                        <div
                            css={{
                                display: 'grid',
                                gridTemplateColumns: 'minmax(0,1fr)',
                                gridRowGap: 8,
                                padding: 16,
                            }}
                        >
                            <DragAndDrop
                            cssClasses="list-container"
                            items={layerList}
                            itemRenderer={itemRenderer}
                            onChange={handleDDChange}
                            />
                            {/* {(layerList || []).map((layer) => (
                                <LayerItem
                                    key={layer.id}
                                    css={{
                                        borderColor: selectedLayerIds.includes(layer.id) ? '#3d8eff' : 'transparent',
                                    }}
                                    onMouseDown={() => {
                                        actions.selectLayers(
                                            activePage,
                                            layer.id,
                                            dataRef.current.isMultipleSelect ? 'add' : 'replace',
                                        );
                                    }}
                                >
                                    <div
                                        css={{
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <div
                                            className='drag-icon'
                                        >
                                            <MoreVertIcon />
                                        </div>
                                        <div css={{ minWidth: 0, flexGrow: 1 }}>
                                            <ReverseTransformLayer layer={layer} />
                                        </div>
                                        {isGroupLayer(layer) && (
                                            <div css={{ flexShrink: 0, fontSize: 24 }}>
                                                <GroupingIcon />
                                            </div>
                                        )}
                                    </div>
                                    <div
                                        className='more-btn'
                                        onClick={handleClickOption}
                                    >
                                        <MoreHorizIcon style={{ width: 16, height: 16 }} />
                                    </div>
                                </LayerItem>
                            ))} */}
                            {rootLayer && (
                                <div
                                    css={{
                                        background: '#F6F6F6',
                                        borderRadius: 8,
                                        padding: 8,
                                        cursor: 'pointer',
                                        position: 'relative',
                                        borderWidth: 2,
                                        borderStyle: 'solid',
                                        borderColor: selectedLayerIds.includes(rootLayer.id)
                                            ? '#3d8eff'
                                            : 'transparent',
                                    }}
                                    onMouseDown={() => {
                                        actions.selectLayers(
                                            activePage,
                                            rootLayer.id,
                                            dataRef.current.isMultipleSelect ? 'add' : 'replace',
                                        );
                                    }}
                                >
                                    <div
                                        css={{
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <div
                                            css={{
                                                width: 40,
                                                height: 40,
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                flexShrink: 0,
                                            }}
                                        ></div>
                                        <div css={{ minWidth: 0, flexGrow: 1 }}>
                                            <ReverseTransformLayer layer={rootLayer} hiddenChild={true} />
                                        </div>

                                        <div css={{ flexShrink: 0, fontSize: 24 }}>
                                            <BackgroundSelectionIcon />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </PageContext.Provider>
        </Sidebar>
    );
};

export default forwardRef<HTMLDivElement, LayerSidebarProps>(LayerSidebar);
