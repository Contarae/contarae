export function buildStorageInventory(records = [], files = [], { date = new Date(), minimumAgeDays = 30 } = {}) {
  const referenced = new Set();
  const walk = value => {
    if (typeof value === "string") referenced.add(value);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === "object") Object.values(value).forEach(walk);
  };
  records.forEach(walk);
  return files.map(file => {
    const uploadedAt = file.metadata?.uploadedAt || file.metadata?.issuedAt;
    const timestamp = Date.parse(uploadedAt || "");
    const ageDays = Number.isFinite(timestamp) ? Math.floor((date.getTime() - timestamp) / 86400000) : null;
    const attachment = /^(supports|issued|documents|payment-supports)\//.test(file.key);
    const status = referenced.has(file.key) ? "referenced"
      : !attachment ? "protected"
      : ageDays === null ? "unknown_age"
      : ageDays < minimumAgeDays ? "recent"
      : "review_candidate";
    return { key: file.key, status, ageDays, size: file.size || file.bytes || file.metadata?.size || 0 };
  });
}
