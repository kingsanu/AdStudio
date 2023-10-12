import React, { FC, useMemo } from 'react';
import ColorSettings from './ColorSettings';
import { useEditor } from '../hooks';
import { Layer } from '@lidojs/editor';
import { GradientStyle } from '@lidojs/core';
import { RootLayerProps } from '../layers/RootLayer';

interface RootSettingsProps {
    layer: Layer<RootLayerProps>;
}
const RootSettings: FC<RootSettingsProps> = ({ layer }) => {
    const { actions, activePage } = useEditor((state) => ({
        activePage: state.activePage,
        sidebar: state.sidebar,
    }));
    const color = useMemo(() => {
        return layer.data.props.color;
    }, [layer]);
    const gradient = useMemo(() => {
        return layer.data.props.gradientBackground;
    }, [layer]);
    const updateColor = (color: string) => {
        actions.history.throttle(2000).setProp<RootLayerProps>(activePage, layer.id, {
            color,
            gradientBackground: null,
        });
    };

    const handleChangeGradient = (data: { colors: string[]; style: GradientStyle }) => {
        actions.history.throttle(2000).setProp<RootLayerProps>(activePage, layer.id, {
            gradientBackground: data,
            color: null,
        });
    };
    return (
        <ColorSettings
            colors={color ? [color] : []}
            gradient={gradient}
            useGradient={true}
            onChange={updateColor}
            onChangeGradient={handleChangeGradient}
        />
    );
};

export default RootSettings;
