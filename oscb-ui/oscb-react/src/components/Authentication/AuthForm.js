import React , { useState }from "react";
import LoginPage from "./logIn";
import Signup from "./signUp";



function Authentication(props){
    const isLogin = props.isLoginReq
    let component;

    const [authType, setAuthType] = useState("logIn");

    const handleSignUpClick = (event) => {
        event.preventDefault();
        setAuthType("signUp")
    };

    const handleLoginClick = (event) => {
        event.preventDefault();
        setAuthType("logIn")
    };

    if(isLogin && authType === "logIn") {
        component = <LoginPage handleSignUpClick={handleSignUpClick} handleAuth={props.handleAuth}/>
    } else if (isLogin && authType === "signUp") {
        component = <Signup handleLoginClick={handleLoginClick}  handleAuth={props.handleAuth} />
    }

    return (
        <div>
            {component}
        </div>
    );
}

export default Authentication