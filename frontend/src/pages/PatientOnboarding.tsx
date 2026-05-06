// src/pages/PatientOnboarding.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi } from '@/services/api';
import { toast } from 'sonner';

interface OnboardingData {
  fullName: string;
  dob: string;
  gender: string;
  height: number;
  currentWeight: number;
  goalWeight: number;
  goals: string[];
  activityLevel: string;
  conditions: string[];
  medicalNotes: string;
  allergies: string[];
  dietaryPref: string;
  waterIntake: number;
  sleepHours: number;
  mealsPerDay: string;
  caffeine: string;
  challenges: string;
  motivation: string;
}

const PatientOnboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>({
    fullName: user?.fullName || '',
    dob: '',
    gender: 'female',
    height: 165,
    currentWeight: 70,
    goalWeight: 65,
    goals: [],
    activityLevel: 'moderate',
    conditions: [],
    medicalNotes: '',
    allergies: [],
    dietaryPref: 'none',
    waterIntake: 6,
    sleepHours: 7,
    mealsPerDay: '3 meals',
    caffeine: '2',
    challenges: '',
    motivation: '',
  });
  const [loading, setLoading] = useState(false);
  const [bmi, setBmi] = useState<number | null>(null);

  useEffect(() => {
    const heightM = formData.height / 100;
    if (heightM > 0 && formData.currentWeight > 0) {
      const bmiVal = formData.currentWeight / (heightM * heightM);
      setBmi(parseFloat(bmiVal.toFixed(1)));
    } else {
      setBmi(null);
    }
  }, [formData.height, formData.currentWeight]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleGoalToggle = (goal: string) => {
    setFormData((prev) => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter((g) => g !== goal)
        : [...prev.goals, goal],
    }));
  };

  const handleConditionToggle = (condition: string) => {
    setFormData((prev) => ({
      ...prev,
      conditions: prev.conditions.includes(condition)
        ? prev.conditions.filter((c) => c !== condition)
        : [...prev.conditions, condition],
    }));
  };

  const addAllergy = (allergy: string) => {
    if (allergy.trim() && !formData.allergies.includes(allergy.trim())) {
      setFormData((prev) => ({ ...prev, allergies: [...prev.allergies, allergy.trim()] }));
    }
  };

  const removeAllergy = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index),
    }));
  };

  const calculateDailyCalorieGoal = () => {
    const age = formData.dob
      ? new Date().getFullYear() - new Date(formData.dob).getFullYear()
      : 30;
    let bmr;
    if (formData.gender === 'male') {
      bmr = 10 * formData.currentWeight + 6.25 * formData.height - 5 * age + 5;
    } else {
      bmr = 10 * formData.currentWeight + 6.25 * formData.height - 5 * age - 161;
    }
    const activityFactors: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      'very-active': 1.9,
    };
    const tdee = bmr * (activityFactors[formData.activityLevel] || 1.55);
    let adjusted = tdee;
    if (formData.goals.includes('weight-loss')) adjusted -= 500;
    if (formData.goals.includes('weight-gain')) adjusted += 500;
    return Math.max(adjusted, formData.gender === 'male' ? 1500 : 1200);
  };

  const handleSubmit = async () => {
  setLoading(true);
  try {
    const dailyCalorieGoal = Math.round(calculateDailyCalorieGoal());
    const payload = {
      fullName: formData.fullName,
      age: formData.dob
        ? new Date().getFullYear() - new Date(formData.dob).getFullYear()
        : undefined,
      weight: formData.currentWeight,
      height: formData.height,
      goalWeight: formData.goalWeight,
      goals: formData.goals,
      activityLevel: formData.activityLevel,
      conditions: formData.conditions,
      medicalHistory: formData.medicalNotes,
      allergies: formData.allergies,
      dietaryPref: formData.dietaryPref,
      waterIntake: formData.waterIntake,
      sleepHours: formData.sleepHours,
      mealsPerDay: formData.mealsPerDay,
      caffeine: formData.caffeine,
      challenges: formData.challenges,
      motivation: formData.motivation,
      dailyCalorieGoal,
    };
    await usersApi.updateProfile(payload);
    toast.success("Profile saved! Welcome to KhabirLens 🎉");
    navigate('/patient');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Failed to save profile');
  } finally {
    setLoading(false);
  }
};

  const selectedGoalsList = formData.goals.map((goal) => ({
    id: goal,
    label:
      goal === 'weight-loss'
        ? 'Weight Loss'
        : goal === 'weight-gain'
          ? 'Weight Gain'
          : goal === 'maintain'
            ? 'Maintain Weight'
            : goal === 'wellness'
              ? 'General Wellness'
              : goal === 'pcos'
                ? 'Manage PCOS'
                : goal === 'diabetes'
                  ? 'Diabetes Management'
                  : goal === 'heart-health'
                    ? 'Heart Health'
                    : goal === 'energy'
                      ? 'Boost Energy'
                      : 'Better Digestion',
  }));

  const floatingFoodsPositions = [
  { emoji: '🥗', top: '8%', left: '3%', fontSize: '2rem' },
  { emoji: '🥑', top: '12%', left: '15%', fontSize: '1.8rem' },
  { emoji: '🍎', top: '5%', right: '8%', fontSize: '2.5rem' },
  { emoji: '🍐', top: '18%', right: '22%', fontSize: '1.6rem' },
  { emoji: '🥦', top: '35%', left: '2%', fontSize: '2rem' },
  { emoji: '🥕', top: '42%', left: '12%', fontSize: '2rem' },
  { emoji: '🍅', top: '28%', left: '20%', fontSize: '2rem' },
  { emoji: '🥒', top: '32%', right: '5%', fontSize: '2rem' },
  { emoji: '🍓', top: '45%', right: '18%', fontSize: '2rem' },
  { emoji: '🫐', top: '38%', right: '28%', fontSize: '2rem' },
  { emoji: '🍒', bottom: '25%', left: '4%', fontSize: '2rem' },
  { emoji: '🍊', bottom: '18%', left: '18%', fontSize: '2rem' },
  { emoji: '🍌', bottom: '32%', left: '28%', fontSize: '2rem' },
  { emoji: '🥝', bottom: '15%', right: '6%', fontSize: '2rem' },
  { emoji: '🍍', bottom: '28%', right: '22%', fontSize: '2rem' },
  { emoji: '🥭', bottom: '8%', right: '35%', fontSize: '2rem' },
];

  return (
    <div className="warm-bg relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Floating foods */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
         {floatingFoodsPositions.map((item, i) => (
            <span key={i} className="absolute animate-floatAround" style={{
              ...(item.top ? { top: item.top } : { bottom: item.bottom }),
              ...(item.left ? { left: item.left } : { right: item.right }),
              fontSize: item.fontSize, opacity: 0.35, animationDelay: `${i * -1.5}s`,
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.05))',
            }}>{item.emoji}</span>
          ))}
      </div>

      <div className="w-full max-w-3xl mx-auto relative z-10">
        {/* Logo */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-kl-green to-kl-orange flex items-center justify-center text-xl text-kl-white shadow-[0_4px_12px_rgba(194,230,110,0.3)]">
              <img src="../../img/logo.png" alt="KhabirLens" className="w-11 h-11 rounded-xl" />
            </div>
            <div className="font-syne font-extrabold text-xl text-kl-green-dark">
              Khabir<span className="bg-gradient-to-br from-kl-green to-kl-orange bg-clip-text text-transparent">Lens</span>
            </div>
          </div>
        </div>

        {/* Progress steps – slightly larger */}
        <div className="flex items-center justify-between mb-6 relative">
          {[
            { step: 1, icon: 'fa-user', label: 'Basic Info' },
            { step: 2, icon: 'fa-bullseye', label: 'Health Goals' },
            { step: 3, icon: 'fa-stethoscope', label: 'Medical History' },
            { step: 4, icon: 'fa-sun', label: 'Lifestyle' },
          ].map((s) => (
            <div
              key={s.step}
              className={`text-center relative z-10 flex-1 transition-all ${
                step === s.step ? '-translate-y-0.5' : step > s.step ? 'opacity-80' : 'opacity-60'
              }`}
            >
              <div
                className={`step-circle w-9 h-9 mx-auto mb-1.5 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step === s.step
                    ? 'bg-gradient-to-br from-kl-orange to-[#ffb07c] border-kl-orange text-white shadow-[0_0_0_4px_hsl(var(--orange-20))]'
                    : step > s.step
                      ? 'bg-kl-green border-kl-green text-white'
                      : 'bg-white border border-kl-gray-line text-kl-text-m'
                }`}
              >
                <i className={`fas ${s.icon} text-sm`}></i>
              </div>
              <div className="step-label text-xs font-semibold text-kl-text-m hidden sm:block">
                {s.label}
              </div>
            </div>
          ))}
          <div className="absolute top-4 left-8 right-8 h-[1.5px] bg-kl-gray-line -z-0"></div>
        </div>

        {/* Main Card – slightly larger but still compact */}
<div className="bg-white/10 rounded-2xl p-6 shadow-kl-card border border-white/30 transition-all hover:shadow-kl-hover relative">
          <span className="absolute -top-2 -left-2 text-3xl opacity-10 pointer-events-none rotate-[-10deg]">🥗</span>
          <span className="absolute -bottom-2 -right-2 text-3xl opacity-10 pointer-events-none rotate-[10deg]">🥑</span>

          <div className="text-center mb-5">
            <h1 className="font-syne text-2xl font-extrabold bg-gradient-to-br from-kl-text-dark to-kl-orange bg-clip-text text-transparent">
              Complete Your Profile
            </h1>
            <p className="text-kl-text-m text-sm">One‑time setup – tell us about yourself</p>
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="animate-fadeIn space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.7rem] font-bold text-kl-text-m uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g., Sarah M."
                    className="w-full bg-kl-cream-bg border border-kl-gray-line rounded-xl px-3 py-2 text-sm outline-none focus:border-kl-green focus:shadow-[0_0_0_2px_#e8f7c0]"
                  />
                </div>
                <div>
                  <label className="block text-[0.7rem] font-bold text-kl-text-m uppercase tracking-wider mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    className="w-full bg-kl-cream-bg border border-kl-gray-line rounded-xl px-3 py-2 text-sm outline-none focus:border-kl-green"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.7rem] font-bold text-kl-text-m uppercase tracking-wider mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full bg-kl-cream-bg border border-kl-gray-line rounded-xl px-3 py-2 text-sm"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[0.7rem] font-bold text-kl-text-m uppercase tracking-wider mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    className="w-full bg-kl-cream-bg border border-kl-gray-line rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.7rem] font-bold text-kl-text-m uppercase tracking-wider mb-1">
                    Current Weight (kg)
                  </label>
                  <input
                    type="number"
                    name="currentWeight"
                    value={formData.currentWeight}
                    onChange={handleChange}
                    step="0.5"
                    className="w-full bg-kl-cream-bg border border-kl-gray-line rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[0.7rem] font-bold text-kl-text-m uppercase tracking-wider mb-1">
                    Goal Weight (kg)
                  </label>
                  <input
                    type="number"
                    name="goalWeight"
                    value={formData.goalWeight}
                    onChange={handleChange}
                    step="0.5"
                    className="w-full bg-kl-cream-bg border border-kl-gray-line rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>
              {bmi && (
                <div className="bg-kl-green-light rounded-xl p-2 text-center border border-kl-green mt-1">
                  <div className="font-syne text-xl font-extrabold text-kl-green-dark">{bmi}</div>
                  <div className="text-xs text-kl-text-m">
                    {bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese'}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Goals */}
         {step === 2 && (
  <div className="animate-fadeIn space-y-5">
    {/* Health Goals header */}
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-kl-green-light flex items-center justify-center">
            <i className="fas fa-chart-line text-kl-green-dark text-sm"></i>
          </div>
          <h3 className="font-syne text-base font-bold text-kl-text-dark">Health Goals</h3>
        </div>
        {selectedGoalsList.length > 0 && (
          <span className="text-xs font-semibold bg-kl-green-light text-kl-green-dark px-2 py-0.5 rounded-full">
            {selectedGoalsList.length} selected
          </span>
        )}
      </div>
      <p className="text-xs text-kl-text-m ml-9">Select all that apply — we'll tailor your plan</p>
    </div>

    {/* Selected goals tags */}
    {selectedGoalsList.length > 0 && (
      <div className="bg-kl-green-light/30 rounded-xl p-3 border border-kl-green/30">
        <div className="flex flex-wrap gap-2">
          {selectedGoalsList.map((goal) => (
            <span
              key={goal.id}
              className="bg-kl-green text-kl-green-dark text-xs font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-sm"
            >
              <i className="fas fa-check-circle text-[0.65rem]"></i>
              {goal.label}
              <button
                onClick={() => handleGoalToggle(goal.id)}
                className="ml-0.5 text-kl-green-dark hover:text-kl-text-dark"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
    )}

    {/* Goal cards – clean, minimal, consistent colors */}
    <div className="grid grid-cols-3 gap-2.5">
      {[
        { id: 'weight-loss', icon: 'fa-weight-scale', label: 'Weight Loss' },
        { id: 'weight-gain', icon: 'fa-dumbbell', label: 'Weight Gain' },
        { id: 'maintain', icon: 'fa-balance-scale', label: 'Maintain' },
        { id: 'wellness', icon: 'fa-leaf', label: 'Wellness' },
        { id: 'pcos', icon: 'fa-female', label: 'PCOS' },
        { id: 'diabetes', icon: 'fa-tint', label: 'Diabetes' },
        { id: 'heart-health', icon: 'fa-heartbeat', label: 'Heart' },
        { id: 'energy', icon: 'fa-bolt', label: 'Energy' },
        { id: 'digestion', icon: 'fa-seedling', label: 'Digestion' },
      ].map((goal) => (
        <button
          key={goal.id}
          type="button"
          onClick={() => handleGoalToggle(goal.id)}
          className={`group relative p-2 rounded-xl border transition-all duration-200 text-center ${
            formData.goals.includes(goal.id)
              ? 'border-kl-orange bg-kl-orange-20 text-kl-orange shadow-sm'
              : 'border-kl-gray-line bg-kl-cream-bg text-kl-text-dark hover:border-kl-green hover:bg-kl-green-light hover:-translate-y-0.5'
          }`}
        >
          {formData.goals.includes(goal.id) && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-kl-orange rounded-full flex items-center justify-center shadow-sm">
              <i className="fas fa-check text-white text-[0.6rem]"></i>
            </div>
          )}
          <i className={`fas ${goal.icon} text-base mb-1 block ${formData.goals.includes(goal.id) ? 'text-kl-orange' : 'text-kl-text-m'}`}></i>
          <span className="text-[0.7rem] font-medium">{goal.label}</span>
        </button>
      ))}
    </div>

    {/* Activity Level */}
    <div className="pt-2">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full bg-kl-green-light flex items-center justify-center">
          <i className="fas fa-running text-kl-green-dark text-sm"></i>
        </div>
        <h3 className="font-syne text-base font-bold text-kl-text-dark">Activity Level</h3>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {[
          { id: 'sedentary', icon: 'fa-couch', label: 'Sedentary' },
          { id: 'light', icon: 'fa-walking', label: 'Light' },
          { id: 'moderate', icon: 'fa-dumbbell', label: 'Moderate' },
          { id: 'active', icon: 'fa-running', label: 'Active' },
          { id: 'very-active', icon: 'fa-fire', label: 'Very Active' },
        ].map((act) => (
          <button
            key={act.id}
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, activityLevel: act.id }))}
            className={`p-1.5 rounded-lg text-center transition-all duration-200 ${
              formData.activityLevel === act.id
                ? 'bg-kl-green text-white shadow-md scale-[1.02]'
                : 'bg-kl-cream-bg border border-kl-gray-line text-kl-text-m hover:bg-kl-green-light hover:border-kl-green hover:-translate-y-0.5'
            }`}
          >
            <i className={`fas ${act.icon} text-sm`}></i>
            <div className="text-[0.65rem] font-medium mt-0.5">{act.label}</div>
          </button>
        ))}
      </div>
      <div className="text-[0.6rem] text-kl-text-l text-center mt-2 flex items-center justify-center gap-1">
        <i className="fas fa-chart-line text-kl-saffron"></i>
        <span>Helps calculate your daily calorie goal</span>
      </div>
    </div>
  </div>
)}
          {/* Step 3: Medical */}
          {step === 3 && (
            <div className="animate-fadeIn space-y-3">
              <div className="flex items-center gap-2 text-base font-bold text-kl-text-dark">
                Health Conditions
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {['PCOS', 'Diabetes', 'Hypertension', 'High Cholesterol', 'Thyroid', 'IBS', 'Anemia', 'Other'].map((cond) => (
                  <label key={cond} className="flex items-center gap-1.5 text-sm bg-kl-cream-bg px-2 py-1.5 rounded-lg">
                    <input
                      type="checkbox"
                      checked={formData.conditions.includes(cond)}
                      onChange={() => handleConditionToggle(cond)}
                      className="accent-kl-orange w-3.5 h-3.5"
                    />
                    <span>{cond}</span>
                  </label>
                ))}
              </div>
              <textarea
                name="medicalNotes"
                value={formData.medicalNotes}
                onChange={handleChange}
                rows={1}
                placeholder="Additional medical notes..."
                className="w-full bg-kl-cream-bg border border-kl-gray-line rounded-lg px-3 py-2 text-sm"
              />
              <div className="flex items-center gap-2 text-base font-bold text-kl-text-dark">Allergies</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="allergyInput"
                  placeholder="e.g., Gluten"
                  className="flex-1 bg-kl-cream-bg border border-kl-gray-line rounded-lg px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => addAllergy((document.getElementById('allergyInput') as HTMLInputElement).value)}
                  className="px-3 py-1 rounded-full bg-kl-gray-bg text-sm hover:border-kl-orange"
                >
                  + Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {formData.allergies.map((a, idx) => (
                  <span key={idx} className="bg-kl-orange-20 text-kl-orange px-2 py-0.5 rounded-full text-sm inline-flex items-center gap-1">
                    {a}
                    <button onClick={() => removeAllergy(idx)} className="text-xs">×</button>
                  </span>
                ))}
              </div>
              <div>
                <label className="block text-[0.7rem] font-bold text-kl-text-m uppercase tracking-wider mb-1">
                  Dietary Preference
                </label>
                <select
                  name="dietaryPref"
                  value={formData.dietaryPref}
                  onChange={handleChange}
                  className="w-full bg-kl-cream-bg border border-kl-gray-line rounded-xl px-3 py-2 text-sm"
                >
                  <option value="none">No restrictions</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="pescatarian">Pescatarian</option>
                  <option value="keto">Keto-friendly</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 4: Lifestyle */}
          {step === 4 && (
            <div className="animate-fadeIn space-y-3">
              <div>
                <label className="block text-sm font-semibold text-kl-text-dark mb-1">
                  Water intake: <span className="text-kl-orange">{formData.waterIntake} glasses/day</span>
                </label>
                <input
                  type="range"
                  name="waterIntake"
                  min="0"
                  max="12"
                  value={formData.waterIntake}
                  onChange={handleChange}
                  className="w-full h-1.5 bg-kl-gray-line rounded-lg appearance-none cursor-pointer accent-kl-green"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-kl-text-dark mb-1">
                  Sleep hours: <span className="text-kl-orange">{formData.sleepHours} hours/night</span>
                </label>
                <input
                  type="range"
                  name="sleepHours"
                  min="0"
                  max="12"
                  step="0.5"
                  value={formData.sleepHours}
                  onChange={handleChange}
                  className="w-full h-1.5 bg-kl-gray-line rounded-lg appearance-none cursor-pointer accent-kl-green"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.7rem] font-bold text-kl-text-m uppercase tracking-wider mb-1">
                    Meals per day
                  </label>
                  <select name="mealsPerDay" value={formData.mealsPerDay} onChange={handleChange} className="w-full bg-kl-cream-bg border border-kl-gray-line rounded-xl px-3 py-2 text-sm">
                    <option>1-2 meals</option>
                    <option>3 meals</option>
                    <option>4-5 small meals</option>
                    <option>Intermittent fasting</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[0.7rem] font-bold text-kl-text-m uppercase tracking-wider mb-1">
                    Caffeine (cups/day)
                  </label>
                  <select name="caffeine" value={formData.caffeine} onChange={handleChange} className="w-full bg-kl-cream-bg border border-kl-gray-line rounded-xl px-3 py-2 text-sm">
                    <option>0</option><option>1</option><option>2</option><option>3+</option>
                  </select>
                </div>
              </div>
              <textarea
                name="challenges"
                value={formData.challenges}
                onChange={handleChange}
                rows={1}
                placeholder="What challenges are you facing? (e.g., portion control, time)"
                className="w-full bg-kl-cream-bg border border-kl-gray-line rounded-lg px-3 py-2 text-sm"
              />
              <textarea
                name="motivation"
                value={formData.motivation}
                onChange={handleChange}
                rows={1}
                placeholder="What motivates you? (e.g., more energy, better sleep)"
                className="w-full bg-kl-cream-bg border border-kl-gray-line rounded-lg px-3 py-2 text-sm"
              />
            </div>
          )}

          {/* Navigation with skip button */}
          <div className="flex justify-between items-center mt-5 pt-3 border-t border-kl-gray-line">
            <div className="flex gap-2">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-1.5 rounded-full bg-transparent text-kl-text-m border border-kl-gray-line text-sm hover:border-kl-orange hover:text-kl-orange transition"
                >
                  ← Back
                </button>
              )}
              <button
                onClick={() => navigate('/patient')}
                className="px-4 py-1.5 rounded-full bg-transparent text-kl-text-l border border-kl-gray-line text-sm hover:border-kl-saffron hover:text-kl-text-m transition"
              >
                Skip for now
              </button>
            </div>
            <div className="flex gap-2">
              {step < 4 && (
                <button
                  onClick={() => setStep(step + 1)}
                  className="px-5 py-1.5 rounded-full bg-gradient-to-br from-kl-orange to-[#ffb07c] text-white font-semibold text-sm shadow hover:-translate-y-0.5 transition"
                >
                  Next →
                </button>
              )}
              {step === 4 && (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-5 py-1.5 rounded-full bg-kl-green text-kl-green-dark font-semibold text-sm shadow hover:-translate-y-0.5 disabled:opacity-70"
                >
                  {loading ? 'Saving...' : 'Complete ✨'}
                </button>
              )}
            </div>
          </div>

          {/* Helper text – more readable */}
          <div className="text-center mt-4 text-xs text-kl-text-m bg-kl-gray-bg/50 rounded-lg py-1.5 px-2">
            <i className="fas fa-info-circle mr-1 text-kl-saffron"></i>
            You can always complete or update your profile later in <strong>Settings</strong>.
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease forwards;
        }
        .animate-floatAround {
          animation: floatAround 25s infinite ease-in-out;
        }
        @keyframes floatAround {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(20px, -15px) rotate(5deg); }
          50% { transform: translate(35px, 5px) rotate(10deg); }
          75% { transform: translate(10px, 20px) rotate(5deg); }
        }
      `}</style>
    </div>
  );
};

export default PatientOnboarding;