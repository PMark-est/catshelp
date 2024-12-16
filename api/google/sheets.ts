import { sheets } from "./auth.ts";
import process from "node:process";

export const getSheet = (sheetID?: string, ranges?: string[]) => {
  return sheets.spreadsheets.get({
    spreadsheetId: sheetID,
    ranges: ranges,
    includeGridData: true,
    key: process.env.GOOGLE_API_KEY,
  });
};

export const appendToSheet = (
  spreadsheetId?: string,
  range?: string,
  values?: any
) => {
  return sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    resource: {
      values,
    },
  });
};
