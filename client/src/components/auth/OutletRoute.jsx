import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

const OutletRoute = () => {
  const { currentUser } = useSelector((state) => state.user);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.usersRole !== 'outlet') {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default OutletRoute;