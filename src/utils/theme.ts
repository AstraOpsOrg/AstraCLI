// AstraOps color palette

function colorText(text: string, color: string) {
  const ansi = Bun.color(color, "ansi");
  const reset = "\x1b[0m";
  return `${ansi}${text}${reset}`;
}

function bgColorText(text: string, bgColor: string, fgColor?: string) {
  const bgRgb = Bun.color(bgColor, "{rgb}");
  if (!bgRgb) return text; 

  const bgAnsi = `\x1b[48;2;${bgRgb.r};${bgRgb.g};${bgRgb.b}m`;
  let fgAnsi = "";

  if (fgColor) {
    const fgRgb = Bun.color(fgColor, "{rgb}");
    if (fgRgb) {
      fgAnsi = `\x1b[38;2;${fgRgb.r};${fgRgb.g};${fgRgb.b}m`;
    }
  }

  const reset = "\x1b[0m";
  return `${bgAnsi}${fgAnsi}${text}${reset}`;
}

const theme = {
  greenCustom: (text: string) => colorText(text, "#00ff99"),
  yellowCustom: (text: string) => colorText(text, "#EEE82C"),
  blueCustom: (text: string) => colorText(text, "#1e90ff"),  
  bg: {
    yellow: (text: string) => bgColorText(text, "#EEE82C", "#2E2E2E"),
    green: (text: string) => bgColorText(text, "#00ff99", "#2E2E2E"),
    blue: (text: string) => bgColorText(text, "#1e90ff", "white"),
  },
  gray: (text: string) => colorText(text, "gray"),
  red: (text: string) => colorText(text, "red"),
  white: (text: string) => colorText(text, "white"),
  cyan: (text: string) => colorText(text, "cyan"),
  magenta: (text: string) => colorText(text, "magenta"),
  green: (text: string) => colorText(text, "green"),
  yellow: (text: string) => colorText(text, "yellow"),
  blue: (text: string) => colorText(text, "blue"),
  bold: (text: string) => `\x1b[1m${text}\x1b[22m`,
  dim: (text: string) => `\x1b[2m${text}\x1b[22m`,
};

export default theme;


