import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

export default function DenseIssueTable(rows, onClick) {
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  rows = rows.sort((a, b) => {
    return new Date(b.openedAt) - new Date(a.openedAt);
  });
  rows = rows.slice(0, 30);
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 750 }} aria-label="a dense table">
        <TableHead>
          <TableRow
            sx={{
              background: "lightgray",
            }}
          >
            <TableCell sx={{ fontWeight: "bold" }} align="left">
              ID
            </TableCell>
            <TableCell sx={{ fontWeight: "bold" }} align="left">
              Title
            </TableCell>
            <TableCell sx={{ fontWeight: "bold" }} align="left">
              Status
            </TableCell>
            <TableCell sx={{ fontWeight: "bold" }} align="left">
              Creation&nbsp;Date
            </TableCell>
            <TableCell sx={{ fontWeight: "bold" }} align="left">
              Created &nbsp;by
            </TableCell>
            <TableCell sx={{ fontWeight: "bold" }} align="left">
              Container&nbsp;ID
            </TableCell>
            <TableCell sx={{ fontWeight: "bold" }} align="left">
              Description
            </TableCell>
            <TableCell sx={{ fontWeight: "bold" }} align="left">
              Is&nbsp;Published?
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow
              key={index}
              sx={{
                "&:last-child td, &:last-child th": { border: 0 },

                cursor: "pointer",
                "&:hover": {
                  background: "lightblue",
                },
              }}
              onClick={() => onClick(row)}
            >
              <TableCell align="left">{row.displayId}</TableCell>

              <TableCell align="left">{row.title}</TableCell>
              <TableCell align="left">{row.status}</TableCell>
              <TableCell align="left">{formatDate(row.openedAt)}</TableCell>
              <TableCell align="left">{row.openedBy}</TableCell>
              <TableCell align="left">{row.containerId}</TableCell>
              <TableCell align="left">{row.description}</TableCell>
              <TableCell align="left">{row.published + ""}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
