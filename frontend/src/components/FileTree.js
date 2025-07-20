import React from "react";

const formatSize = (bytes) => {
  if (!bytes || bytes === "0") return "0 B";
  const k = 1024;
  const dm = 2;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const FileTree = ({
  nodes,
  showDuplicates,
  onDeleteDuplicate,
  source = "drive",
}) => {
  if (!nodes || nodes.length === 0) return <p>No files to display.</p>;
  const isLocal = source === "local";

  if (showDuplicates) {
    return (
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={styles.header}>Name</th>
            <th style={styles.header}>Size</th>
            <th style={styles.header}>No. of Copies</th>
            <th style={styles.header}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((node) => (
            <tr key={node.file_id || node.local_id || node.name}>
              <td style={styles.cell}>
                {isLocal ? (
                  <span style={{ color: "black" }}>{node.name}</span>
                ) : (
                  <a
                    href={`https://drive.google.com/file/d/${node.file_id}/view`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "blue", textDecoration: "none" }}
                  >
                    {node.name}
                  </a>
                )}
              </td>
              <td style={styles.cell}>{formatSize(node.size)}</td>
              <td style={styles.cell}>{node.duplicate_count}</td>
              <td style={styles.cell}>
                <button
                  onClick={() =>
                    onDeleteDuplicate(
                      node.name,
                      node.size,
                      node.content_hash,
                      isLocal ? "local" : "drive"
                    )
                  }
                  style={{
                    padding: "4px 8px",
                    backgroundColor: "#dc3545",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  {isLocal ? "Suggest Deletion" : "Delete Duplicates"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  const renderTree = (node) => {
    const isFolder = node.mime_type === "application/vnd.google-apps.folder";

    return (
      <li key={node.file_id || node.local_id || node.name}>
        {isFolder ? (
          <strong>{node.name}</strong>
        ) : isLocal ? (
          <span style={{ color: "black" }}>{node.name}</span>
        ) : (
          <a
            href={`https://drive.google.com/file/d/${node.file_id}/view`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none", color: "blue" }}
          >
            {node.name}
          </a>
        )}
        {node.children && node.children.length > 0 && (
          <ul>{node.children.map(renderTree)}</ul>
        )}
      </li>
    );
  };

  return <ul>{nodes.map(renderTree)}</ul>;
};

const styles = {
  header: {
    border: "1px solid #ddd",
    padding: "8px",
    backgroundColor: "#f2f2f2",
    fontWeight: "bold",
    textAlign: "left",
  },
  cell: {
    border: "1px solid #ddd",
    padding: "8px",
  },
};

export default FileTree;