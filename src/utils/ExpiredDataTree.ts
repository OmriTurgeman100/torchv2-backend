import pool from "../database/database";
import moment from "moment-timezone";

const nowUtc = moment.utc();
const nowIsrael = nowUtc.tz("Asia/Jerusalem");

const currentDateTime: string = nowIsrael.format("YYYY-MM-DD HH:mm");

export const UpdateTreeTimeRecursion = async (
  parent: number
): Promise<void> => {
  try {
    let modified_parent: number = parent;

    while (modified_parent != null) {
      const request = await pool.query(
        "select * from nodes where node_id = $1;",
        [modified_parent]
      );

      const update_tree_time = await pool.query(
        "update nodes set time = now() where node_id = $1",
        [modified_parent]
      );

      modified_parent = request.rows[0].parent;
    }
  } catch (error) {
    console.error(error);
  }
};
