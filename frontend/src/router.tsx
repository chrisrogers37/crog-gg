import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Layout } from "./components/layout";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { NotFoundPage } from "./pages/NotFound";
import { HomePage } from "./pages/Home";

const ProjectsPage = lazy(() =>
  import("./pages/Projects/ProjectsPage").then((m) => ({
    default: m.ProjectsPage,
  })),
);
const ProjectDetailPage = lazy(() =>
  import("./pages/Projects/ProjectDetailPage").then((m) => ({
    default: m.ProjectDetailPage,
  })),
);
const ClaudfatherPage = lazy(() =>
  import("./pages/Claudfather/ClaudfatherPage").then((m) => ({
    default: m.ClaudfatherPage,
  })),
);
const JourneyPage = lazy(() =>
  import("./pages/Journey/JourneyPage").then((m) => ({
    default: m.JourneyPage,
  })),
);
const MusicPage = lazy(() =>
  import("./pages/Music/MusicPage").then((m) => ({
    default: m.MusicPage,
  })),
);

function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-primary border-t-transparent mx-auto mb-4" />
        <p className="text-text-secondary">Loading...</p>
      </div>
    </div>
  );
}

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoading />}>{children}</Suspense>;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ErrorBoundary>
        <Layout />
      </ErrorBoundary>
    ),
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "projects",
        children: [
          {
            index: true,
            element: (
              <LazyPage>
                <ProjectsPage />
              </LazyPage>
            ),
          },
          {
            path: ":slug",
            element: (
              <LazyPage>
                <ProjectDetailPage />
              </LazyPage>
            ),
          },
        ],
      },
      {
        path: "claudfather",
        children: [
          {
            index: true,
            element: (
              <LazyPage>
                <ClaudfatherPage />
              </LazyPage>
            ),
          },
          {
            path: ":sub",
            element: (
              <LazyPage>
                <ClaudfatherPage />
              </LazyPage>
            ),
          },
        ],
      },
      {
        path: "journey",
        element: (
          <LazyPage>
            <JourneyPage />
          </LazyPage>
        ),
      },
      {
        path: "music",
        element: (
          <LazyPage>
            <MusicPage />
          </LazyPage>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
