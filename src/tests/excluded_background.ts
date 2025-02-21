import pool from "../database/database";

export const expired_tree_evaluation = async (): Promise<void> => {
  try {
    let expired_node_parent: number | null = null;

    const expired_node = await pool.query(
      "SELECT * FROM nodes WHERE time < NOW() - INTERVAL '1 minutes';"
    );

    console.log(expired_node.rows);

    for (const node of expired_node.rows) {
      // Check if the node exists in rules
      const rule_check = await pool.query(
        "SELECT 1 FROM rules WHERE parent_node_id = $1 LIMIT 1;",
        [node.node_id]
      );

      if (rule_check.rowCount === 0) {
        continue; // Skip this node if it is not in rules
      }

      // Update the node to expired
      await pool.query(
        "UPDATE nodes SET status = 'expired' WHERE node_id = $1;",
        [node.node_id]
      );

      expired_node_parent = node.parent;

      while (expired_node_parent != null) {
        // Check if parent exists in rules before updating
        const parent_rule_check = await pool.query(
          "SELECT 1 FROM rules WHERE parent_node_id = $1 LIMIT 1;",
          [expired_node_parent]
        );

        if (parent_rule_check.rowCount === 0) {
          break; // Stop updating further if parent is not in rules
        }

        const parent_node = await pool.query(
          "SELECT * FROM nodes WHERE node_id = $1",
          [expired_node_parent]
        );

        console.log(parent_node.rows);

        await pool.query(
          "UPDATE nodes SET status = 'expired' WHERE node_id = $1;",
          [expired_node_parent]
        );

        expired_node_parent = parent_node.rows[0].parent;
      }
    }
  } catch (error) {
    console.log(error);
  }
};
