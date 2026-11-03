import React, { createContext, useEffect, useState } from 'react';
import { login, register, logout } from '../services/auth';
import { subscribeLogout } from '../services/session';

export const UserContext = createContext();
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  useEffect(() => subscribeLogout(() => setUser(null)), []);
  const signIn = async (email, password) => setUser(await login(email, password));
  const signUp = async (name, email, password) => setUser(await register(name, email, password));
  const updateUser = data => setUser(current =>
    current && current.id_usuario === data.id_usuario ? { ...current, ...data } : current,
  );
  return <UserContext.Provider value={{ user, signIn, signUp, signOut: logout, updateUser }}>{children}</UserContext.Provider>;
};
export default UserContext;
