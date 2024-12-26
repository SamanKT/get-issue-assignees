"use client";
import * as React from "react";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import { Typography } from "@mui/material";

const columns = [
  { id: "name", label: "Name of Project", minWidth: 100 },
  { id: "platform", label: "Platform", minWidth: 50 },
  {
    id: "memberCount",
    label: "Number of Members",
    minWidth: 50,
    align: "right",
  },
  {
    id: "id",
    label: "Project unique ID",
    minWidth: 170,
    align: "right",
  },
];

export default function ProjectsTable({ rows, onRowClick }) {
  const rowRef = React.useRef([]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  return (
    <Paper
      sx={{ width: "100%", overflow: "hidden", mb: 4 }}
      suppressHydrationWarning
    >
      <TableContainer sx={{ maxHeight: 440 }} suppressHydrationWarning>
        <Typography
          variant="h6"
          gutterBottom
          component="div"
          suppressHydrationWarning
        >
          Projects
        </Typography>
        <Table stickyHeader aria-label="sticky table" suppressHydrationWarning>
          <TableHead suppressHydrationWarning>
            <TableRow suppressHydrationWarning>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                  sx={{ backgroundColor: "lightgray", fontWeight: "bold" }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody suppressHydrationWarning>
            {rows
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => {
                return (
                  <TableRow
                    suppressHydrationWarning
                    hover
                    ref={(ref) => rowRef.current.push({ [index]: ref })}
                    role="checkbox"
                    tabIndex={-1}
                    key={row.name}
                    sx={{
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      onRowClick(row);
                    }}
                  >
                    {columns.map((column) => {
                      const value = row[column.id];
                      return (
                        <TableCell key={column.id} align={column.align}>
                          {column.format && typeof value === "number"
                            ? column.format(value)
                            : value}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 100]}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        suppressHydrationWarning
      />
    </Paper>
  );
}
