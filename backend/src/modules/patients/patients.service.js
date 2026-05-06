// backend/src/modules/patients/patients.service.js
const patientsRepo = require('./patients.repository');
const appointmentsRepo = require('../appointments/appointments.repository');

const getMyPatients = async (userId) => {
  const nutritionist = await appointmentsRepo.getNutritionistByUserId(userId);
  if (!nutritionist) throw new Error('Nutritionist profile not found');

  const patients = await patientsRepo.getPatientsByNutritionist(nutritionist.id);
  // Transform to frontend‑friendly format
  return patients.map(p => ({
    id: p.id,
    userId: p.userId,
    age: p.age,
    weight: p.weight,
    height: p.height,
    goalWeight: p.goalWeight,
    dailyCalorieGoal: p.dailyCalorieGoal,
    allergies: p.allergies,
    conditions: p.conditions,
    goals: p.goals,
    activityLevel: p.activityLevel,
    user: {
      id: p.user.id,
      fullName: p.user.fullName,
      email: p.user.email,
    },
    measurements: p.measurements[0] || null,
  }));
};

const getPatientById = async (patientId, userId) => {
  const nutritionist = await appointmentsRepo.getNutritionistByUserId(userId);
  if (!nutritionist) throw new Error('Nutritionist profile not found');

  const patient = await patientsRepo.getPatientByIdForNutritionist(patientId, nutritionist.id);
  if (!patient) throw new Error('Patient not found or not associated with you');
  // Same transformation as above
  return {
    id: patient.id,
    userId: patient.userId,
    age: patient.age,
    weight: patient.weight,
    height: patient.height,
    goalWeight: patient.goalWeight,
    dailyCalorieGoal: patient.dailyCalorieGoal,
    allergies: patient.allergies,
    conditions: patient.conditions,
    goals: patient.goals,
    activityLevel: patient.activityLevel,
    user: {
      id: patient.user.id,
      fullName: patient.user.fullName,
      email: patient.user.email,
    },
    measurements: patient.measurements[0] || null,
  };
};

module.exports = {
  getMyPatients,
  getPatientById,
};