import pool from "../database/database";

export const expired_tree_evaluation = async (): Promise<void> => {
  try {
    let expired_node_parent: number | null = null;

    const expired_node = await pool.query(
      "select * from nodes where time < now() - interval '2 min';"
    );

    for (const node of expired_node.rows) {
      await pool.query(
        "UPDATE nodes SET status = 'expired' WHERE node_id = $1;",
        [node.node_id]
      );

      expired_node_parent = node.parent;

      while (expired_node_parent != null) {
        const node = await pool.query(
          "select * from nodes where node_id = $1",
          [expired_node_parent]
        );

        const update_recursion = await pool.query(
          "update nodes set status = 'expired' where node_id = $1;",
          [expired_node_parent]
        );

        expired_node_parent = node.rows[0].parent;
      }
    }
  } catch (error) {
    console.log(error);
  }
};
