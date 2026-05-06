const bcrypt = require('bcryptjs');
const usersRepo = require('./users.repository');

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


  await usersRepo.updateUser(userId, { password: hashed });

  return { message: 'Password changed successfully' };
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};