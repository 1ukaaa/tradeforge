const db = require("../core/database");

const getPlan = async () => {
  const result = await db.execute("SELECT * FROM plans WHERE id = 1");
  const row = result.rows[0];
  if (!row) return null;
  return { ...row, data: JSON.parse(row.data) };
};

const updatePlan = async (data) => {
  const timestamp = new Date().toISOString();
  await db.execute({
    sql: "UPDATE plans SET data = ?, updatedAt = ? WHERE id = 1",
    args: [JSON.stringify(data), timestamp],
  });
  return getPlan();
};

module.exports = { getPlan, updatePlan };