import { IniFile } from "./iniFile";

export interface GeckoCode {
  name: string;
  creator: string | null;
  notes: string[];
  codeLines: string[];
  enabled: boolean;
  defaultEnabled: boolean;
  userDefined: boolean;
}

// this is very similar to LoadCodes in GeckoCodeConfig.cpp, but skips the address and data because we don't need them
export function LoadGeckoCodes(globalIni: IniFile, localIni?: IniFile): GeckoCode[] {
  const gcodes: GeckoCode[] = [];
  [globalIni, localIni].forEach((ini) => {
    if (ini === undefined) {
      return;
    }
    const lines: string[] = ini.getLines("Gecko", false).filter((line) => {
      return line.length === 0 || line[0] === "#";
    });
    let gcode: GeckoCode = {
      name: "",
      creator: "",
      enabled: false,
      defaultEnabled: false,
      userDefined: ini === localIni,
      notes: [],
      codeLines: [],
    };

    lines.forEach((line) => {
      switch (line[0]) {
        // code name
        case "$": {
          if (gcode.name.length > 0) {
            gcodes.push(gcode);
          }
          line = line.slice(1); // cut out the $

          const creatorMatch = line.match(/\[(.*?)\]/); // searches for brackets, catches anything inside them
          const creator = creatorMatch !== null ? creatorMatch[1] : creatorMatch;
          const name = creator ? line.split("[")[0] : line;

          gcode = {
            ...gcode,
            name: name,
            creator: creator,
            notes: [],
            codeLines: [],
          };
          break;
        }
        // comments
        case "*": {
          gcode.notes.push(line.slice(1));
          break;
        }
        default: {
          gcode.codeLines.push(line);
        }
      }
    });
    if (gcode.name.length > 0) {
      gcodes.push(gcode);
    }

    //update enabled flags

    //set default enabled
    if (ini === globalIni) {
      gcodes.forEach((gcode) => {
        gcode.defaultEnabled = gcode.enabled;
      });
    }
  });
  return gcodes;
}

function _makeGeckoCodeTitle(code: GeckoCode): string {
  const title = `$${code.name}`;
  if (code.creator !== null && code.creator.length > 0) {
    return `${title} [${code.creator}]`;
  }
  return title;
}
