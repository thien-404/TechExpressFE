import { RouterProvider } from "react-router-dom";
import { router } from "./utils/router.jsx";
import { Toaster } from 'sonner'

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        richColors
        position="top-right"
        offset={72}
        toastOptions={{
          className: 'mt-2'
        }}
      />

    </>
  );
}

export default App;
