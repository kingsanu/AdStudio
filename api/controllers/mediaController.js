import Background from '../models/background.js';
import Illustration from '../models/illustration';
import Icon from '../models/icon';
import ThreeDImage from '../models/threeDImage';

export const getBackgrounds = async (req, res) => {
  try {
    const backgrounds = await Background.find({});
    res.status(200).json({ success: true, data: backgrounds });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getIllustrations = async (req, res) => {
  try {
    const illustrations = await Illustration.find({});
    res.status(200).json({ success: true, data: illustrations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getIcons = async (req, res) => {
  try {
    const icons = await Icon.find({});
    res.status(200).json({ success: true, data: icons });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getThreeDImages = async (req, res) => {
  try {
    const threeDImages = await ThreeDImage.find({});
    res.status(200).json({ success: true, data: threeDImages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};