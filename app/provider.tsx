'use client'

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useUser, useAuth } from '@clerk/nextjs';
import { UserDetailContext } from '@/context/UserDetailContext';

function Provider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [userDetail, setUserDetail] = useState<any>();
  const { user } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    if (user && !userDetail) {
      CreateNewUser();
    }
  }, [user, userDetail]);

  const CreateNewUser = async () => {
    try {
      const token = await getToken();
      const result = await axios.post('/api/users', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(result.data);
      setUserDetail(result.data?.user);
    } catch (error) {
      console.error('Error creating user:', error);
    }
  } 
  

  return (
    <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
      {children}
    </UserDetailContext.Provider>
  );
}

export default Provider;
