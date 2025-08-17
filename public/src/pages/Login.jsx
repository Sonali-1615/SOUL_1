import React, { useState, useEffect } from "react";
import axios from "axios";
import styled from "styled-components";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../assets/logo.svg";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { loginRoute } from "../utils/APIRoutes";
import { LOCALHOST_KEY } from "../utils/constants";

export default function Login() {
  const navigate = useNavigate();
  const [values, setValues] = useState({ username: "", password: "" });
  const toastOptions = {
    position: "bottom-right",
    autoClose: 8000,
    pauseOnHover: true,
    draggable: true,
    theme: "dark",
  };
  useEffect(() => {
    if (localStorage.getItem(LOCALHOST_KEY)) {
      navigate("/");
    }
  }, []);

  const handleChange = (event) => {
    setValues({ ...values, [event.target.name]: event.target.value });
  };

  const validateForm = () => {
    const { username, password } = values;
    if (username === "") {
      toast.error("Email and Password is required.", toastOptions);
      return false;
    } else if (password === "") {
      toast.error("Email and Password is required.", toastOptions);
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (validateForm()) {
      const { username, password } = values;
      const { data } = await axios.post(loginRoute, {
        username,
        password,
      });
      if (data.status === false) {
        toast.error(data.msg, toastOptions);
      }
      if (data.status === true) {
        localStorage.setItem(
          LOCALHOST_KEY,
          JSON.stringify(data.user)
        );

        navigate("/");
      }
    }
  };

  return (
    <>
      <FormContainer>
        <form action="" onSubmit={(event) => handleSubmit(event)}>
          <div className="brand">
            <img src={Logo} alt="logo" />
            <h1>SOUL</h1>
          </div>
          <input
            type="text"
            placeholder="Username"
            name="username"
            onChange={(e) => handleChange(e)}
            min="3"
          />
          <input
            type="password"
            placeholder="Password"
            name="password"
            onChange={(e) => handleChange(e)}
          />
          <button type="submit">Log In</button>
          <span>
            Don't have an account ? <Link to="/register">Create One.</Link>
          </span>
        </form>
      </FormContainer>
      <ToastContainer />
    </>
  );
}

const FormContainer = styled.div`
  min-height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #232526 0%, #4e54c8 100%);
  .brand {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: center;
    img {
      height: 4rem;
      filter: drop-shadow(0 2px 8px #4e0eff88);
    }
    h1 {
      color: #fff;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-size: 2.2rem;
      font-weight: 800;
      text-shadow: 0 2px 8px #4e0eff44;
    }
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    background: rgba(255,255,255,0.08);
    border-radius: 2rem;
    padding: 3rem 5rem;
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
    border: 1.5px solid rgba(255,255,255,0.18);
    backdrop-filter: blur(8px);
    min-width: 340px;
  }
  input {
    background: rgba(255,255,255,0.12);
    padding: 1rem;
    border: none;
    border-radius: 0.7rem;
    color: #fff;
    width: 100%;
    font-size: 1.1rem;
    box-shadow: 0 2px 8px #4e0eff11;
    transition: box-shadow 0.2s, border 0.2s;
    &:focus {
      outline: none;
      box-shadow: 0 0 0 2px #4e0eff88;
      background: rgba(255,255,255,0.18);
    }
    &::placeholder {
      color: #bdbdbd;
      letter-spacing: 1px;
    }
  }
  button {
    background: linear-gradient(90deg, #4e0eff 0%, #4e54c8 100%);
    color: white;
    padding: 1rem 2rem;
    border: none;
    font-weight: bold;
    cursor: pointer;
    border-radius: 0.7rem;
    font-size: 1.1rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    box-shadow: 0 2px 8px #4e0eff44;
    transition: background 0.2s;
    &:hover {
      background: linear-gradient(90deg, #4e54c8 0%, #4e0eff 100%);
    }
  }
  span {
    color: #fff;
    text-transform: uppercase;
    font-size: 1rem;
    letter-spacing: 1px;
    a {
      color: #4e0eff;
      text-decoration: underline;
      font-weight: bold;
      margin-left: 0.5rem;
    }
  }
`;
