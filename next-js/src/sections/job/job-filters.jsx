import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Radio from '@mui/material/Radio';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import FormControlLabel from '@mui/material/FormControlLabel';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CountrySelect } from 'src/components/country-select';

// ----------------------------------------------------------------------

export function JobFilters({ open, canReset, onOpen, onClose, filters, options }) {
  const { state: currentFilters, setState: updateFilters, resetState: resetFilters } = filters;

  const handleFilterEmploymentTypes = useCallback(
    (newValue) => {
      const checked = currentFilters.employmentTypes.includes(newValue)
        ? currentFilters.employmentTypes.filter((value) => value !== newValue)
        : [...currentFilters.employmentTypes, newValue];

      updateFilters({ employmentTypes: checked });
    },
    [updateFilters, currentFilters.employmentTypes]
  );

  const handleFilterExperience = useCallback(
    (newValue) => {
      updateFilters({ experience: newValue });
    },
    [updateFilters]
  );

  const handleFilterRoles = useCallback(
    (newValue) => {
      updateFilters({ roles: newValue });
    },
    [updateFilters]
  );

  const handleFilterLocations = useCallback(
    (newValue) => {
      updateFilters({ locations: newValue });
    },
    [updateFilters]
  );

  const handleFilterBenefits = useCallback(
    (newValue) => {
      const checked = currentFilters.benefits.includes(newValue)
        ? currentFilters.benefits.filter((value) => value !== newValue)
        : [...currentFilters.benefits, newValue];

      updateFilters({ benefits: checked });
    },
    [updateFilters, currentFilters.benefits]
  );

  const renderHead = () => (
    <>
      <Box
        sx={{
          py: 2,
          pr: 1,
          pl: 2.5,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          筛选
        </Typography>

        <Tooltip title="重置">
          <IconButton onClick={() => resetFilters()}>
            <Badge color="error" variant="dot" invisible={!canReset}>
              <Iconify icon="solar:restart-bold" />
            </Badge>
          </IconButton>
        </Tooltip>

        <IconButton onClick={onClose}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </Box>

      <Divider sx={{ borderStyle: 'dashed' }} />
    </>
  );

  const renderEmploymentTypes = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        工作类型
      </Typography>
      {options.employmentTypes.map((option) => (
        <FormControlLabel
          key={option}
          control={
            <Checkbox
              checked={currentFilters.employmentTypes.includes(option)}
              onClick={() => handleFilterEmploymentTypes(option)}
            />
          }
          label={option}
        />
      ))}
    </Box>
  );

  const renderExperience = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        经验要求
      </Typography>
      {options.experiences.map((option) => (
        <FormControlLabel
          key={option}
          control={
            <Radio
              checked={option === currentFilters.experience}
              onClick={() => handleFilterExperience(option)}
            />
          }
          label={option}
          sx={{ ...(option === 'all' && { textTransform: 'capitalize' }) }}
        />
      ))}
    </Box>
  );

  const renderRoles = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        职位角色
      </Typography>
      <Autocomplete
        multiple
        disableCloseOnSelect
        options={options.roles.map((option) => option)}
        getOptionLabel={(option) => option}
        value={currentFilters.roles}
        onChange={(event, newValue) => handleFilterRoles(newValue)}
        renderInput={(params) => <TextField placeholder="选择角色" {...params} />}
        renderOption={(props, option) => (
          <li {...props} key={option}>
            {option}
          </li>
        )}
        renderTags={(selected, getTagProps) =>
          selected.map((option, index) => (
            <Chip
              {...getTagProps({ index })}
              key={option}
              label={option}
              size="small"
              variant="soft"
            />
          ))
        }
      />
    </Box>
  );

  const renderLocations = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        工作地点
      </Typography>

      <CountrySelect
        id="multiple-locations"
        multiple
        fullWidth
        placeholder={currentFilters.locations.length ? '+ 地点' : '选择地点'}
        value={currentFilters.locations}
        onChange={(event, newValue) => handleFilterLocations(newValue)}
      />
    </Box>
  );

  const renderBenefits = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        福利待遇
      </Typography>
      {options.benefits.map((option) => (
        <FormControlLabel
          key={option}
          control={
            <Checkbox
              checked={currentFilters.benefits.includes(option)}
              onClick={() => handleFilterBenefits(option)}
            />
          }
          label={option}
        />
      ))}
    </Box>
  );

  return (
    <>
      <Button
        disableRipple
        color="inherit"
        endIcon={
          <Badge color="error" variant="dot" invisible={!canReset}>
            <Iconify icon="ic:round-filter-list" />
          </Badge>
        }
        onClick={onOpen}
      >
        筛选
      </Button>

      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        slotProps={{
          backdrop: { invisible: true },
          paper: { sx: { width: 320 } },
        }}
      >
        {renderHead()}

        <Scrollbar sx={{ px: 2.5, py: 3 }}>
          <Stack spacing={3}>
            {renderEmploymentTypes()}
            {renderExperience()}
            {renderRoles()}
            {renderLocations()}
            {renderBenefits()}
          </Stack>
        </Scrollbar>
      </Drawer>
    </>
  );
}
