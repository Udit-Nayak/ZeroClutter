import React from "react";

function GmailToolbar({
  onFetch,
  onFetchLarge,
  onFetchTrash,
  trashMode,
  onClearTrashMode,
  onFetchSpam,
  onDateFilter,
  showFilters,
  onFetchDuplicates,
  onFetchPromotions,
  onFetchAIScan,
}) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <button onClick={onFetch}>Fetch Emails</button>
        <button onClick={trashMode ? onClearTrashMode : onFetchTrash}>
          {trashMode ? "Back to Inbox" : "Emails in Trash"}
        </button>
        <button onClick={onFetchSpam}>Spam Emails</button>
        <button onClick={onFetchDuplicates}>Show Duplicates</button>
        <button onClick={onFetchPromotions}>Clean Up Promotions</button>
        <button onClick={onFetchAIScan}>AI Scan</button>{" "}
      </div>

      {showFilters && (
        <div
          style={{
            marginTop: "0.8rem",
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <select onChange={(e) => onDateFilter(e.target.value)}>
            <option value="all">All Dates</option>
            <option value="1m">Last 1 Month</option>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last 1 Year</option>
            <option value="2y">Last 2 Years</option>
            <option value="3y">Last 3 Years</option>
          </select>

          <select onChange={(e) => onFetchLarge(e.target.value)}>
            <option value="all">All large attachments</option>
            <option value=">20">Larger than 20 MB</option>
            <option value="10-20">10 MB to 20 MB</option>
            <option value="<10">Smaller than 10 MB</option>
          </select>
        </div>
      )}
    </div>
  );
}

export default GmailToolbar;
