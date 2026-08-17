import { RouterProvider } from 'react-router-dom'
import router from './router/router'
// import { QueryClientProvider } from '@tanstack/react-query'
// import { queryClient } from './query/react-query'

function App() {
  return (
    <>
      {/* <QueryClientProvider client={queryClient} > */}
        <RouterProvider router={router}/>
      {/* </QueryClientProvider> */}
    </>
  )
}

export default App
