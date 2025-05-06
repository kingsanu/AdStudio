import mongoose from 'mongoose';

const backgroundSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
});

const Background = mongoose.model('Background', backgroundSchema);

export default Background;