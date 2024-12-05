import express from "express";
import mysql from "mysql2";
import cors from "cors";
import * as jwt from "jsonwebtoken";
import * as utils from "./utils.ts";
import * as dotenv from "dotenv";
import { CatFormData } from "../src/types.ts";
import { google } from "googleapis";
import { join } from "https://deno.land/std/path/mod.ts";
import fs from "node:fs";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Get the equivalent of __dirname
const __filename = new URL(import.meta.url).pathname;
const __dirname = __filename.substring(0, __filename.lastIndexOf("/")); // Get the directory path

const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json",
  scopes: "https://www.googleapis.com/auth/drive",
});

const client = await auth.getClient();

const drive = google.drive({
  version: "v3",
  auth: client,
});

app.use("/public", express.static(join(__dirname, "public")));

const createDriveFolder = (catName: string) => {
  var fileMetadata = {
    name: catName,
    mimeType: "application/vnd.google-apps.folder",
    parents: ["1_WfzFwV0623sWtsYwkp8RiYnCb2_igFd"],
    driveId: "0AAcl4FOHQ4b9Uk9PVA",
  };
  return drive.files.create({
    supportsAllDrives: true,
    requestBody: fileMetadata,
    fields: "id",
  });
};

const uploadToDrive = async (
  filename: string,
  filestream: fs.ReadStream,
  driveId: string
) => {
  const mimeTypes = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    bmp: "image/bmp",
    tiff: "image/tiff",
    svg: "image/svg+xml",
  };
  const lastDotIndex = filename.lastIndexOf(".");
  const ext = filename.slice(lastDotIndex + 1).toLowerCase();

  const requestBody = {
    name: filename,
    fields: "id",
    parents: [driveId],
  };

  const media = {
    mimetype: mimeTypes[ext],
    body: filestream,
  };

  try {
    const file = await drive.files.create({
      supportsAllDrives: true,
      requestBody,
      media: media,
      uploadType: "resumable",
      fields: "id",
    });
    return file.data.id;
  } catch (err) {
    // TODO(developer) - Handle error
    throw err;
  }
};

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "ch",
});

app.post("/api/login", (req: any, res: any) => {
  const body = req.body;
  const id = body.id;
  const email = body.email;
  console.log(email);
  utils.sendRequest(id, email);
  res.json("Success");
});

app.get("/api/verify", (req: any, res: any) => {
  const token = req.query.token;
  if (token == null) return res.sendStatus(401);
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    return res.redirect("/dashboard");
  } catch (e) {
    res.sendStatus(401);
  }
});

// TODO:
// 1. query paramina hooldekodu nime kaudu otsimine
// 2. meelespea tabel
app.get("/api/animals/dashboard", async (req, res) => {
  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });

  const client = await auth.getClient();

  const sheets = google.sheets({
    version: "v4",
    auth: client,
  });

  const SHEETS_ID = process.env.CATS_SHEETS_ID;

  const rows = await sheets.spreadsheets.get({
    auth: auth,
    spreadsheetId: SHEETS_ID,
    ranges: ["HOIUKODUDES"],
    includeGridData: true,
  });

  const random = rows.data.sheets![0].data;
  const columnNamesWithIndexes: { [key: string]: number } = {};

  random![0].rowData![0].values!.forEach((col, idx) => {
    if (!col.formattedValue) return;
    columnNamesWithIndexes[col.formattedValue!] = idx;
  });

  const fosterhomeCats: { [key: string]: any } = {};

  const pattern = new RegExp("(?<=/d/).+(?=/)");

  random?.forEach((grid) => {
    grid.rowData!.forEach(async (row) => {
      const fosterhome =
        row.values![columnNamesWithIndexes["_HOIUKODU/ KLIINIKU NIMI"]];
      if (fosterhome.formattedValue! !== "Mari Oks") return;

      const values = row.values!;
      fosterhomeCats["name"] =
        values[columnNamesWithIndexes["KASSI NIMI"]].formattedValue;
      fosterhomeCats["image"] = `${fosterhomeCats["name"]}.png`;
      const imageID =
        values[columnNamesWithIndexes["PILT"]].hyperlink!.match(pattern)![0];
      console.log(imageID);

      const file = await drive.files.get(
        {
          supportsAllDrives: true,
          fileId: imageID,
          alt: "media",
        },
        { responseType: "stream" }
      );
      const destination = fs.createWriteStream(
        `./public/${fosterhomeCats["name"]}.png`
      );

      await new Promise((resolve) => {
        file.data.pipe(destination);

        destination.on("finish", () => {
          console.log("Image saved successfully!");
          resolve(true);
        });
      });
      console.log("finished");
    });
  });

  return res.json(fosterhomeCats);
});

app.post("/api/animals", async (req: any, res: any) => {
  const formData: CatFormData = req.body;
  const rescueDate = formData.leidmis_kp;

  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });

  const client = await auth.getClient();

  const sheets = google.sheets({
    version: "v4",
    auth: client,
  });

  const SHEETS_ID = process.env.CATS_SHEETS_ID;

  db.beginTransaction((err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Insert into animals table
    const animalQuery = `
      INSERT INTO animals
      (name, birthday, description, status, chip_number, chip_registered_with_us)
      VALUES (NULL, NULL, NULL, NULL, NULL, NULL)
    `;

    db.query(animalQuery, async (err, animalResult) => {
      if (err) {
        return db.rollback(() => res.status(500).json({ error: err.message }));
      }
      const animalId = animalResult.insertId;

      delete formData.pildid;
      const a = { id: animalId, ...formData };

      await sheets.spreadsheets.values.append({
        auth: auth,
        spreadsheetId: SHEETS_ID,
        range: "HOIUKODUDES",
        valueInputOption: "RAW",
        resource: {
          values: [Object.values(a)],
        },
      });

      // Insert into animal_rescues table
      const rescueQuery = `
        INSERT INTO animal_rescues
        (rank_nr, rescue_date, location, location_notes)
        VALUES (NULL, ?, NULL, NULL)
      `;
      db.query(rescueQuery, [rescueDate || null], (err, rescueResult) => {
        if (err) {
          return db.rollback(() =>
            res.status(500).json({ error: err.message })
          );
        }

        const rescueId = rescueResult.insertId;

        // Link the animal and the rescue in the animals_to_animal_rescues table
        const linkQuery = `
          INSERT INTO animals_to_animal_rescues
          (animal_id, animal_rescue_id)
          VALUES (?, ?)
        `;
        db.query(linkQuery, [animalId, rescueId], (err) => {
          if (err) {
            return db.rollback(() =>
              res.status(500).json({ error: err.message })
            );
          }

          db.commit((err) => {
            if (err) {
              return db.rollback(() =>
                res.status(500).json({ error: err.message })
              );
            }

            res.json({
              id: rescueId,
            });
          });
        });
      });
    });
  });
});

app.post("/api/pilt/lisa", async (req, res) => {
  try {
    const catName = req.get("Cat-Name");
    const driveFolder = await createDriveFolder(catName);
    const folderID = driveFolder.data.id;
    let uploadedFiles = req.files.images;

    uploadedFiles = Array.isArray(uploadedFiles)
      ? uploadedFiles
      : [uploadedFiles];

    uploadedFiles.forEach((file, idx) => {
      const tempPath = file.tempFilePath;
      uploadToDrive(catName, fs.createReadStream(tempPath), folderID!);
    });

    return res.json("Pildid laeti üles edukalt");
  } catch (error) {
    return res.error("Tekkis tõrge piltide üles laadimisega:", error);
  }
});

app.listen(process.env.BACKEND_PORT, () => {
  console.log("connected to backend!");
});
