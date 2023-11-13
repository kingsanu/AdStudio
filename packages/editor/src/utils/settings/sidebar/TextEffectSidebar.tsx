import React, { forwardRef, ForwardRefRenderFunction, Fragment, useContext, useMemo, useRef, useState } from 'react';
import Sidebar, { SidebarProps } from './Sidebar';
import { cloneDeep, throttle } from 'lodash';
import { ColorIcon, ColorPicker } from '@canva/color-picker';
import { EditorContext } from '@canva/components/editor/EditorContext';
import Popover from '@canva/components/popover/Popover';
import Slider from '@canva/components/slider/Slider';
import { useSelectedLayers, useEditor } from '@canva/hooks';
import { TextLayerProps } from '@canva/layers/TextLayer';
import { Layer } from '@canva/types';
import { isTextLayer } from '@canva/utils/layer/layers';
import { ColorParser, hex2rgbString } from '@canva/color-picker/utils';

const getEffectList = (assetPath: string) => [
    {
        value: 'none',
        img: `${assetPath}/text/effects/none.png`,
    },
    {
        value: 'shadow',
        img: `${assetPath}/text/effects/shadow.png`,
        settings: {
            offset: 50,
            direction: 45,
            blur: 0,
            transparency: 40,
            color: '#000000',
        },
    },
    {
        value: 'lift',
        img: `${assetPath}/text/effects/lift.png`,
        settings: {
            intensity: 50,
        },
    },
    {
        value: 'hollow',
        img: `${assetPath}/text/effects/hollow.png`,
        settings: {
            thickness: 50,
        },
    },
    {
        value: 'splice',
        img: `${assetPath}/text/effects/splice.png`,
        settings: {
            thickness: 50,
            offset: 50,
            direction: 45,
            color: '#000000',
        },
    },
    {
        value: 'echo',
        img: `${assetPath}/text/effects/echo.png`,
        settings: {
            offset: 50,
            direction: 45,
            color: '#000000',
        },
    },
    {
        value: 'neon',
        img: `${assetPath}/text/effects/echo.png`,
        settings: {
            intensity: 50
        },
    },
    {
        value: 'glitch',
        img: `${assetPath}/text/effects/echo.png`,
        settings: {
            offset: 30,
            direction: 90,
            color: '#000000',
        },
    },
    {
        value: 'outline',
        img: `${assetPath}/text/effects/echo.png`,
        settings: {
            thickness: 50,
            color: '#000000',
        },
    },
];

type TextEffectSidebarProps = SidebarProps;
const TextEffectSidebar: ForwardRefRenderFunction<HTMLDivElement, TextEffectSidebarProps> = ({ ...props }, ref) => {
    const {
        config: { assetPath },
    } = useContext(EditorContext);
    const addColorRef = useRef<HTMLDivElement>(null);
    const effectUsingColor: string[] = ['shadow', 'lift', 'splice', 'echo'];
    const [openColorPicker, setOpenColorPicker] = useState(false);
    const { selectedLayers } = useSelectedLayers();
    const { actions, activePage } = useEditor((state) => ({
        activePage: state.activePage,
    }));
    const textLayers = selectedLayers.filter((layer) => isTextLayer(layer)) as unknown as Layer<TextLayerProps>[];

    const { effect, settings } = useMemo(() => {
        return textLayers.reduce(
            (acc, layer) => {
                const props = layer.data.props as TextLayerProps;
                if (props.effect) {
                    if (props.effect.name === acc.effect || (props.effect.name && acc.effect === 'none')) {
                        acc.effect = props.effect.name;
                        acc.settings = props.effect.settings;
                    } else {
                        acc.effect = 'none';
                        acc.settings = {};
                    }
                }
                return acc;
            },
            { effect: 'none', settings: {} },
        );
    }, [textLayers]);

    const handleSetEffect = (effect: string) => {
        actions.history.new();
        textLayers.forEach(
            ({
                id,
                data: {
                    props: { colors },
                },
            }) => {
                if (effect === 'none') {
                    actions.setProp<TextLayerProps>(activePage, id, {
                        effect: null,
                    });
                } else {
                    const settings = cloneDeep(
                        getEffectList(assetPath).find((e) => e.value === effect)?.settings as Record<string, unknown>,
                    );
                    if (colors.length > 0) {
                        const c = new ColorParser(colors[0]);
                        if (c.white() > 50) {
                            settings.color = c.darken(0.5).toRgbString();
                        } else {
                            settings.color = c.whiten(0.5).toRgbString();
                        }
                    }
                    actions.history.merge().setProp<TextLayerProps>(
                        activePage,
                        id,
                        {
                            effect: {
                                name: effect,
                                settings,
                            },
                        },
                        (objVal, srcVal) => {
                            if (srcVal) {
                                return srcVal;
                            }
                        },
                    );
                }
            },
        );
    };
    const handleChangeSetting = throttle((key: string, value: number | string) => {
        const layerIds = textLayers.map((l) => l.id);
        actions.history.throttle(2000).setProp<TextLayerProps>(activePage, layerIds, {
            effect: {
                settings: {
                    [key]: value,
                },
            },
        });
    }, 16);
    return (
        <Sidebar ref={ref} {...props}>
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
                    Effects
                </p>
            </div>
            <div css={{ padding: '24px 16px' }}>
                <p css={{marginBottom: 24}}>Style</p>
                <div
                    css={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
                        gap: 12,
                        fontSize: 10,
                    }}
                >
                    {getEffectList(assetPath).map((ef) => (
                        <div key={ef.value}>
                            <div
                                css={{ cursor: 'pointer', position: 'relative' }}
                                onClick={() => handleSetEffect(ef.value)}
                            >
                                <div css={{ paddingBottom: '100%', width: '100%' }} />
                                <img
                                    src={ef.img}
                                    css={{
                                        width: '100%',
                                        height: '100%',
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        borderRadius: 4,
                                        boxShadow:
                                            ef.value === effect
                                                ? '0 0 0 2px #3d8eff,inset 0 0 0 2px #fff'
                                                : '0 0 0 1px rgba(43,59,74,.3)',
                                        ':hover': {
                                            boxShadow: '00 0 0 2px #3d8eff,inset 0 0 0 2px #fff',
                                        },
                                    }}
                                />
                            </div>
                            <div
                                css={{
                                    textAlign: 'center',
                                    marginTop: 4,
                                    lineHeight: '20px',
                                    textTransform: 'capitalize',
                                }}
                            >
                                {ef.value}
                            </div>
                        </div>
                    ))}
                    {settings && (
                        <div
                            css={{
                                gridRow: `${
                                    Math.ceil((1 + getEffectList(assetPath).findIndex((e) => e.value === effect)) / 3) +
                                    1
                                } / auto`,
                                gridColumn: '1/-1',
                                padding: '8px 0',
                            }}
                        >
                            <div
                                css={{
                                    display: 'grid',
                                    rowGap: 8,
                                }}
                            >
                                {Object.entries(settings).map(([settingKey, value]) => (
                                    <Fragment key={settingKey}>
                                        {settingKey !== 'color' && (
                                            <Slider
                                                label={settingKey}
                                                min={settingKey === 'direction' ? -180 : 0}
                                                max={settingKey === 'direction' ? 180 : 100}
                                                defaultValue={value as number}
                                                onChange={(value) => {
                                                    handleChangeSetting(settingKey, value);
                                                }}
                                            />
                                        )}
                                        {settingKey === 'color' && effectUsingColor.includes(effect) && (
                                            <div css={{ display: 'flex', alignItems: 'center' }}>
                                                <div
                                                    css={{
                                                        flexGrow: 1,
                                                        fontSize: 14,
                                                        textTransform: 'capitalize',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    Color
                                                </div>
                                                <div ref={addColorRef} css={{ width: 32, height: 32 }}>
                                                    <ColorIcon
                                                        color={value as string}
                                                        selected={null}
                                                        onClick={() => setOpenColorPicker(true)}
                                                    />
                                                </div>
                                                <Popover
                                                    open={openColorPicker}
                                                    anchorEl={addColorRef.current}
                                                    placement={'bottom-end'}
                                                    onClose={() => setOpenColorPicker(false)}
                                                >
                                                    <div css={{ padding: 16, width: 280 }}>
                                                        <ColorPicker
                                                            color={new ColorParser((value as string) || '#f25022').toHex()}
                                                            onChange={(color) => {
                                                                handleChangeSetting(settingKey, hex2rgbString(color));
                                                            }}
                                                        />
                                                    </div>
                                                </Popover>
                                            </div>
                                        )}
                                    </Fragment>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Sidebar>
    );
};

export default forwardRef<HTMLDivElement, TextEffectSidebarProps>(TextEffectSidebar);
