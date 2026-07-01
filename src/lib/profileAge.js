export const calculateAge = (birthDate) => {
  if (!birthDate?.year) return null;

  const today = new Date();
  const birthMonth = birthDate.month || 1;
  const birthDay = birthDate.day || 1;
  let age = today.getFullYear() - birthDate.year;
  const monthDiff = today.getMonth() + 1 - birthMonth;

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDay)) age -= 1;
  return age;
};

export const getAgeGroupKey = (age) => {
  if (age === null || age === undefined) return '';
  if (age <= 12) return 'child';
  if (age <= 18) return 'teen';
  if (age <= 29) return '20s';
  if (age <= 39) return '30s';
  if (age <= 49) return '40s';
  return '50s';
};

export const getAgeGroupFromBirthDate = (birthDate) => getAgeGroupKey(calculateAge(birthDate));
