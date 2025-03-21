import express, { type Express, type Request, type Response } from "express";
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
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		.then((response: any) => {
			//   remove the first two index because it's only label, not the data
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
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
	res.status(200).send(
		city
			? // biome-ignore lint/suspicious/noExplicitAny: <explanation>
				eventList.filter((event: any) =>
					event.event_city.toLowerCase().includes(city.toLocaleLowerCase()),
				)
			: eventList,
	);
});

app.get("/cities", async (req: Request, res: Response) => {
	// return unique cities
	const eventList = await sheet.spreadsheets.values
		.get({
			spreadsheetId: process.env.SPREADSHEET_ID,
			range: "Event",
		})
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		.then((response: any) => {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			return response.data.values?.slice(2).map((col: any[]) => {
				return col[3];
			});
		});
	const uniqueCities = [...new Set(eventList)];
	res.status(200).send(uniqueCities);
});

app.listen(port, () => {
	console.log("Server is running now!");
});

module.exports = app;
