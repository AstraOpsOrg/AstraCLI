// AstraOps color palette

function colorText(text: string, color: string) {
  // GitHub Actions enables CI to true by default
  if (process.env.CI) {
    const basicColors: Record<string, string> = {
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      gray: '\x1b[37m',
      red: '\x1b[31m',
      white: '\x1b[37m',
      cyan: '\x1b[36m',
      magenta: '\x1b[35m',
    };
    const colorCode = basicColors[color] || basicColors['white'];
    return `${colorCode}${text}\x1b[0m`;
  }

  const ansi = Bun.color(color, "ansi");
  const reset = "\x1b[0m";
  return `${ansi}${text}${reset}`;
}

function bgColorText(text: string, colorName: string, fgColorName?: string) {
  // GitHub Actions enables CI to true by default
  if (process.env.CI) {
    const basicBgColors: Record<string, string> = {
      yellow: '\x1b[43m',
      red: '\x1b[41m',
      green: '\x1b[42m',
      blue: '\x1b[44m',
    };
    const basicFgColors: Record<string, string> = {
      white: '\x1b[37m',
      black: '\x1b[30m',
    };
    
    const bgColorCode = basicBgColors[colorName] || '';
    const fgColorCode = fgColorName ? (basicFgColors[fgColorName] || '') : '';
    
    return `${bgColorCode}${fgColorCode}${text}\x1b[0m`;
  }

  const customBgColors: Record<string, string> = {
    yellow: '#EEE82C',
    green: '#00ff99',
    blue: '#1e90ff',
  };
  const customFgColors: Record<string, string> = {
    black: '#2E2E2E',
    white: 'white',
  };

  const bgColorHex = customBgColors[colorName] || colorName;
  const fgColorHex = fgColorName ? (customFgColors[fgColorName] || fgColorName) : undefined;
  
  const bgRgb = Bun.color(bgColorHex, "{rgb}");
  if (!bgRgb) return text; 

  const bgAnsi = `\x1b[48;2;${bgRgb.r};${bgRgb.g};${bgRgb.b}m`;
  let fgAnsi = "";

  if (fgColorHex) {
    const fgRgb = Bun.color(fgColorHex, "{rgb}");
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
    yellow: (text: string) => bgColorText(text, "yellow", "black"),
    green: (text: string) => bgColorText(text, "green", "black"),
    blue: (text: string) => bgColorText(text, "blue", "white"),
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


