import React from "react"
import { Button } from "antd";
import { useNavigate } from "react-router-dom";
const DashBoardPage = () => {
    const navigate = useNavigate();
    const email = localStorage.getItem("email")
    const emailData = email.split("@")[0];
    return (
        <div>
            <h1> welcome to Dash Board Page - {emailData} </h1>
            <Button type="primary" size="large"
                onClick={() => {
                    navigate("/")
                }}
            > logout </Button>
        </div>
    )
}
export default DashBoardPage;