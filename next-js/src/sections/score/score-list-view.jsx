'use client';

import { useState, useEffect, useCallback } from 'react';
import { varAlpha } from 'minimal-shared/utils';
import { useBoolean, useSetState } from 'minimal-shared/hooks';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'next/navigation';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  rowInPage,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import axiosInstance from 'src/lib/axios';
import { endpoints } from 'src/lib/axios';
import { toast } from 'src/components/snackbar';
import { ScoreTableRow } from './score-table-row';
import { ScoreTableToolbar } from './score-table-toolbar';
import { ScoreTableFiltersResult } from './score-table-filters-result';
import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'PENDING', label: '待审核' },
  { value: 'APPROVED', label: '已通过' },
  { value: 'REJECTED', label: '已拒绝' },
];

const TABLE_HEAD = [
  { id: 'id', label: '歌谱 ID', width: 100 },
  { id: 'track_name', label: '歌曲名称' },
  { id: 'user', label: '上传者', width: 150 },
  { id: 'created_at', label: '上传时间', width: 150 },
  { id: 'status', label: '状态', width: 120 },
  { id: 'price', label: '价格', width: 120 },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function ScoreListView() {
  const router = useRouter();
  const table = useTable({ defaultOrderBy: 'id' });
  const confirmDialog = useBoolean();
  const [tableData, setTableData] = useState([]);
  const [userId, setUserId] = useState(null);

  const filters = useSetState({
    name: '',
    status: 'all',
    tab: 'all',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: currentFilters,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset = !!currentFilters.name || currentFilters.status !== 'all';

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  // 获取当前用户 ID
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axiosInstance.get(endpoints.auth.me);
        setUserId(response.data.id);
      } catch (err) {
        console.error('获取用户信息失败:', err);
        if (err.response?.status === 401) {
          router.push('/dashboard/login');
        }
      }
    };
    fetchUser();
  }, [router]);

  // 获取歌谱数据
  useEffect(() => {
    const fetchScores = async () => {
      try {
        const isMyScores = currentFilters.tab === 'my';
        const url = isMyScores
          ? `${endpoints.score.list}?user_id=${userId}`
          : endpoints.score.list;
        const response = await axiosInstance.get(url);
        setTableData(response.data);
      } catch (err) {
        console.error('获取歌谱列表失败:', err);
        toast.error('无法获取歌谱列表，请稍后重试');
      }
    };
    if (userId || currentFilters.tab === 'all') {
      fetchScores();
    }
  }, [userId, currentFilters.tab]);

  const handleDeleteRow = useCallback(
    async (id) => {
      try {
        await axiosInstance.delete(endpoints.score.details.replace(':pk', id));
        const deleteRow = tableData.filter((row) => row.id !== id);
        toast.success('删除成功！');
        setTableData(deleteRow);
        table.onUpdatePageDeleteRow(dataInPage.length);
      } catch (err) {
        console.error('删除歌谱失败:', err);
        toast.error('删除失败，请稍后重试');
      }
    },
    [dataInPage.length, table, tableData]
  );

  const handleDeleteRows = useCallback(
    async () => {
      try {
        const deletePromises = table.selected.map((id) =>
          axiosInstance.delete(endpoints.score.details.replace(':pk', id))
        );
        await Promise.all(deletePromises);
        const deleteRows = tableData.filter((row) => !table.selected.includes(row.id));
        toast.success('批量删除成功！');
        setTableData(deleteRows);
        table.onUpdatePageDeleteRows(dataInPage.length, dataFiltered.length);
      } catch (err) {
        console.error('批量删除歌谱失败:', err);
        toast.error('批量删除失败，请稍后重试');
      }
    },
    [dataFiltered.length, dataInPage.length, table, tableData]
  );

  const handleFilterStatus = useCallback(
    (event, newValue) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [updateFilters, table]
  );

  const handleFilterTab = useCallback(
    (event, newValue) => {
      table.onResetPage();
      updateFilters({ tab: newValue });
    },
    [updateFilters, table]
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title="删除歌谱"
      content={
        <>
          确定要删除 <strong> {table.selected.length} </strong> 条歌谱吗？
        </>
      }
      action={
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            handleDeleteRows();
            confirmDialog.onFalse();
          }}
        >
          删除
        </Button>
      }
    />
  );

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="歌谱列表"
          links={[
            { name: '仪表盘', href: paths.dashboard.root },
            { name: '歌谱', href: paths.dashboard.score.root },
            { name: '列表' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <Tabs
            value={currentFilters.tab}
            onChange={handleFilterTab}
            sx={(theme) => ({
              px: 2.5,
              boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
            })}
          >
            <Tab
              value="all"
              label="所有歌谱"
              icon={
                <Label variant="filled" color="default">
                  {tableData.length}
                </Label>
              }
            />
            <Tab
              value="my"
              label="我的歌谱"
              icon={
                <Label variant="filled" color="default">
                  {tableData.filter((score) => score.user === 'admin').length} {/* 适配 user 字符串 */}
                </Label>
              }
            />
          </Tabs>

          <ScoreTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
          />

          {canReset && (
            <ScoreTableFiltersResult
              filters={filters}
              totalResults={dataFiltered.length}
              onResetPage={table.onResetPage}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ position: 'relative' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={dataFiltered.length}
              onSelectAllRows={(checked) =>
                table.onSelectAllRows(
                  checked,
                  dataFiltered.map((row) => row.id)
                )
              }
              action={
                <Tooltip title="删除">
                  <IconButton color="primary" onClick={confirmDialog.onTrue}>
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Tooltip>
              }
            />

            <Scrollbar sx={{ minHeight: 444 }}>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headCells={TABLE_HEAD}
                  rowCount={dataFiltered.length}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                  onSelectAllRows={(checked) =>
                    table.onSelectAllRows(
                      checked,
                      dataFiltered.map((row) => row.id)
                    )
                  }
                />

                <TableBody>
                  {dataFiltered
                    .slice(
                      table.page * table.rowsPerPage,
                      table.page * table.rowsPerPage + table.rowsPerPage
                    )
                    .map((row) => (
                      <ScoreTableRow
                        key={row.id}
                        row={row}
                        selected={table.selected.includes(row.id)}
                        onSelectRow={() => table.onSelectRow(row.id)}
                        onDeleteRow={() => handleDeleteRow(row.id)}
                        detailsHref={paths.dashboard.score.details(row.id)}
                      />
                    ))}

                  <TableEmptyRows
                    height={table.dense ? 56 : 56 + 20}
                    emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                  />

                  <TableNoData notFound={notFound} />
                </TableBody>
              </Table>
            </Scrollbar>
          </Box>

          <TablePaginationCustom
            page={table.page}
            dense={table.dense}
            count={dataFiltered.length}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onChangeDense={table.onChangeDense}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      </DashboardContent>

      {renderConfirmDialog()}
    </>
  );
}

// ----------------------------------------------------------------------

function applyFilter({ inputData, comparator, filters }) {
  const { name, status } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter((score) =>
      score.track_name.toLowerCase().includes(name.toLowerCase())
    );
  }

  if (status !== 'all') {
    inputData = inputData.filter((score) => score.status === status);
  }

  return inputData;
}
