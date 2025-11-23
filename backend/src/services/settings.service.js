const db = require("../core/database");

const getSettings = async () => {
  const result = await db.execute("SELECT * FROM settings");
  const settings = {};
  result.rows.forEach(row => {
    try {
      const parsed = JSON.parse(row.value);
      settings[row.key] = parsed.value; 
    } catch (e) {
      settings[row.key] = row.value;
    }
  });
  return settings;
};

const updateSetting = async (key, value) => {
  const jsonValue = JSON.stringify({ value });
  await db.execute({
    sql: "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?",
    args: [key, jsonValue, jsonValue]
  });
  return getSettings();
};

module.exports = { getSettings, updateSetting };