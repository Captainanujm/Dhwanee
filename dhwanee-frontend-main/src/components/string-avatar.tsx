import { Avatar } from "@mui/material";

function stringToColor(string: string) {
  let hash = 0;
  let i;

  /* eslint-disable no-bitwise */
  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = "#";

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  /* eslint-enable no-bitwise */

  return color;
}

export default function StringAvatar(props: { children: string }) {
  return (
    <Avatar
      sx={{
        bgcolor: stringToColor(props.children),
      }}
    >
      {props.children.split(" ")[0][0]}
      {props.children.split(" ").length > 1
        ? props.children.split(" ")[1][0]
        : ""}
    </Avatar>
  );
}
