import express, { Express, Request, Response } from "express";
import { google } from "googleapis";
import dotenv from "dotenv";
import swaggerjsdoc from "swagger-jsdoc";
import swaggerui from "swagger-ui-express";

const app: Express = express();
const port = 3000;
dotenv.config();
const sheet = google.sheets({ version: "v4", auth: process.env.KEY });

/**
 * @swagger
 * /list-events:
 *   get:
 *     summary: Returns a list of events
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: The city to filter events by
 *     responses:
 *       200:
 *         description: The list of events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   event_date:
 *                     type: string
 *                   event_name:
 *                     type: string
 *                   event_city:
 *                     type: string
 *                   event_location:
 *                     type: string
 *                   event_info_link:
 *                     type: string
 *             examples:
 *               - event_date: "2022-01-01"
 *                 event_name: "New Year Celebration"
 *                 event_city: "New York"
 *                 event_location: "Central Park"
 *                 event_info_link: "http://example.com"
 */
app.get("/list-events", async (req: Request, res: Response) => {
  // recieve query param named city
  const city = req.query.city as string;
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
  res
    .status(200)
    .send(
      city
        ? eventList.filter((event: any) =>
            event.event_city.toLowerCase().includes(city.toLocaleLowerCase())
          )
        : eventList
    );
});

/**
 * @swagger
 * /cities:
 *   get:
 *     summary: Returns a list of unique cities
 *     responses:
 *       200:
 *         description: The list of unique cities
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *             example:
 *               - "Jakarta"
 *               - "Bogor"
 */
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

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Info Event Jejepangan Open API",
      version: "1.0.0",
      description: "Made using Express JS and Google Sheet API",
    },
    servers: [
      {
        url: process.env.BASE_URL,
      },
    ],
  },
  apis: ["./api/index.ts"],
  customCssUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.4.2/swagger-ui.css",
};
const specs = swaggerjsdoc(options);
app.use("/", swaggerui.serve, swaggerui.setup(specs));

app.listen(port, () => {
  console.log(`Server is running now!`);
});

module.exports = app;
