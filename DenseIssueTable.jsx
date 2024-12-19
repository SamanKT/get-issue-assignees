import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { Typography } from "@mui/material";

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
    <TableContainer component={Paper} sx={{ maxHeight: 440, maxWidth: 800 }}>
      <Typography variant="h6" gutterBottom component="div">
        Recent Issues
      </Typography>
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
              Description
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

              <TableCell align="left">{row.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
