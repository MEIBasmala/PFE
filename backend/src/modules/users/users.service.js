const bcrypt = require('bcryptjs');
const usersRepo = require('./users.repository');
const prisma = require('../../config/db');

//  Get Profile (with computed isProfileComplete for patients)
const getProfile = async (userId, role) => {
  if (role === 'PATIENT') {
    const profile = await usersRepo.getPatientProfile(userId);
    if (!profile) throw new Error('Patient profile not found');
    // Compute profile completeness
    profile.isProfileComplete = !!(
      profile.height && 
      profile.weight && 
      profile.goals && 
      profile.goals.length > 0 && 
      profile.activityLevel
    );
    return profile;
  }

  if (role === 'NUTRITIONIST') {
    const profile = await usersRepo.getNutritionistProfile(userId);
    if (!profile) throw new Error('Nutritionist profile not found');
    return profile;
  }

  // ADMIN
  const user = await usersRepo.findById(userId);
  if (!user) throw new Error('User not found');
  return user;
};

//  Update Profile (supports all onboarding fields)
const updateProfile = async (userId, role, data) => {
  const { fullName, age, weight, height, goalWeight, goals, activityLevel,
          conditions, medicalHistory, allergies, dietaryPref, waterIntake,
          sleepHours, mealsPerDay, caffeine, challenges, motivation,
          dailyCalorieGoal, specialization, bio } = data;

  if (fullName) {
    await usersRepo.updateUser(userId, { fullName });
  }

  if (role === 'PATIENT') {
    const patientData = {};
    if (age !== undefined) patientData.age = parseInt(age);
    if (weight !== undefined) patientData.weight = parseFloat(weight);
    if (height !== undefined) patientData.height = parseFloat(height);
    if (goalWeight !== undefined) patientData.goalWeight = parseFloat(goalWeight);
    if (goals !== undefined) patientData.goals = goals; // expects array
    if (activityLevel !== undefined) patientData.activityLevel = activityLevel;
    if (conditions !== undefined) patientData.conditions = conditions; // array
    if (medicalHistory !== undefined) patientData.medicalHistory = medicalHistory;
    if (allergies !== undefined) patientData.allergies = allergies; // array
    if (dietaryPref !== undefined) patientData.dietaryPref = dietaryPref;
    if (waterIntake !== undefined) patientData.waterIntake = parseInt(waterIntake);
    if (sleepHours !== undefined) patientData.sleepHours = parseFloat(sleepHours);
    if (mealsPerDay !== undefined) patientData.mealsPerDay = mealsPerDay;
    if (caffeine !== undefined) patientData.caffeine = caffeine;
    if (challenges !== undefined) patientData.challenges = challenges;
    if (motivation !== undefined) patientData.motivation = motivation;
    if (dailyCalorieGoal !== undefined) patientData.dailyCalorieGoal = parseInt(dailyCalorieGoal);

    await usersRepo.updatePatientProfile(userId, patientData);
  }

  if (role === 'NUTRITIONIST') {
    await usersRepo.updateNutritionistProfile(userId, {
      ...(specialization && { specialization }),
      ...(bio && { bio }),
    });
  }

  // Return updated profile (with isProfileComplete)
  return await getProfile(userId, role);
};
//  Change Password 
const changePassword = async (userId, { currentPassword, newPassword }) => {

  const user = await usersRepo.findById(userId);
  if (!user) throw new Error('User not found');


  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new Error('Current password is incorrect');


    const hashed = await bcrypt.hash(newPassword, 10);

  await usersRepo.updateUser(userId, { 
    password: hashed,
    mustChangePassword: false,  
  });

  return { message: 'Password changed successfully' };

};
const getUserById = async (targetUserId, requestingUserId, requestingRole) => {
  // 1) Fetch target user (safe fields only, no password)
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      // password excluded
    },
  });
  if (!targetUser) throw new Error('User not found');

  // 2) ADMIN can see everyone
  if (requestingRole === 'ADMIN') return targetUser;

  // 3) Self access always allowed
  if (requestingUserId === targetUserId) return targetUser;

  // 4) NUTRITIONIST -> can only see patients they have an appointment with
  if (requestingRole === 'NUTRITIONIST') {
    if (targetUser.role !== 'PATIENT') {
      throw new Error('Access denied: nutritionists can only view patient profiles');
    }

    // Get the nutritionist's own record (contains the internal nutritionist.id)
    const nutritionistRecord = await prisma.nutritionist.findUnique({
      where: { userId: requestingUserId },
      select: { id: true },
    });
    if (!nutritionistRecord) throw new Error('Nutritionist profile not found');

    // Get the patient's record (contains patient.id)
    const patientRecord = await prisma.patient.findUnique({
      where: { userId: targetUserId },
      select: { id: true },
    });
    if (!patientRecord) throw new Error('Patient profile not found');

    // Check for any appointment linking them
    const appointmentExists = await prisma.appointment.findFirst({
      where: {
        nutritionistId: nutritionistRecord.id,
        patientId: patientRecord.id,
      },
    });
    if (!appointmentExists) {
      throw new Error('Access denied: no appointment exists with this patient');
    }
    return targetUser;
  }

  // 5) PATIENT -> can only see nutritionists they have an appointment with
  if (requestingRole === 'PATIENT') {
    if (targetUser.role !== 'NUTRITIONIST') {
      throw new Error('Access denied: patients can only view nutritionist profiles');
    }

    // Get patient's own record
    const patientRecord = await prisma.patient.findUnique({
      where: { userId: requestingUserId },
      select: { id: true },
    });
    if (!patientRecord) throw new Error('Patient profile not found');

    // Get the target nutritionist's record
    const nutritionistRecord = await prisma.nutritionist.findUnique({
      where: { userId: targetUserId },
      select: { id: true },
    });
    if (!nutritionistRecord) throw new Error('Nutritionist profile not found');

    // Check for any appointment linking them
    const appointmentExists = await prisma.appointment.findFirst({
      where: {
        patientId: patientRecord.id,
        nutritionistId: nutritionistRecord.id,
      },
    });
    if (!appointmentExists) {
      throw new Error('Access denied: no appointment exists with this nutritionist');
    }
    return targetUser;
  }

  // Fallback for any other role (should not happen)
  throw new Error('Access denied: insufficient permissions');
};

const addMeasurement = async (userId, data) => {
  const patient = await prisma.patient.findUnique({ where: { userId } });
  if (!patient) throw new Error('Patient profile not found');

  return await prisma.measurement.create({
    data: {
      patientId: patient.id,
      chest: data.chest ?? null,
      waist: data.waist ?? null,
      hips: data.hips ?? null,
      arm: data.arm ?? null,
      thigh: data.thigh ?? null,
      bodyFat: data.bodyFat ?? null,
    },
  });
};

const VALID_ROLES = ['PATIENT', 'NUTRITIONIST', 'ADMIN'];

const getUsersByRole = async (role) => {
  const normalizedRole = role?.toUpperCase();
  
  if (!VALID_ROLES.includes(normalizedRole)) {
    const error = new Error('Invalid role');
    error.status = 400;
    throw error;
  }

  const users = await prisma.user.findMany({
    where: { role: normalizedRole, isActive: true },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      nutritionist: {
        select: {
          id: true,
          specialization: true,
          bio: true,
        },
      },
      patient: {
        select: {
          id: true,
        },
      },
    },
  });

  return users;
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getUserById,
  addMeasurement,
  getUsersByRole,
};