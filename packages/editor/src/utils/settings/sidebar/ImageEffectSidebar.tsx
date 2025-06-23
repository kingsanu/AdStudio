import React, {
  forwardRef,
  ForwardRefRenderFunction,
  useContext,
  useMemo,
  useState,
} from 'react';
import Sidebar, { SidebarProps } from './Sidebar';
import { throttle } from 'lodash';
import { EditorContext } from 'canva-editor/components/editor/EditorContext';
import Slider from 'canva-editor/components/slider/Slider';
import { useSelectedLayers, useEditor } from 'canva-editor/hooks';
import { ImageLayerProps } from 'canva-editor/layers/ImageLayer';
import { Layer, ImageEffectSettings } from 'canva-editor/types';
import { isImageLayer } from 'canva-editor/utils/layer/layers';
import CloseIcon from 'canva-editor/icons/CloseIcon';
import useMobileDetect from 'canva-editor/hooks/useMobileDetect';
import { REMOVE_BACKGROUND_ENDPOINT } from 'canva-editor/utils/constants/api';
import { toast } from 'sonner';
import axios from 'axios';

const getPresetList = () => [
  {
    value: 'none',
    name: 'Original',
    icon: '✨',
    settings: {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hue: 0,
      sepia: 0,
      grayscale: 0,
      invert: 0,
      borderRadius: 0,
      borderWidth: 0,
    },
  },
  {
    value: 'vintage',
    name: 'Vintage',
    icon: '📸',
    settings: {
      sepia: 30,
      contrast: 120,
      brightness: 90,
      saturation: 80,
    },
  },
  {
    value: 'dramatic',
    name: 'Dramatic',
    icon: '🎭',
    settings: {
      contrast: 150,
      brightness: 80,
      saturation: 120,
    },
  },
  {
    value: 'warm',
    name: 'Warm',
    icon: '☀️',
    settings: {
      brightness: 110,
      saturation: 110,
      hue: 10,
    },
  },
  {
    value: 'cool',
    name: 'Cool',
    icon: '❄️',
    settings: {
      brightness: 95,
      saturation: 105,
      hue: -10,
    },
  },
  {
    value: 'blackwhite',
    name: 'B&W',
    icon: '⚫',
    settings: {
      grayscale: 100,
      contrast: 110,
    },
  },
  {
    value: 'neon',
    name: 'Neon',
    icon: '💫',
    settings: {
      contrast: 140,
      saturation: 150,
      brightness: 105,
    },
  },
  {
    value: 'soft',
    name: 'Soft',
    icon: '🌸',
    settings: {
      brightness: 105,
      contrast: 85,
      saturation: 90,
    },
  },
];

interface ImageEffectSidebarProps extends SidebarProps {}

const ImageEffectSidebar: ForwardRefRenderFunction<
  HTMLDivElement,
  ImageEffectSidebarProps
> = (props, ref) => {
  const isMobile = useMobileDetect();
  const [isProcessing, setIsProcessing] = useState(false);
  const { config: { apis } } = useContext(EditorContext);
  const { selectedLayers } = useSelectedLayers();
  const { actions, activePage } = useEditor((state) => ({
    activePage: state.activePage,
  }));

  // Get image layers only
  const imageLayers = useMemo(() => {
    return selectedLayers.filter((layer) => isImageLayer(layer)) as Array<
      Layer<ImageLayerProps>
    >;
  }, [selectedLayers]);

  // Get current values from the first selected image layer
  const currentValues = useMemo(() => {
    if (imageLayers.length === 0) {
      return {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        hue: 0,
        blur: 0,
        backdropBlur: 0,
        borderRadius: 0,
        sepia: 0,
        grayscale: 0,
        invert: 0,
        borderWidth: 0,
        borderColor: '#000000',
        borderStyle: 'solid' as const,
      };
    }

    const layer = imageLayers[0];
    const effects = layer.data.props.imageEffects || {};
    
    return {
      brightness: effects.brightness ?? 100,
      contrast: effects.contrast ?? 100,
      saturation: effects.saturation ?? 100,
      hue: effects.hue ?? 0,
      blur: layer.data.props.blur ?? 0,
      backdropBlur: layer.data.props.backdropBlur ?? 0,
      borderRadius: effects.borderRadius ?? 0,
      sepia: effects.sepia ?? 0,
      grayscale: effects.grayscale ?? 0,
      invert: effects.invert ?? 0,
      borderWidth: effects.borderWidth ?? 0,
      borderColor: effects.borderColor ?? '#000000',
      borderStyle: effects.borderStyle ?? 'solid',
    };
  }, [imageLayers]);

  const {
    brightness,
    contrast,
    saturation,
    hue,
    blur,
    backdropBlur,
    borderRadius,
    sepia,
    grayscale,
    invert,
    borderWidth,
    borderColor,
    borderStyle,
  } = currentValues;
  const handleSetPreset = (presetSettings: Partial<ImageEffectSettings>) => {
    actions.history.new();
    imageLayers.forEach(({ id, data }) => {
      const currentImageEffects = data.props.imageEffects || {};
      const originalUrl = currentImageEffects.originalImageUrl;
      
      // If this is the "Original" preset (empty settings), restore the original image URL
      if (Object.keys(presetSettings).length === 0 && originalUrl) {
        actions.setProp<ImageLayerProps>(activePage, id, {
          image: {
            ...data.props.image,
            url: originalUrl,
          },
          imageEffects: {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            hue: 0,
            sepia: 0,
            grayscale: 0,
            invert: 0,
            borderRadius: 0,
            borderWidth: 0,
            borderColor: '#000000',
            borderStyle: 'solid',
            // Clear the original URL since we've restored it
            originalImageUrl: undefined,
          },
          blur: 0,
          backdropBlur: 0,
        });
      } else {
        // Reset all effects first, then apply preset
        actions.setProp<ImageLayerProps>(activePage, id, {
          imageEffects: {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            hue: 0,
            sepia: 0,
            grayscale: 0,
            invert: 0,
            borderRadius: 0,
            borderWidth: 0,
            borderColor: '#000000',
            borderStyle: 'solid',
            // Preserve original URL if it exists
            originalImageUrl: currentImageEffects.originalImageUrl,
            ...presetSettings,
          },
          blur: 0,
          backdropBlur: 0,
        });
      }
    });
    toast.success(`Applied ${Object.keys(presetSettings).length > 0 ? 'preset filter' : 'original'} effect`);
  };

  const handleChangeSetting = throttle(
    (key: keyof ImageEffectSettings | 'blur' | 'backdropBlur', value: number | string) => {
      const layerIds = imageLayers.map((l) => l.id);
      
      if (key === 'blur' || key === 'backdropBlur') {
        // Handle blur and backdropBlur as regular layer properties
        actions.history
          .throttle(2000)
          .setProp<ImageLayerProps>(activePage, layerIds, {
            [key]: value,
          });
      } else {
        // Handle image-specific effects
        actions.history
          .throttle(2000)
          .setProp<ImageLayerProps>(activePage, layerIds, {
            imageEffects: {
              [key]: value,
            },
          });
      }
    },
    16
  );
  const handleRemoveBackground = async () => {
    if (imageLayers.length === 0) return;
    
    setIsProcessing(true);
    try {
      for (const layer of imageLayers) {
        const imageUrl = layer.data.props.image.url;
        const currentImageEffects = layer.data.props.imageEffects || {};
        
        const formData = new FormData();
        
        // Fetch the image and create a blob
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        formData.append('image', blob, 'image.jpg');
        
        const result = await axios.post(
          `${apis.url}${REMOVE_BACKGROUND_ENDPOINT}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            timeout: 30000,
          }
        );
        
        if (result.data.success) {
          actions.history.new();
          actions.setProp<ImageLayerProps>(activePage, layer.id, {
            image: {
              ...layer.data.props.image,
              url: result.data.processedImageUrl,
            },
            imageEffects: {
              ...currentImageEffects,
              // Store the original URL if not already stored
              originalImageUrl: currentImageEffects.originalImageUrl || imageUrl,
            },
          });
          toast.success('Background removed successfully');
        } else {
          toast.error('Failed to remove background');
        }
      }
    } catch (error) {
      console.error('Error removing background:', error);
      toast.error('Failed to remove background');
    } finally {
      setIsProcessing(false);
    }
  };
  const resetEffects = () => {
    actions.history.new();
    imageLayers.forEach(({ id, data }) => {
      const currentImageEffects = data.props.imageEffects || {};
      const originalUrl = currentImageEffects.originalImageUrl;
      
      // If we have an original URL, restore the original image
      if (originalUrl) {
        actions.setProp<ImageLayerProps>(activePage, id, {
          image: {
            ...data.props.image,
            url: originalUrl,
          },
          imageEffects: {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            hue: 0,
            sepia: 0,
            grayscale: 0,
            invert: 0,
            borderRadius: 0,
            borderWidth: 0,
            borderColor: '#000000',
            borderStyle: 'solid',
            // Clear the original URL since we've restored it
            originalImageUrl: undefined,
          },
          blur: 0,
          backdropBlur: 0,
        });
      } else {
        // Just reset effects if no original URL is stored
        actions.setProp<ImageLayerProps>(activePage, id, {
          imageEffects: {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            hue: 0,
            sepia: 0,
            grayscale: 0,
            invert: 0,
            borderRadius: 0,
            borderWidth: 0,
            borderColor: '#000000',
            borderStyle: 'solid',
          },
          blur: 0,
          backdropBlur: 0,
        });
      }
    });
    toast.success('All effects reset to original');
  };
  // Modern color palette and design constants
  const COLORS = {
    background: {
      primary: 'rgba(255, 255, 255, 0.95)',
      secondary: 'rgba(248, 250, 252, 0.9)',
      muted: 'rgba(241, 245, 249, 0.8)',
    },
    gradient: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      cool: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
      warm: 'linear-gradient(135deg, #fd79a8 0%, #e84393 100%)',
      success: 'linear-gradient(135deg, #00b894 0%, #00a085 100%)',
    },
    border: 'rgba(226, 232, 240, 0.6)',
    shadow: 'rgba(0, 0, 0, 0.06)',
  };  // Modern Slider wrapper component for enhanced styling
  const ModernSlider = ({ label, ...props }: { 
    label: string; 
    min?: number;
    max?: number;
    defaultValue?: number;
    onChange?: (value: number) => void;
  }) => (
    <div css={{
      padding: '4px 0',
      '& > div': {
        // Override slider label styling
        '& > div:first-of-type': {
          fontSize: '13px',
          fontWeight: 600,
          color: '#374151',
          textTransform: 'none',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        // Override slider track styling
        '& > div:last-of-type': {
          '& > div:first-of-type': {
            backgroundColor: 'rgba(203, 213, 225, 0.6)',
            height: '6px',
            borderRadius: '6px',
          },
          // Override slider fill styling
          '& > div:last-of-type > div': {
            height: '6px',
            borderRadius: '6px',
            background: COLORS.gradient.primary,
            '& > div': {
              width: '20px',
              height: '20px',
              transform: 'translate(-50%, -35%)',
              background: '#ffffff',
              border: '2px solid #667eea',
              borderRadius: '50%',
              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translate(-50%, -35%) scale(1.1)',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
              },
              '& > div:first-of-type': {
                border: 'none',
                background: 'transparent',
              },
              '& > div:last-of-type': {
                boxShadow: 'none',
                background: 'transparent',
              },
            },
          },
        },
      },
    }}>
      <Slider label={label} {...props} />
    </div>
  );

  return (
    <Sidebar ref={ref} {...props}>
      {/* Modern Header */}
      <div
        css={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px',
          borderBottom: `1px solid ${COLORS.border}`,
          background: COLORS.gradient.primary,
          backdropFilter: 'blur(20px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div>
          <h2
            css={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#ffffff',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            🎨 Image Effects
          </h2>
          <p
            css={{
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.8)',
              margin: '4px 0 0 0',
            }}
          >
            Transform your images with filters and effects
          </p>
        </div>
        {isMobile && (
          <div
            css={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.2)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.3)',
                transform: 'scale(1.05)',
              },
            }}
            onClick={() => actions.setSidebar()}
          >
            <CloseIcon />
          </div>
        )}
      </div>

      <div
        css={{
          padding: '24px', 
          background: COLORS.background.primary,
          minHeight: 'calc(100vh - 80px)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Quick Actions */}
        <div css={{ marginBottom: '32px' }}>
          <div css={{ 
            display: 'flex', 
            gap: '12px', 
            marginBottom: '20px',
          }}>
            <button
              css={{
                flex: 1,
                padding: '14px 18px',
                background: COLORS.gradient.cool,
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 700,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                boxShadow: `0 8px 25px ${COLORS.shadow}`,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 35px rgba(116, 185, 255, 0.3)',
                },
              }}
              onClick={resetEffects}
            >
              ✨ Reset All
            </button>
            
            <button
              css={{
                flex: 1,
                padding: '14px 18px',
                background: isProcessing 
                  ? COLORS.background.muted
                  : COLORS.gradient.warm,
                border: 'none',
                borderRadius: '16px',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 700,
                color: isProcessing ? '#64748b' : '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: isProcessing ? 0.6 : 1,
                transition: 'all 0.3s ease',
                boxShadow: `0 8px 25px ${COLORS.shadow}`,
                '&:hover': {
                  transform: isProcessing ? 'none' : 'translateY(-2px)',
                  boxShadow: isProcessing ? 'none' : '0 12px 35px rgba(253, 121, 168, 0.3)',
                },
              }}
              onClick={isProcessing ? undefined : handleRemoveBackground}
              disabled={isProcessing}
            >
              🎯 {isProcessing ? 'Processing...' : 'Remove BG'}
            </button>
          </div>
        </div>

        {/* Filter Presets */}
        <div css={{ marginBottom: '36px' }}>
          <h3
            css={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#1e293b',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            🎨 Quick Filters
          </h3>
          
          <div
            css={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
              gap: '16px',
            }}
          >
            {getPresetList().map((preset) => (
              <button
                key={preset.value}
                css={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '20px 12px',
                  background: COLORS.background.primary,
                  border: `2px solid ${COLORS.border}`,
                  borderRadius: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  backdropFilter: 'blur(10px)',
                  boxShadow: `0 4px 15px ${COLORS.shadow}`,
                  '&:hover': {
                    border: '2px solid #667eea',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 35px rgba(102, 126, 234, 0.2)',
                    background: 'rgba(255, 255, 255, 1)',
                  },
                  '&:before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: COLORS.gradient.primary,
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                  },
                  '&:hover:before': {
                    opacity: 0.05,
                  },
                }}
                onClick={() => handleSetPreset(preset.settings)}
              >
                <div
                  css={{
                    fontSize: '28px',
                    marginBottom: '10px',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {preset.icon}
                </div>
                <span
                  css={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#475569',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {preset.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Color Adjustments */}
        <div css={{ marginBottom: '36px' }}>
          <h3
            css={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#1e293b',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            🌈 Color Adjustments
          </h3>
            <div css={{ 
            display: 'grid', 
            gap: '24px',
            padding: '20px',
            background: COLORS.background.secondary,
            borderRadius: '20px',
            border: `1px solid ${COLORS.border}`,
          }}>            <ModernSlider
              label="Brightness"
              min={0}
              max={200}
              defaultValue={brightness}
              onChange={(value: number) => handleChangeSetting('brightness', value)}
            />
            <ModernSlider
              label="Contrast"
              min={0}
              max={200}
              defaultValue={contrast}
              onChange={(value: number) => handleChangeSetting('contrast', value)}
            />
            <ModernSlider
              label="Saturation"
              min={0}
              max={200}
              defaultValue={saturation}
              onChange={(value: number) => handleChangeSetting('saturation', value)}
            />
            <ModernSlider
              label="Hue"
              min={-180}
              max={180}
              defaultValue={hue}
              onChange={(value: number) => handleChangeSetting('hue', value)}
            />
          </div>
        </div>

        {/* Style Effects */}
        <div css={{ marginBottom: '36px' }}>
          <h3
            css={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#1e293b',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            ✨ Style Effects
          </h3>
            <div css={{ 
            display: 'grid', 
            gap: '24px',
            padding: '20px',
            background: COLORS.background.secondary,
            borderRadius: '20px',
            border: `1px solid ${COLORS.border}`,
          }}>            <ModernSlider
              label="Blur"
              min={0}
              max={10}
              defaultValue={blur}
              onChange={(value: number) => handleChangeSetting('blur', value)}
            />
            <ModernSlider
              label="Backdrop Blur"
              min={0}
              max={10}
              defaultValue={backdropBlur}
              onChange={(value: number) => handleChangeSetting('backdropBlur', value)}
            />
            <ModernSlider
              label="Border Radius (%)"
              min={0}
              max={50}
              defaultValue={borderRadius}
              onChange={(value: number) => handleChangeSetting('borderRadius', value)}
            />
            <ModernSlider
              label="Sepia"
              min={0}
              max={100}
              defaultValue={sepia}
              onChange={(value: number) => handleChangeSetting('sepia', value)}
            />
            <ModernSlider
              label="Grayscale"
              min={0}
              max={100}
              defaultValue={grayscale}
              onChange={(value: number) => handleChangeSetting('grayscale', value)}
            />
            <ModernSlider
              label="Invert"
              min={0}
              max={100}
              defaultValue={invert}
              onChange={(value: number) => handleChangeSetting('invert', value)}
            />
          </div>
        </div>

        {/* Border Effects */}
        <div css={{ marginBottom: '24px' }}>
          <h3
            css={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#1e293b',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            🎭 Borders
          </h3>
          
          <div css={{ 
            display: 'grid', 
            gap: '24px',
            padding: '20px',
            background: COLORS.background.secondary,
            borderRadius: '20px',
            border: `1px solid ${COLORS.border}`,
          }}>            <ModernSlider
              label="Border Width"
              min={0}
              max={20}
              defaultValue={borderWidth}
              onChange={(value: number) => handleChangeSetting('borderWidth', value)}
            />
            
            {/* Border Style */}
            <div>
              <label
                css={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '12px',
                  display: 'block',
                }}
              >
                Border Style
              </label>
              <div css={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { value: 'solid', label: 'Solid', icon: '━' },
                  { value: 'dotted', label: 'Dotted', icon: '┅' },
                  { value: 'dashed', label: 'Dashed', icon: '┉' },
                  { value: 'curved', label: 'Curved', icon: '◯' },
                ].map((style) => (
                  <button
                    key={style.value}
                    css={{
                      padding: '8px 16px',
                      background: borderStyle === style.value ? COLORS.gradient.primary : COLORS.background.primary,
                      color: borderStyle === style.value ? '#ffffff' : '#374151',
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: `0 4px 12px ${COLORS.shadow}`,
                      },
                    }}
                    onClick={() => handleChangeSetting('borderStyle', style.value)}
                  >
                    <span css={{ fontSize: '14px' }}>{style.icon}</span>
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Border Color */}
            <div>
              <label
                css={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '12px',
                  display: 'block',
                }}
              >
                Border Color
              </label>
              <input
                type="color"
                value={borderColor}
                onChange={(e) => handleChangeSetting('borderColor', e.target.value)}
                css={{
                  width: '100%',
                  height: '48px',
                  border: `2px solid ${COLORS.border}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  background: 'transparent',
                  '&::-webkit-color-swatch-wrapper': {
                    padding: '4px',
                  },
                  '&::-webkit-color-swatch': {
                    border: 'none',
                    borderRadius: '8px',
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

export default forwardRef<HTMLDivElement, ImageEffectSidebarProps>(
  ImageEffectSidebar
);
