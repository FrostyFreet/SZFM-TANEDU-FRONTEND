import { useState } from "react";
import "./index.css";
import axios from 'axios'
import { useNavigate } from "react-router";

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [token,setToken]= useState()
  const navigate = useNavigate()

  const handleSubmit = async (e:any) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Minden mezőt ki kell tölteni!");
      return;
    }
    try{
        const response = await axios.post("http://localhost:8080/api/auth/login",{
            "email":email,
            "password":password
        })
        if (response && response.data.token){
            setToken(response.data.token)
            localStorage.setItem("token",response.data.token)
            navigate("/home")
        }
        setEmail("")
        setPassword("")
    }
    catch(e){
         setErrorMsg("Hibás email/jelszó!");
    }
  };

  return (
    <div className="login-container">
      <h1>TanEdu Rendszer</h1>
      <p className="subtitle">Kérlek, jelentkezz be a folytatáshoz</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Email</label>
          <input
            type="text"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Jelszó</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit">Bejelentkezés</button>

        {errorMsg && <div className="error-message">{errorMsg}</div>}
      </form>

      <p className="footer-text">© 2025 TanEdu | Hallgatói rendszer</p>
    </div>
  );
}
