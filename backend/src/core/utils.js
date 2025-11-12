// backend/src/core/utils.js

const serializeMetadata = (metadata) => {
  try {
    return JSON.stringify(metadata || {});
  } catch {
    return "{}";
  }
};

const parseMetadata = (value) => {
  try {
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
};

module.exports = {
  serializeMetadata,
  parseMetadata,
};