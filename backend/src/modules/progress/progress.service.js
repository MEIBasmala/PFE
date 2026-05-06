const progressRepo = require('./progress.repository');

const getMyProgress = async (userId) => {
  const patient = await progressRepo.getPatientByUserId(userId);
  if (!patient) throw new Error('Patient profile not found');
  return await progressRepo.getPatientProgress(patient.id);
};

const addProgress = async (userId, { weight, goalWeight }) => {
  const patient = await progressRepo.getPatientByUserId(userId);
  if (!patient) throw new Error('Patient profile not found');

  return await progressRepo.createProgress({
    patientId: patient.id,
    weight,
    goalWeight: goalWeight || null,
  });
};

const addNotes = async (userId, progressId, notes) => {
  const nutritionist = await progressRepo.getNutritionistByUserId(userId);
  if (!nutritionist) throw new Error('Nutritionist profile not found');

  const progress = await progressRepo.getProgressById(progressId);
  if (!progress) throw new Error('Progress record not found');

  return await progressRepo.updateProgressNotes(progressId, notes);
};

module.exports = { getMyProgress, addProgress, addNotes };