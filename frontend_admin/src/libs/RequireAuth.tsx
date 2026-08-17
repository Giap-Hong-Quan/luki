import { Navigate, Outlet } from "react-router-dom";

const RequireAuth = ()=>{
    const token = localStorage.getItem("astkn");
    if(!token){ return <Navigate to={"/signin"}/>}
    return <Outlet/>
}
export default RequireAuth;