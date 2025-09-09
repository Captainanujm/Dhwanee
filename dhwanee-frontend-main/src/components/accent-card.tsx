import { Card, CardProps, alpha } from "@mui/material";

export default function AccentCard(props: CardProps) {
  const { children, sx, ...others } = props;
  return (
    <Card
      sx={[(theme) => ({
        background: alpha(theme.palette.primary.light, 0.1),
      }), sx as any]}
      elevation={0}
      {...others}
    >
      {children}
    </Card>
  );
}
