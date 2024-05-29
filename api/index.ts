import express, { Express, Request, Response } from "express";
import { google } from "googleapis";
import dotenv from "dotenv";

const app: Express = express();
const port = 3000;
dotenv.config();
const sheet = google.sheets({ version: "v4", auth: process.env.KEY });

app.get("/", async (req: Request, res: Response) => {
  // recieve query param named city
  const city = req.query.city as string;
  const eventList = await sheet.spreadsheets.values
    .get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "Event",
    })
    .then((response: any) => {
      //   remove the first two index because it's only label, not the data
      if (city) {
        return response.data.values?.slice(2).map((col: any[]) => {
          if (col[3].toLowerCase().includes(city.toLowerCase())) {
            return {
              event_date: col[0],
              event_name: col[4],
              event_city: col[3],
              event_location: col[2],
              event_info_link: col[6],
            };
          }
        });
      }
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

app.get("/cities", async (req: Request, res: Response) => {
  // return unique cities
  const eventList = await sheet.spreadsheets.values
    .get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "Event",
    })
    .then((response: any) => {
      return response.data.values?.slice(2).map((col: any[]) => {
        return col[3];
      });
    });
  const uniqueCities = [...new Set(eventList)];
  res.status(200).send(uniqueCities);
});

app.listen(port, () => {
  console.log(`Server is running now!`);
});

module.exports = app;
