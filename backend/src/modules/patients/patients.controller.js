// backend/src/modules/patients/patients.controller.js
const patientsService = require('./patients.service');

const getMyPatients = async (req, res) => {
  try {
    const patients = await patientsService.getMyPatients(req.user.id);
    res.status(200).json({ success: true, patients });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getPatientById = async (req, res) => {
  try {
    const patient = await patientsService.getPatientById(parseInt(req.params.id), req.user.id);
    res.status(200).json({ success: true, patient });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getMyPatients, getPatientById };