// src/pages/PatientOnboarding.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi } from '@/services/api';
import { toast } from 'sonner';
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Textarea,
  Badge,
  Separator,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';

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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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

  const stepConfig = [
    { step: 1, icon: 'fa-user', label: 'Basic Info' },
    { step: 2, icon: 'fa-bullseye', label: 'Health Goals' },
    { step: 3, icon: 'fa-stethoscope', label: 'Medical History' },
    { step: 4, icon: 'fa-sun', label: 'Lifestyle' },
  ];

  const goalOptions = [
    { id: 'weight-loss', icon: 'fa-weight-scale', label: 'Weight Loss' },
    { id: 'weight-gain', icon: 'fa-dumbbell', label: 'Weight Gain' },
    { id: 'maintain', icon: 'fa-balance-scale', label: 'Maintain' },
    { id: 'wellness', icon: 'fa-leaf', label: 'Wellness' },
    { id: 'pcos', icon: 'fa-female', label: 'PCOS' },
    { id: 'diabetes', icon: 'fa-tint', label: 'Diabetes' },
    { id: 'heart-health', icon: 'fa-heartbeat', label: 'Heart' },
    { id: 'energy', icon: 'fa-bolt', label: 'Energy' },
    { id: 'digestion', icon: 'fa-seedling', label: 'Digestion' },
  ];

  const activityOptions = [
    { id: 'sedentary', icon: 'fa-couch', label: 'Sedentary' },
    { id: 'light', icon: 'fa-walking', label: 'Light' },
    { id: 'moderate', icon: 'fa-dumbbell', label: 'Moderate' },
    { id: 'active', icon: 'fa-running', label: 'Active' },
    { id: 'very-active', icon: 'fa-fire', label: 'Very Active' },
  ];

  const conditionOptions = ['PCOS', 'Diabetes', 'Hypertension', 'High Cholesterol', 'Thyroid', 'IBS', 'Anemia', 'Other'];
  const [allergyInput, setAllergyInput] = useState('');

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
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[hsl(var(--green))] to-[hsl(var(--orange))] flex items-center justify-center text-xl text-white shadow-[0_4px_12px_rgba(194,230,110,0.3)]">
              <img src="../../img/logo.png" alt="KhabirLens" className="w-11 h-11 rounded-xl" />
            </div>
            <div className="font-syne font-extrabold text-xl text-[hsl(var(--green-dark))]">
              Khabir<span className="bg-gradient-to-br from-[hsl(var(--green))] to-[hsl(var(--orange))] bg-clip-text text-transparent">Lens</span>
            </div>
          </div>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-between mb-6 relative">
          {stepConfig.map((s) => (
            <div
              key={s.step}
              className={`text-center relative z-10 flex-1 transition-all ${
                step === s.step ? '-translate-y-0.5' : step > s.step ? 'opacity-80' : 'opacity-60'
              }`}
            >
              <div
                className={`w-9 h-9 mx-auto mb-1.5 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step === s.step
                    ? 'bg-gradient-to-br from-[hsl(var(--orange))] to-[#ffb07c] border-[hsl(var(--orange))] text-white shadow-[0_0_0_4px_hsl(var(--orange-20))]'
                    : step > s.step
                      ? 'bg-[hsl(var(--green))] border-[hsl(var(--green))] text-white'
                      : 'bg-white border border-[hsl(var(--gray-line))] text-[hsl(var(--text-m))]'
                }`}
              >
                <i className={`fas ${s.icon} text-sm`}></i>
              </div>
              <div className="text-xs font-semibold text-[hsl(var(--text-m))] hidden sm:block">
                {s.label}
              </div>
            </div>
          ))}
          <div className="absolute top-4 left-8 right-8 h-[1.5px] bg-[hsl(var(--gray-line))] -z-0"></div>
        </div>

        {/* Main Card */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/30 shadow-[var(--card-shadow)] transition-all hover:shadow-[var(--hover-shadow)] relative">
          <span className="absolute -top-2 -left-2 text-3xl opacity-10 pointer-events-none rotate-[-10deg]">🥗</span>
          <span className="absolute -bottom-2 -right-2 text-3xl opacity-10 pointer-events-none rotate-[10deg]">🥑</span>

          <CardContent className="p-6">
            <div className="text-center mb-5">
              <h1 className="font-syne text-2xl font-extrabold bg-gradient-to-br from-[hsl(var(--text-dark))] to-[hsl(var(--orange))] bg-clip-text text-transparent">
                Complete Your Profile
              </h1>
              <p className="text-[hsl(var(--text-m))] text-sm">One‑time setup – tell us about yourself</p>
            </div>

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="animate-fadeIn space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="fullName" className="text-[0.7rem] font-bold text-[hsl(var(--text-m))] uppercase tracking-wider">
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="e.g., Sarah M."
                      className="bg-[hsl(var(--cream-bg))] border-[hsl(var(--gray-line))] rounded-md px-3 py-2 text-sm focus:border-[hsl(var(--green))] focus:shadow-[0_0_0_2px_#e8f7c0]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="dob" className="text-[0.7rem] font-bold text-[hsl(var(--text-m))] uppercase tracking-wider">
                      Date of Birth
                    </Label>
                    <Input
                      id="dob"
                      name="dob"
                      type="date"
                      value={formData.dob}
                      onChange={handleChange}
                      className="bg-[hsl(var(--cream-bg))] border-[hsl(var(--gray-line))] rounded-md px-3 py-2 text-sm focus:border-[hsl(var(--green))]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="gender" className="text-[0.7rem] font-bold text-[hsl(var(--text-m))] uppercase tracking-wider">
                      Gender
                    </Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, gender: value }))}
                    >
                      <SelectTrigger className="bg-[hsl(var(--cream-bg))] border-[hsl(var(--gray-line))] rounded-md px-3 py-2 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="height" className="text-[0.7rem] font-bold text-[hsl(var(--text-m))] uppercase tracking-wider">
                      Height (cm)
                    </Label>
                    <Input
                      id="height"
                      name="height"
                      type="number"
                      value={formData.height}
                      onChange={handleChange}
                      className="bg-[hsl(var(--cream-bg))] border-[hsl(var(--gray-line))] rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="currentWeight" className="text-[0.7rem] font-bold text-[hsl(var(--text-m))] uppercase tracking-wider">
                      Current Weight (kg)
                    </Label>
                    <Input
                      id="currentWeight"
                      name="currentWeight"
                      type="number"
                      value={formData.currentWeight}
                      onChange={handleChange}
                      step="0.5"
                      className="bg-[hsl(var(--cream-bg))] border-[hsl(var(--gray-line))] rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="goalWeight" className="text-[0.7rem] font-bold text-[hsl(var(--text-m))] uppercase tracking-wider">
                      Goal Weight (kg)
                    </Label>
                    <Input
                      id="goalWeight"
                      name="goalWeight"
                      type="number"
                      value={formData.goalWeight}
                      onChange={handleChange}
                      step="0.5"
                      className="bg-[hsl(var(--cream-bg))] border-[hsl(var(--gray-line))] rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                {bmi && (
                  <div className="bg-[hsl(var(--green-light))] rounded-md p-2 text-center border border-[hsl(var(--green))] mt-1">
                    <div className="font-syne text-xl font-extrabold text-[hsl(var(--green-dark))]">{bmi}</div>
                    <div className="text-xs text-[hsl(var(--text-m))]">
                      {bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese'}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Goals */}
            {step === 2 && (
              <div className="animate-fadeIn space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[hsl(var(--green-light))] flex items-center justify-center">
                        <i className="fas fa-chart-line text-[hsl(var(--green-dark))] text-sm"></i>
                      </div>
                      <h3 className="font-syne text-base font-bold text-[hsl(var(--text-dark))]">Health Goals</h3>
                    </div>
                    {selectedGoalsList.length > 0 && (
                      <Badge variant="secondary" className="text-xs font-semibold bg-[hsl(var(--green-light))] text-[hsl(var(--green-dark))]">
                        {selectedGoalsList.length} selected
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-[hsl(var(--text-m))] ml-9">Select all that apply — we'll tailor your plan</p>
                </div>

                {selectedGoalsList.length > 0 && (
                  <div className="bg-[hsl(var(--green-light))]/30 rounded-lg p-3 border border-[hsl(var(--green))]/30">
                    <div className="flex flex-wrap gap-2">
                      {selectedGoalsList.map((goal) => (
                        <Badge
                          key={goal.id}
                          className="bg-[hsl(var(--green))] text-[hsl(var(--green-dark))] text-xs font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-sm cursor-pointer hover:bg-[hsl(var(--green-dark))] hover:text-white"
                          onClick={() => handleGoalToggle(goal.id)}
                        >
                          <i className="fas fa-check-circle text-[0.65rem]"></i>
                          {goal.label}
                          <span className="ml-0.5 text-[hsl(var(--green-dark))] hover:text-white">×</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2.5">
                  {goalOptions.map((goal) => (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => handleGoalToggle(goal.id)}
                      className={`group relative p-2 rounded-lg border transition-all duration-200 text-center ${
                        formData.goals.includes(goal.id)
                          ? 'border-[hsl(var(--orange))] bg-[hsl(var(--orange-20))] text-[hsl(var(--orange))] shadow-sm'
                          : 'border-[hsl(var(--gray-line))] bg-[hsl(var(--cream-bg))] text-[hsl(var(--text-dark))] hover:border-[hsl(var(--green))] hover:bg-[hsl(var(--green-light))] hover:-translate-y-0.5'
                      }`}
                    >
                      {formData.goals.includes(goal.id) && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-[hsl(var(--orange))] rounded-full flex items-center justify-center shadow-sm">
                          <i className="fas fa-check text-white text-[0.6rem]"></i>
                        </div>
                      )}
                      <i className={`fas ${goal.icon} text-base mb-1 block ${formData.goals.includes(goal.id) ? 'text-[hsl(var(--orange))]' : 'text-[hsl(var(--text-m))]'}`}></i>
                      <span className="text-[0.7rem] font-medium">{goal.label}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-[hsl(var(--green-light))] flex items-center justify-center">
                      <i className="fas fa-running text-[hsl(var(--green-dark))] text-sm"></i>
                    </div>
                    <h3 className="font-syne text-base font-bold text-[hsl(var(--text-dark))]">Activity Level</h3>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {activityOptions.map((act) => (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, activityLevel: act.id }))}
                        className={`p-1.5 rounded-lg text-center transition-all duration-200 ${
                          formData.activityLevel === act.id
                            ? 'bg-[hsl(var(--green))] text-white shadow-md scale-[1.02]'
                            : 'bg-[hsl(var(--cream-bg))] border border-[hsl(var(--gray-line))] text-[hsl(var(--text-m))] hover:bg-[hsl(var(--green-light))] hover:border-[hsl(var(--green))] hover:-translate-y-0.5'
                        }`}
                      >
                        <i className={`fas ${act.icon} text-sm`}></i>
                        <div className="text-[0.65rem] font-medium mt-0.5">{act.label}</div>
                      </button>
                    ))}
                  </div>
                  <div className="text-[0.6rem] text-[hsl(var(--text-l))] text-center mt-2 flex items-center justify-center gap-1">
                    <i className="fas fa-chart-line text-[hsl(var(--saffron))]"></i>
                    <span>Helps calculate your daily calorie goal</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Medical */}
            {step === 3 && (
              <div className="animate-fadeIn space-y-3">
                <div className="flex items-center gap-2 text-base font-bold text-[hsl(var(--text-dark))]">
                  Health Conditions
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {conditionOptions.map((cond) => (
                    <label key={cond} className="flex items-center gap-1.5 text-sm bg-[hsl(var(--cream-bg))] px-2 py-1.5 rounded-lg cursor-pointer hover:bg-[hsl(var(--green-light))]/30 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.conditions.includes(cond)}
                        onChange={() => handleConditionToggle(cond)}
                        className="accent-[hsl(var(--orange))] w-3.5 h-3.5"
                      />
                      <span>{cond}</span>
                    </label>
                  ))}
                </div>
                <Textarea
                  name="medicalNotes"
                  value={formData.medicalNotes}
                  onChange={handleChange}
                  rows={1}
                  placeholder="Additional medical notes..."
                  className="bg-[hsl(var(--cream-bg))] border-[hsl(var(--gray-line))] rounded-lg px-3 py-2 text-sm"
                />
                <div className="flex items-center gap-2 text-base font-bold text-[hsl(var(--text-dark))]">Allergies</div>
                <div className="flex gap-2">
                  <input 
  value={allergyInput} 
  onChange={e => setAllergyInput(e.target.value)} 
/>
<Button onClick={() => {
  if (allergyInput.trim()) {
    addAllergy(allergyInput.trim());
    setAllergyInput('');
  }
}}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formData.allergies.map((a, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="bg-[hsl(var(--orange-20))] text-[hsl(var(--orange))] px-2 py-0.5 rounded-full text-sm inline-flex items-center gap-1 cursor-pointer hover:bg-[hsl(var(--orange))] hover:text-white"
                      onClick={() => removeAllergy(idx)}
                    >
                      {a}
                      <span className="text-xs">×</span>
                    </Badge>
                  ))}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dietaryPref" className="text-[0.7rem] font-bold text-[hsl(var(--text-m))] uppercase tracking-wider">
                    Dietary Preference
                  </Label>
                  <Select
                    value={formData.dietaryPref}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, dietaryPref: value }))}
                  >
                    <SelectTrigger className="bg-[hsl(var(--cream-bg))] border-[hsl(var(--gray-line))] rounded-md px-3 py-2 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No restrictions</SelectItem>
                      <SelectItem value="vegetarian">Vegetarian</SelectItem>
                      <SelectItem value="vegan">Vegan</SelectItem>
                      <SelectItem value="pescatarian">Pescatarian</SelectItem>
                      <SelectItem value="keto">Keto-friendly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 4: Lifestyle */}
            {step === 4 && (
              <div className="animate-fadeIn space-y-3">
                <div>
                  <Label className="text-sm font-semibold text-[hsl(var(--text-dark))] mb-1 block">
                    Water intake: <span className="text-[hsl(var(--orange))]">{formData.waterIntake} glasses/day</span>
                  </Label>
                  <input
                    type="range"
                    name="waterIntake"
                    min="0"
                    max="12"
                    value={formData.waterIntake}
                    onChange={handleChange}
                    className="w-full h-1.5 bg-[hsl(var(--gray-line))] rounded-lg appearance-none cursor-pointer accent-[hsl(var(--green))]"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-[hsl(var(--text-dark))] mb-1 block">
                    Sleep hours: <span className="text-[hsl(var(--orange))]">{formData.sleepHours} hours/night</span>
                  </Label>
                  <input
                    type="range"
                    name="sleepHours"
                    min="0"
                    max="12"
                    step="0.5"
                    value={formData.sleepHours}
                    onChange={handleChange}
                    className="w-full h-1.5 bg-[hsl(var(--gray-line))] rounded-lg appearance-none cursor-pointer accent-[hsl(var(--green))]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="mealsPerDay" className="text-[0.7rem] font-bold text-[hsl(var(--text-m))] uppercase tracking-wider">
                      Meals per day
                    </Label>
                    <Select
                      value={formData.mealsPerDay}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, mealsPerDay: value }))}
                    >
                      <SelectTrigger className="bg-[hsl(var(--cream-bg))] border-[hsl(var(--gray-line))] rounded-md px-3 py-2 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-2 meals">1-2 meals</SelectItem>
                        <SelectItem value="3 meals">3 meals</SelectItem>
                        <SelectItem value="4-5 small meals">4-5 small meals</SelectItem>
                        <SelectItem value="Intermittent fasting">Intermittent fasting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="caffeine" className="text-[0.7rem] font-bold text-[hsl(var(--text-m))] uppercase tracking-wider">
                      Caffeine (cups/day)
                    </Label>
                    <Select
                      value={formData.caffeine}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, caffeine: value }))}
                    >
                      <SelectTrigger className="bg-[hsl(var(--cream-bg))] border-[hsl(var(--gray-line))] rounded-md px-3 py-2 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0</SelectItem>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3+">3+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Textarea
                  name="challenges"
                  value={formData.challenges}
                  onChange={handleChange}
                  rows={1}
                  placeholder="What challenges are you facing? (e.g., portion control, time)"
                  className="bg-[hsl(var(--cream-bg))] border-[hsl(var(--gray-line))] rounded-lg px-3 py-2 text-sm"
                />
                <Textarea
                  name="motivation"
                  value={formData.motivation}
                  onChange={handleChange}
                  rows={1}
                  placeholder="What motivates you? (e.g., more energy, better sleep)"
                  className="bg-[hsl(var(--cream-bg))] border-[hsl(var(--gray-line))] rounded-lg px-3 py-2 text-sm"
                />
              </div>
            )}

            <Separator className="my-5" />

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                {step > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStep(step - 1)}
                    className="rounded-full"
                  >
                    ← Back
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/patient')}
                  className="rounded-full text-[hsl(var(--text-l))]"
                >
                  Skip for now
                </Button>
              </div>
              <div className="flex gap-2">
                {step < 4 && (
                  <Button
                    onClick={() => setStep(step + 1)}
                    className="rounded-full bg-gradient-to-br from-[hsl(var(--orange))] to-[#ffb07c] text-white font-semibold text-sm shadow hover:-translate-y-0.5 transition"
                  >
                    Next →
                  </Button>
                )}
                {step === 4 && (
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="rounded-full bg-[hsl(var(--green))] text-[hsl(var(--pure-white))] font-semibold text-sm shadow hover:-translate-y-0.5 disabled:opacity-70"
                  >
                    {loading ? 'Saving...' : 'Complete'}
                  </Button>
                )}
              </div>
            </div>

            <div className="text-center mt-4 text-xs text-[hsl(var(--text-m))] bg-[hsl(var(--gray-bg))]/50 rounded-lg py-1.5 px-2">
              <i className="fas fa-info-circle mr-1 text-[hsl(var(--saffron))]"></i>
              You can always complete or update your profile later in <strong>Settings</strong>.
            </div>
          </CardContent>
        </Card>
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