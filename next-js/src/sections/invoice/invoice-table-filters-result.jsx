import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { fDateRangeShortLabel } from 'src/utils/format-time';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

export function InvoiceTableFiltersResult({ filters, totalResults, onResetPage, sx }) {
  const { state: currentFilters, setState: updateFilters, resetState: resetFilters } = filters;

  const handleRemoveKeyword = useCallback(() => {
    onResetPage();
    updateFilters({ name: '' });
  }, [onResetPage, updateFilters]);

  const handleRemoveService = useCallback(
    (inputValue) => {
      const newValue = currentFilters.service.filter((item) => item !== inputValue);

      onResetPage();
      updateFilters({ service: newValue });
    },
    [onResetPage, updateFilters, currentFilters.service]
  );

  const handleRemoveStatus = useCallback(() => {
    onResetPage();
    updateFilters({ status: 'all' });
  }, [onResetPage, updateFilters]);

  const handleRemoveDate = useCallback(() => {
    onResetPage();
    updateFilters({ startDate: null, endDate: null });
  }, [onResetPage, updateFilters]);

  return (
    <FiltersResult totalResults={totalResults} onReset={() => resetFilters()} sx={sx}>
      <FiltersBlock label="服务：" isShow={!!currentFilters.service.length}>
        {currentFilters.service.map((item) => (
          <Chip {...chipProps} key={item} label={item} onDelete={() => handleRemoveService(item)} />
        ))}
      </FiltersBlock>

      <FiltersBlock label="状态：" isShow={currentFilters.status !== 'all'}>
        <Chip
          {...chipProps}
          label={
            currentFilters.status === 'paid' ? '已支付' :
            currentFilters.status === 'pending' ? '待处理' :
            currentFilters.status === 'overdue' ? '逾期' :
            currentFilters.status === 'draft' ? '草稿' : currentFilters.status
          }
          onDelete={handleRemoveStatus}
          sx={{ textTransform: 'capitalize' }}
        />
      </FiltersBlock>

      <FiltersBlock
        label="日期："
        isShow={Boolean(currentFilters.startDate && currentFilters.endDate)}
      >
        <Chip
          {...chipProps}
          label={fDateRangeShortLabel(currentFilters.startDate, currentFilters.endDate)}
          onDelete={handleRemoveDate}
        />
      </FiltersBlock>

      <FiltersBlock label="关键词：" isShow={!!currentFilters.name}>
        <Chip {...chipProps} label={currentFilters.name} onDelete={handleRemoveKeyword} />
      </FiltersBlock>
    </FiltersResult>
  );
}
