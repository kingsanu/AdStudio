import { ElementType } from 'react';
import ShapeLayer from '@canva/layers/ShapeLayer';
import TextLayer from '@canva/layers/TextLayer';
import ImageLayer from '@canva/layers/ImageLayer';
import GroupLayer from '@canva/layers/GroupLayer';
import RootLayer from '@canva/layers/RootLayer';

export const resolvers: Record<string, ElementType> = {
    RootLayer,
    ShapeLayer,
    TextLayer,
    ImageLayer,
    GroupLayer,
};
