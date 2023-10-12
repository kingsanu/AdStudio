import { FC, PropsWithChildren } from 'react';
import { LayerComponentProps } from '@canva/types';

export interface GroupLayerProps extends LayerComponentProps {
    scale: number;
}

const GroupLayer: FC<PropsWithChildren<GroupLayerProps>> = ({ boxSize, scale, children }) => {
    return (
        <div
            css={{
                transformOrigin: '0 0',
            }}
            style={{
                width: boxSize.width / scale,
                height: boxSize.height / scale,
                transform: `scale(${scale})`,
            }}
        >
            {children}
        </div>
    );
};

export default GroupLayer;
