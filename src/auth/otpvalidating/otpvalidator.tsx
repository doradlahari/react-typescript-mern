import { Button, Col, Form, Input, Row, message } from "antd";
import React, { useState } from "react";
import "./otpvalidator.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Verification: React.FC = () => {
  const [value, setOtp] = useState<string[]>(new Array(6).fill(""));
  const num = value.map(Number);
  const otp = num.join("");

  const [form] = Form.useForm();

  /** The function is used to onchange event handler in input boxes.. */

  const handleChange = (element: HTMLInputElement, index: number) => {
    setOtp([
      ...value.map((number, idx) => (idx === index ? element.value : number)),
    ]);

    // focus next input
    if (element.nextSibling) {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };
  const navigate = useNavigate();

  /** The function is used to perform Verification otp.. */

  const HandleOTP = () => {
    const payload = {
      otp: otp,
    };
    axios
      .post("http://localhost:5000/checkotp", payload)
      .then((res) => {
        if (res.data === "valid otp") {
          message.success("valid otp");
          navigate("/profile");
        } else {
          message.error("invalid otp");
        }
      })
      .catch(() => {
        message.error("something went wrong!");
      });
  };

  /** The function is used to perform Resend Otp.. */

  return (
    <div className="container">
      <Form
        className="login-form-styles"
        form={form}
        name="control-hooks"
        onFinish={HandleOTP}
      >
        <span
          style={{
            display: "flex",
            justifyContent: "center",
            color: "#335BD7",
          }}
        >
          Validate your OTP
        </span>
        <Form.Item>
          <Input.Group>
            {value.map((data, index) => {
              return (
                <React.Fragment key={index}>
                  <Input
                    onFocus={(e) => e.target.select()}
                    value={data}
                    className="customized-input-box otp-screen"
                    maxLength={1}
                    onChange={(e) => handleChange(e.target, index)}
                  />
                </React.Fragment>
              );
            })}
          </Input.Group>
        </Form.Item>
        <Form.Item>
          <Row>
            <Col
              span={24}
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Button type="primary" htmlType="submit" size="large">
                Validate OTP
              </Button>
            </Col>
          </Row>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Verification;
