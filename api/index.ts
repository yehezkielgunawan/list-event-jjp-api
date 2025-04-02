import express, { type Express, type Request, type Response } from "express";
import { google } from "googleapis";
import dotenv from "dotenv";

const app: Express = express();
const port = 3000;
dotenv.config();
const sheet = google.sheets({ version: "v4", auth: process.env.KEY });

type APIResponse = {
	event_date: string;
	event_name: string;
	event_city: string;
	event_location: string;
	event_info_link: string;
};
type EventList = APIResponse[] | undefined;

app.get("/", async (req: Request, res: Response) => {
	// recieve query param named city
	const city = req.query.city as string;
	const month = req.query.month as string;
	const eventList: EventList = await sheet.spreadsheets.values
		.get({
			spreadsheetId: process.env.SPREADSHEET_ID,
			range: "Event",
		})
		.then((response) => {
			//   remove the first two index because it's only label, not the data
			return response.data.values?.slice(2).map((col) => {
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
		eventList?.filter((event) => {
			// Filter by city if provided
			const cityMatch =
				!city || event.event_city?.toLowerCase().includes(city.toLowerCase());

			// Filter by month if provided
			let monthMatch = true;
			if (month) {
				// Convert month parameter to standard format for comparison
				const monthNames = [
					"jan",
					"feb",
					"mar",
					"apr",
					"may",
					"jun",
					"jul",
					"aug",
					"sep",
					"oct",
					"nov",
					"dec",
				];

				// Get month abbreviation from event_date (assuming format like "21 Mar 2025")
				const eventMonthStr = event.event_date?.split(" ")[1]?.toLowerCase();

				// Compare with case insensitivity and support for partial matches
				monthMatch = monthNames.some(
					(m) =>
						(m.includes(month.toLowerCase()) ||
							month.toLowerCase()?.includes(m)) &&
						eventMonthStr?.includes(m),
				);
			}

			return cityMatch && monthMatch;
		}),
	);
});

app.get("/cities", async (req: Request, res: Response) => {
	// return unique cities
	const eventList = await sheet.spreadsheets.values
		.get({
			spreadsheetId: process.env.SPREADSHEET_ID,
			range: "Event",
		})
		.then((response) => {
			return response.data.values?.slice(2).map((col) => {
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
