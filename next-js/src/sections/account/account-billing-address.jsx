import { useState, useCallback } from 'react';
import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import CardHeader from '@mui/material/CardHeader';

import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

import { AddressItem, AddressNewForm } from '../address';

// ----------------------------------------------------------------------

export function AccountBillingAddress({ addressBook }) {
  const menuActions = usePopover();
  const newAddressForm = useBoolean();

  const [addressId, setAddressId] = useState('');

  const handleAddNewAddress = useCallback((address) => {
    console.info('地址', address);
  }, []);

  const handleSelectedId = useCallback(
    (event, id) => {
      menuActions.onOpen(event);
      setAddressId(id);
    },
    [menuActions]
  );

  const handleClose = useCallback(() => {
    menuActions.onClose();
    setAddressId('');
  }, [menuActions]);

  const renderMenuActions = () => (
    <CustomPopover open={menuActions.open} anchorEl={menuActions.anchorEl} onClose={handleClose}>
      <MenuList>
        <MenuItem
          onClick={() => {
            handleClose();
            console.info('设为主要地址', addressId);
          }}
        >
          <Iconify icon="eva:star-fill" />
          设为主要地址
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleClose();
            console.info('编辑', addressId);
          }}
        >
          <Iconify icon="solar:pen-bold" />
          编辑
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleClose();
            console.info('删除', addressId);
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          删除
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  const renderNewAddressForm = () => (
    <AddressNewForm
      open={newAddressForm.value}
      onClose={newAddressForm.onFalse}
      onCreate={handleAddNewAddress}
    />
  );

  return (
    <>
      <Card>
        <CardHeader
          title="地址簿"
          action={
            <Button
              size="small"
              color="primary"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={newAddressForm.onTrue}
            >
              添加地址
            </Button>
          }
        />

        <Stack spacing={2.5} sx={{ p: 3 }}>
          {addressBook.map((address) => (
            <AddressItem
              variant="outlined"
              key={address.id}
              address={address}
              action={
                <IconButton
                  onClick={(event) => {
                    handleSelectedId(event, `${address.id}`);
                  }}
                  sx={{ position: 'absolute', top: 8, right: 8 }}
                >
                  <Iconify icon="eva:more-vertical-fill" />
                </IconButton>
              }
              sx={{ p: 2.5, borderRadius: 1 }}
            />
          ))}
        </Stack>
      </Card>

      {renderMenuActions()}
      {renderNewAddressForm()}
    </>
  );
}
