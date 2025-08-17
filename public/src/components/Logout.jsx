import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { BiPowerOff } from "react-icons/bi";
import styled from "styled-components";
import axios from "axios";
import { logoutRoute } from "../utils/APIRoutes";

function Logout() {
  const navigate = useNavigate();
  const [loggedOut, setLoggedOut] = React.useState(false);

  const handleClick = async () => {
    const user = localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY);
    if (!user) return;
    const id = JSON.parse(user)._id;
    try {
      const data = await axios.get(`${logoutRoute}/${id}`);
      if (data.status === 200) {
        localStorage.clear();
        setLoggedOut(true);
      }
    } catch (err) {
      // Optionally handle error
    }
  };

  if (loggedOut) {
    return (
      <LogoutCard>
        <h2>You have been logged out.</h2>
        <div className="logout-links">
          <StyledLink to="/login">Go to Login</StyledLink>
          <StyledLink to="/register">Sign Up</StyledLink>
        </div>
      </LogoutCard>
    );
  } else {
    return (
      <Button onClick={handleClick}>
        <BiPowerOff />
      </Button>
    );
  }
}

export default Logout;


const LogoutCard = styled.div`
  background: #23235b;
  color: #fff;
  text-align: center;
  margin: 3rem auto 0 auto;
  padding: 2.5rem 2rem 2rem 2rem;
  border-radius: 1.2rem;
  box-shadow: 0 4px 24px 0 rgba(0,0,0,0.18);
  max-width: 350px;
  h2 {
    font-size: 1.3rem;
    font-weight: 600;
    margin-bottom: 1.2rem;
    letter-spacing: 0.5px;
  }
  .logout-links {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    margin-top: 0.5rem;
  }
`;

const StyledLink = styled(Link)`
  color: #4e0eff;
  font-weight: 500;
  font-size: 1.05rem;
  text-decoration: none;
  padding: 0.2rem 0.7rem;
  border-radius: 0.4rem;
  transition: background 0.2s, color 0.2s;
  &:hover {
    background: #4e0eff22;
    color: #fff;
    text-decoration: underline;
  }
`;

const Button = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.5rem;
  border-radius: 0.5rem;
  background-color: #9a86f3;
  border: none;
  cursor: pointer;
  svg {
    font-size: 1.3rem;
    color: #ebe7ff;
  }
`;
