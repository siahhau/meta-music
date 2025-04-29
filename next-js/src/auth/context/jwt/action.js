'use client';

import axios from 'src/lib/axios';

import { setSession } from './utils';
import { JWT_STORAGE_KEY } from './constant';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/** **************************************
 * Sign in
 *************************************** */
export const signInWithPassword = async ({ username, password }) => {
  try {
    const params = { username, password };
    const res = await axios.post(`${API_URL}/token/`, params);

    const { access, refresh } = res.data;
    if (!access) {
      throw new Error('Access token not found in response');
    }

    // 存储 token 到 sessionStorage
    sessionStorage.setItem(JWT_STORAGE_KEY, access);
    sessionStorage.setItem(`${JWT_STORAGE_KEY}_refresh`, refresh);

    // // 获取用户信息
    // const userRes = await axios.get(`${API_URL}/user/me`, {
    //   headers: {
    //     Authorization: `Bearer ${access}`,
    //   },
    // });
    // const user = userRes.data;

    // // 存储用户信息到 sessionStorage
    // sessionStorage.setItem('user', JSON.stringify(user));
    // console.log('登录用户信息已存储到 sessionStorage:', user);

    return { access, refresh };
  } catch (error) {
    console.error('登录错误:', error.response?.data);
    if (error?.detail) {
      throw new Error(error.detail);
    }
    if (error?.username) {
      throw new Error(error.username[0]);
    }
    if (error?.password) {
      throw new Error(error.password[0]);
    }
    throw error.response?.data || new Error('登录失败');
  }
};

/** **************************************
 * Sign up
 *************************************** */
export const signUp = async ({ email, username, password, firstName, lastName }) => {
  const params = {
    email,
    username,
    password,
    firstName,
    lastName,
  };

  try {
    const res = await axios.post(`${API_URL}/register/`, params);
    const { tokens, user } = res.data;
    if (!tokens) {
      throw new Error('用户 tokens 没有返回');
    }

    // 存储 token 到 sessionStorage
    sessionStorage.setItem(JWT_STORAGE_KEY, tokens.access);
    sessionStorage.setItem(`${JWT_STORAGE_KEY}_refresh`, tokens.refresh);

    // 存储用户信息到 sessionStorage
    sessionStorage.setItem('user', JSON.stringify(user));
    console.log('注册用户信息已存储到 sessionStorage:', user);

    return { tokens, user };
  } catch (error) {
    console.error('注册错误:', error.response?.data);
    if (error?.username) {
      throw new Error(error.username[0]);
    }
    if (error?.email) {
      throw new Error(error.email[0]);
    }
    if (error?.password) {
      throw new Error(error.password[0]);
    }
    if (error?.detail) {
      throw new Error(error.detail);
    }
    throw error.response?.data || new Error('注册失败');
  }
};

/** **************************************
 * Sign out
 *************************************** */
export const signOut = async () => {
  try {
    sessionStorage.removeItem(JWT_STORAGE_KEY);
    sessionStorage.removeItem(`${JWT_STORAGE_KEY}_refresh`);
    sessionStorage.removeItem('user'); // 清除用户信息
    await setSession(null);
  } catch (error) {
    console.error('登出错误:', error);
    throw error;
  }
};
