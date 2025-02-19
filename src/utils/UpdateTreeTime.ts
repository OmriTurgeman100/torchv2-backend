import pool from "../database/database";
import moment from "moment-timezone";

const nowUtc = moment.utc();
const nowIsrael = nowUtc.tz("Asia/Jerusalem");

const currentDateTime: string = nowIsrael.format("YYYY-MM-DD HH:mm"); // Includes date, hour, and minutes



export default { currentDateTime };

