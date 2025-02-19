import pool from "../database/database";
import moment from "moment-timezone";

const nowUtc = moment.utc();
const nowIsrael = nowUtc.tz("Asia/Jerusalem");

const currentDateTime: string = nowIsrael.format("YYYY-MM-DD HH:mm");

export const expired_tree_evaluation = async (parent: number) => {
  try { 

    

    console.log(parent)
    // const tree = await pool.query("")
  } catch (error) {
    console.log(error);
  }
};
