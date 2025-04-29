import { z as zod } from 'zod';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import ButtonBase from '@mui/material/ButtonBase';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import {
  _roles,
  JOB_SKILL_OPTIONS,
  JOB_BENEFIT_OPTIONS,
  JOB_EXPERIENCE_OPTIONS,
  JOB_EMPLOYMENT_TYPE_OPTIONS,
  JOB_WORKING_SCHEDULE_OPTIONS,
} from 'src/_mock';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export const NewJobSchema = zod.object({
  title: zod.string().min(1, { message: '必须填写标题！' }),
  content: zod.string().min(1, { message: '必须填写内容！' }),
  employmentTypes: zod.string().array().min(1, { message: '至少选择一个选项！' }),
  role: schemaHelper.nullableInput(zod.string().min(1, { message: '必须选择角色！' }), {
    // message for null value
    message: '必须选择角色！',
  }),
  skills: zod.string().array().min(1, { message: '至少选择一个选项！' }),
  workingSchedule: zod.string().array().min(1, { message: '至少选择一个选项！' }),
  locations: zod.string().array().min(1, { message: '至少选择一个选项！' }),
  expiredDate: schemaHelper.date({ message: { required: '必须选择截止日期！' } }),
  salary: zod.object({
    price: schemaHelper.nullableInput(
      zod.number({ coerce: true }).min(1, { message: '必须填写薪资！' }),
      {
        // message for null value
        message: '必须填写薪资！',
      }
    ),
    // Not required
    type: zod.string(),
    negotiable: zod.boolean(),
  }),
  benefits: zod.string().array().min(0, { message: '至少选择一个选项！' }),
  // Not required
  experience: zod.string(),
});

// ----------------------------------------------------------------------

export function JobNewEditForm({ currentJob }) {
  const router = useRouter();

  const openDetails = useBoolean(true);
  const openProperties = useBoolean(true);

  const defaultValues = {
    title: '',
    content: '',
    employmentTypes: [],
    experience: '1年经验',
    role: _roles[1],
    skills: [],
    workingSchedule: [],
    locations: [],
    expiredDate: null,
    salary: { type: '按小时', price: null, negotiable: false },
    benefits: [],
  };

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(NewJobSchema),
    defaultValues,
    values: currentJob,
  });

  const {
    reset,
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      reset();
      toast.success(currentJob ? '更新成功！' : '创建成功！');
      router.push(paths.dashboard.job.root);
      console.info('数据', data);
    } catch (error) {
      console.error(error);
    }
  });

  const renderCollapseButton = (value, onToggle) => (
    <IconButton onClick={onToggle}>
      <Iconify icon={value ? 'eva:arrow-ios-downward-fill' : 'eva:arrow-ios-forward-fill'} />
    </IconButton>
  );

  const renderDetails = () => (
    <Card>
      <CardHeader
        title="职位详情"
        subheader="标题、简介、图片..."
        action={renderCollapseButton(openDetails.value, openDetails.onToggle)}
        sx={{ mb: 3 }}
      />

      <Collapse in={openDetails.value}>
        <Divider />

        <Stack spacing={3} sx={{ p: 3 }}>
          <Stack spacing={1.5}>
            <Typography variant="subtitle2">标题</Typography>
            <Field.Text name="title" placeholder="如：软件工程师..." />
          </Stack>

          <Stack spacing={1.5}>
            <Typography variant="subtitle2">内容</Typography>
            <Field.Editor name="content" sx={{ maxHeight: 480 }} />
          </Stack>
        </Stack>
      </Collapse>
    </Card>
  );

  const renderProperties = () => (
    <Card>
      <CardHeader
        title="职位属性"
        subheader="附加功能和属性..."
        action={renderCollapseButton(openProperties.value, openProperties.onToggle)}
        sx={{ mb: 3 }}
      />

      <Collapse in={openProperties.value}>
        <Divider />

        <Stack spacing={3} sx={{ p: 3 }}>
          <Stack spacing={1}>
            <Typography variant="subtitle2">工作类型</Typography>
            <Field.MultiCheckbox
              row
              name="employmentTypes"
              options={JOB_EMPLOYMENT_TYPE_OPTIONS}
              sx={{ gap: 4 }}
            />
          </Stack>

          <Stack spacing={1}>
            <Typography variant="subtitle2">经验要求</Typography>
            <Field.RadioGroup
              row
              name="experience"
              options={JOB_EXPERIENCE_OPTIONS}
              sx={{ gap: 4 }}
            />
          </Stack>

          <Stack spacing={1.5}>
            <Typography variant="subtitle2">角色</Typography>
            <Field.Autocomplete
              name="role"
              autoHighlight
              options={_roles.map((option) => option)}
              getOptionLabel={(option) => option}
              renderOption={(props, option) => (
                <li {...props} key={option}>
                  {option}
                </li>
              )}
            />
          </Stack>

          <Stack spacing={1.5}>
            <Typography variant="subtitle2">技能</Typography>
            <Field.Autocomplete
              name="skills"
              placeholder="+ 技能"
              multiple
              disableCloseOnSelect
              options={JOB_SKILL_OPTIONS.map((option) => option)}
              getOptionLabel={(option) => option}
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
                    color="info"
                    variant="soft"
                  />
                ))
              }
            />
          </Stack>

          <Stack spacing={1.5}>
            <Typography variant="subtitle2">工作时间</Typography>
            <Field.Autocomplete
              name="workingSchedule"
              placeholder="+ 时间安排"
              multiple
              disableCloseOnSelect
              options={JOB_WORKING_SCHEDULE_OPTIONS.map((option) => option)}
              getOptionLabel={(option) => option}
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
                    color="info"
                    variant="soft"
                  />
                ))
              }
            />
          </Stack>

          <Stack spacing={1.5}>
            <Typography variant="subtitle2">地点</Typography>
            <Field.CountrySelect multiple name="locations" placeholder="+ 地点" />
          </Stack>

          <Stack spacing={1.5}>
            <Typography variant="subtitle2">截止日期</Typography>

            <Field.DatePicker name="expiredDate" />
          </Stack>

          <Stack spacing={2}>
            <Typography variant="subtitle2">薪资</Typography>

            <Controller
              name="salary.type"
              control={control}
              render={({ field }) => (
                <Box sx={{ gap: 2, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                  {[
                    {
                      label: '按小时',
                      icon: <Iconify icon="solar:clock-circle-bold" width={32} sx={{ mb: 2 }} />,
                    },
                    {
                      label: '自定义',
                      icon: <Iconify icon="solar:wad-of-money-bold" width={32} sx={{ mb: 2 }} />,
                    },
                  ].map((item) => (
                    <Paper
                      component={ButtonBase}
                      variant="outlined"
                      key={item.label}
                      onClick={() => field.onChange(item.label)}
                      sx={{
                        p: 2.5,
                        borderRadius: 1,
                        typography: 'subtitle2',
                        flexDirection: 'column',
                        ...(item.label === field.value && {
                          borderWidth: 2,
                          borderColor: 'text.primary',
                        }),
                      }}
                    >
                      {item.icon}
                      {item.label}
                    </Paper>
                  ))}
                </Box>
              )}
            />

            <Field.Text
              name="salary.price"
              placeholder="0.00"
              type="number"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start" sx={{ mr: 0.75 }}>
                      <Box component="span" sx={{ color: 'text.disabled' }}>
                        ¥
                      </Box>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Field.Switch name="salary.negotiable" label="薪资可面议" />
          </Stack>

          <Stack spacing={1}>
            <Typography variant="subtitle2">福利</Typography>
            <Field.MultiCheckbox
              name="benefits"
              options={JOB_BENEFIT_OPTIONS}
              sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}
            />
          </Stack>
        </Stack>
      </Collapse>
    </Card>
  );

  const renderActions = () => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
      <FormControlLabel
        label="发布"
        control={<Switch defaultChecked slotProps={{ input: { id: 'publish-switch' } }} />}
        sx={{ flexGrow: 1, pl: 3 }}
      />

      <Button type="submit" variant="contained" size="large" loading={isSubmitting} sx={{ ml: 2 }}>
        {!currentJob ? '创建职位' : '保存更改'}
      </Button>
    </Box>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={{ xs: 3, md: 5 }} sx={{ mx: 'auto', maxWidth: { xs: 720, xl: 880 } }}>
        {renderDetails()}
        {renderProperties()}
        {renderActions()}
      </Stack>
    </Form>
  );
}
