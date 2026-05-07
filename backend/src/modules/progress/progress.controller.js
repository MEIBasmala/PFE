const progressService = require('./progress.service');

const getMyProgress = async (req, res) => {
  try {
    const progress = await progressService.getMyProgress(req.user.id);
    res.status(200).json({ success: true, progress });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const addProgress = async (req, res) => {
  try {
    const progress = await progressService.addProgress(req.user.id, req.body);
    res.status(201).json({ success: true, message: 'Progress added successfully', progress });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const addNotes = async (req, res) => {
  try {
    const progress = await progressService.addNotes(
      req.user.id,
      parseInt(req.params.id),
      req.body.notes
    );
    res.status(200).json({ success: true, message: 'Notes added successfully', progress });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const addProgressPhoto = async (req, res) => {
  try {
    const { photoUrl, month, notes } = req.body;
    const photo = await progressService.addProgressPhoto(req.user.id, { photoUrl, month, notes });
    res.status(201).json({ success: true, photo });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getMyProgressPhotos = async (req, res) => {
  try {
    const photos = await progressService.getMyProgressPhotos(req.user.id);
    res.status(200).json({ success: true, photos });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


module.exports = { getMyProgress, addProgress, addNotes , addProgressPhoto, getMyProgressPhotos};