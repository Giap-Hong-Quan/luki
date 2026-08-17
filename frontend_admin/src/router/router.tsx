import { createBrowserRouter } from "react-router-dom";
import SigninPage from "../pages/auth/SigninPage";
import DashboardPage from "../pages/client/DashboardPage";
import RequireAuth from "../libs/RequireAuth";
import SingupPage from "../pages/auth/SingupPage";

const router =createBrowserRouter(
    [
        {path:"/signin",element:<SigninPage/>},
        {path:"signup",element:<SingupPage/>},
        {
            path:"/",
            element:<RequireAuth/>,
            children:
                [  
                    {index:true,element:<DashboardPage/>}
                
                ]
        }
    ]
)
export default router;