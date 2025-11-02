import { Box, LinearProgress, Typography } from '@mui/material';
import { getPasswordStrength } from '../utils/validation';

const PasswordStrengthMeter = ({ password }) => {
  const strength = getPasswordStrength(password);
  
  return (
    <Box sx={{ width: '100%', mt: 1 }}>
      <LinearProgress
        variant="determinate"
        value={(strength.score / 5) * 100}
        color={strength.color}
        sx={{ height: 8, borderRadius: 4 }}
      />
      <Typography
        variant="caption"
        color={`${strength.color}.main`}
        sx={{ display: 'block', mt: 0.5 }}
      >
        Password Strength: {strength.label}
      </Typography>
    </Box>
  );
};

export default PasswordStrengthMeter;