import { createBrowserRouter, RouterProvider } from "react-router";
import { MAIN_ROUTES } from "./mainRoutes";

export const AppRoutes = () => {
  const router = createBrowserRouter(MAIN_ROUTES);
  return <RouterProvider router={router} />;
};
