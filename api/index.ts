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
			if (month && event.event_date) {
				try {
					// Parse the event date (assuming format like "21 Mar 2025" or Indonesian format)
					const dateParts = event.event_date.split(" ");
					if (dateParts.length >= 2) {
						// Indonesian month names (full and abbreviated)
						const indonesianMonthNames = [
							"januari",
							"februari",
							"maret",
							"april",
							"mei",
							"juni",
							"juli",
							"agustus",
							"september",
							"oktober",
							"november",
							"desember",
						];

						const indonesianShortMonthNames = [
							"jan",
							"feb",
							"mar",
							"apr",
							"mei",
							"jun",
							"jul",
							"agu",
							"sep",
							"okt",
							"nov",
							"des",
						];

						// English month names (for compatibility)
						const englishMonthNames = [
							"january",
							"february",
							"march",
							"april",
							"may",
							"june",
							"july",
							"august",
							"september",
							"october",
							"november",
							"december",
						];

						const englishShortMonthNames = [
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

						// Get month index from event date
						const eventMonthStr = dateParts[1].toLowerCase();
						let eventMonth = -1;

						// Try to match with Indonesian month names
						const indoMonthIndex = indonesianMonthNames.findIndex(
							(m) => eventMonthStr.includes(m) || m.includes(eventMonthStr),
						);

						if (indoMonthIndex !== -1) {
							eventMonth = indoMonthIndex;
						} else {
							// Try with Indonesian short month names
							const indoShortMonthIndex = indonesianShortMonthNames.findIndex(
								(m) => eventMonthStr.includes(m) || m.includes(eventMonthStr),
							);

							if (indoShortMonthIndex !== -1) {
								eventMonth = indoShortMonthIndex;
							} else {
								// Fallback to English month names
								const engMonthIndex = englishMonthNames.findIndex(
									(m) => eventMonthStr.includes(m) || m.includes(eventMonthStr),
								);

								if (engMonthIndex !== -1) {
									eventMonth = engMonthIndex;
								} else {
									// Try with English short month names
									const engShortMonthIndex = englishShortMonthNames.findIndex(
										(m) =>
											eventMonthStr.includes(m) || m.includes(eventMonthStr),
									);

									if (engShortMonthIndex !== -1) {
										eventMonth = engShortMonthIndex;
									}
								}
							}
						}

						// Process query month
						const queryMonthLower = month.toLowerCase();
						let queryMonth = -1;

						// Try direct number parsing first (0-11)
						const monthNum = Number.parseInt(month);
						if (!Number.isNaN(monthNum) && monthNum >= 0 && monthNum <= 11) {
							queryMonth = monthNum;
						} else {
							// Try to match with month names
							for (let i = 0; i < 12; i++) {
								if (
									indonesianMonthNames[i].includes(queryMonthLower) ||
									queryMonthLower.includes(indonesianMonthNames[i]) ||
									indonesianShortMonthNames[i].includes(queryMonthLower) ||
									queryMonthLower.includes(indonesianShortMonthNames[i]) ||
									englishMonthNames[i].includes(queryMonthLower) ||
									queryMonthLower.includes(englishMonthNames[i]) ||
									englishShortMonthNames[i].includes(queryMonthLower) ||
									queryMonthLower.includes(englishShortMonthNames[i])
								) {
									queryMonth = i;
									break;
								}
							}
						}

						// Compare months if both were successfully parsed
						if (eventMonth !== -1 && queryMonth !== -1) {
							monthMatch = eventMonth === queryMonth;
						} else {
							// If parsing failed, fall back to string comparison
							monthMatch =
								eventMonthStr.includes(queryMonthLower) ||
								queryMonthLower.includes(eventMonthStr);
						}
					}
				} catch (e) {
					// If date parsing fails, fall back to false for this entry
					monthMatch = false;
				}
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
