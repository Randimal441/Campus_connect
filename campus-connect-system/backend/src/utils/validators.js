const validator = (value, rules) => {
  const errors = [];

  if (rules.required && !value?.trim()) {
    errors.push('This field is required');
  }

  if (rules.email && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) errors.push('Invalid email format');
  }

  if (rules.minLength && value && value.length < rules.minLength) {
    errors.push(`Minimum ${rules.minLength} characters required`);
  }

  return errors;
};

module.exports = { validator };
