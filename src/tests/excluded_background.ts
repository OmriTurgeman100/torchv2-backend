import pool from "../database/database";

export const expired_tree_evaluation = async (): Promise<void> => {
  try {
    let expired_node_parent: number | null = null;

    const expired_node = await pool.query(
      "SELECT * FROM nodes WHERE time < NOW() - INTERVAL '30 minutes' AND excluded = 'false';"
    );

    for (const node of expired_node.rows) {
      const rule_check = await pool.query(
        "SELECT 1 FROM rules WHERE parent_node_id = $1 LIMIT 1;",
        [node.node_id]
      );

      if (rule_check.rowCount === 0) {
        continue;
      }

      await pool.query(
        "UPDATE nodes SET status = 'expired' WHERE node_id = $1;",
        [node.node_id]
      );

      expired_node_parent = node.parent;

      while (expired_node_parent != null) {
        const parent_rule_check = await pool.query(
          "SELECT 1 FROM rules WHERE parent_node_id = $1 LIMIT 1;",
          [expired_node_parent]
        );

        if (parent_rule_check.rowCount === 0) {
          break;
        }

        const parent_node = await pool.query(
          "SELECT * FROM nodes WHERE node_id = $1 AND excluded = 'false';",
          [expired_node_parent]
        );

        await pool.query(
          "UPDATE nodes SET status = 'expired' WHERE node_id = $1;",
          [expired_node_parent]
        );

        expired_node_parent = parent_node.rows[0].parent;
      }
    }
  } catch (error) {
    console.error(error);
  }
};

// ! not safe for production yet