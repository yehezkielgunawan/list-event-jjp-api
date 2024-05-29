import express, { Express, Request, Response } from "express";
import { google } from "googleapis";
import dotenv from "dotenv";

const app: Express = express();
const port = 3000;
dotenv.config();

app.get("/", async (req: Request, res: Response) => {
  const sheet = google.sheets({ version: "v4", auth: process.env.KEY });

  const eventList = await sheet.spreadsheets.values
    .get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "Event",
    })
    .then((response: any) => {
      //   remove the first two index because it's only label, not the data
      return response.data.values?.slice(2).map((col: any[]) => {
        return {
          event_date: col[0],
          event_name: col[4],
          event_city: col[3],
          event_location: col[2],
          event_info_link: col[6],
        };
      });
    });
  res.status(200).send(eventList);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
