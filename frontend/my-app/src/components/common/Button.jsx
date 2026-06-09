import { Button as MuiButton } from '@mui/material';

const Button = ({ children, ...props }) => (
  <MuiButton variant="contained" {...props}>
    {children}
  </MuiButton>
);

export default Button;