import { Navigate, useLocation } from "react-router";

/** Old shared links keep campaign parameters and useful section destinations. */
export function ProjectRedirect({ to }: { to: string }) {
  const { search, hash } = useLocation();
  return <Navigate to={`${to}${search}${hash}`} replace />;
}
