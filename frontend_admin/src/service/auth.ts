import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../config/firebaseConfig";
import { apiClient } from "./apiclient";

export const loginWithGoogle =async ()=>{
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();
    const res = await apiClient.post("/auth/login-gg",{},{
        headers: {
        Authorization: `Bearer ${idToken}`
    }
    })
    localStorage.setItem("astkn",res.data.data.token)
    return res.data;
}

// export const loginWithLocal =async()=>{
//     try {
//         const result =await apiClient.post("/auth/singin");

//     } catch (error) {
//         console.log("lôi",error)
//     }
// }