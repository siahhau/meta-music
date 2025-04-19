import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import Badge from "../components/ui/badge/Badge";
import api from '../api';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [isForbidden, setIsForbidden] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/api/users/');
        setUsers(response.data);
        setIsForbidden(false);
      } catch (err) {
        console.error('获取用户列表失败:', err);
        if (err.response?.status === 403) {
          setIsForbidden(true);
          setError('您没有权限访问此页面，请联系管理员。');
        } else {
          setError('无法加载用户数据，请稍后重试');
        }
      }
    };
    fetchUsers();
  }, []);

  const handlePermissionToggle = async (userId, isStaff) => {
    try {
      const response = await api.put(`/api/users/${userId}/permissions/`, { is_staff: !isStaff });
      setUsers(users.map(user => user.id === userId ? response.data : user));
      setError(null);
    } catch (err) {
      console.error('更新权限失败:', err);
      setError('更新权限失败，请稍后重试');
    }
  };

  const handleStatusToggle = async (userId, isActive) => {
    try {
      const response = await api.put(`/api/users/${userId}/permissions/`, { is_active: !isActive });
      setUsers(users.map(user => user.id === userId ? response.data : user));
      setError(null);
    } catch (err) {
      console.error('更新状态失败:', err);
      setError('更新状态失败，请稍后重试');
    }
  };

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="p-5">
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90 mb-4">
        用户管理
      </h1>
      <div className="p-4 border border-gray-200 rounded-2xl bg-white dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-2">用户列表</h2>
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                用户
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                角色
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                状态
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                权限
              </TableCell>
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                操作
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="px-5 py-4 sm:px-6 text-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 overflow-hidden rounded-full">
                      <img
                        width={40}
                        height={40}
                        src={`https://via.placeholder.com/40?text=${user.username[0]}`}
                        alt={user.username}
                      />
                    </div>
                    <div>
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {user.username}
                      </span>
                      <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                        {user.email || '-'}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {user.role}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  <Badge
                    size="sm"
                    color={user.is_active ? 'success' : 'error'}
                  >
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  <Badge
                    size="sm"
                    color={user.permissions === 'Staff' ? 'primary' : 'secondary'}
                  >
                    {user.permissions}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePermissionToggle(user.id, user.permissions === 'Staff')}
                      className="px-2 py-1 bg-blue-500 text-white rounded"
                    >
                      {user.permissions === 'Staff' ? '移除管理员' : '设为管理员'}
                    </button>
                    <button
                      onClick={() => handleStatusToggle(user.id, user.is_active)}
                      className={`px-2 py-1 ${user.is_active ? 'bg-red-500' : 'bg-green-500'} text-white rounded`}
                    >
                      {user.is_active ? '禁用' : '激活'}
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}