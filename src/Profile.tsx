// ...existing code...
import { useEffect, useState } from "react";
import "./index.css";
import axios from "axios";
import { useNavigate } from "react-router";

type Profile = {
    id: number
    firstName: string
    lastName: string
    email: string
    birthDate: string | null
    role: string
    departmentName: string
    fullName: string
    
}


export default function Adatok() {
  const [adatok, setAdatok] = useState<Profile | null>(null);
  const navigate = useNavigate()
  const token = localStorage.getItem("token")

  const kijelentkezes = async () => {
    const response = await axios.post("http://localhost:8080/api/auth/logout",{
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    )
    if (!response) return
    localStorage.removeItem("token");
    navigate("/")
  };

  useEffect(() => {
  const fetchCurrentUser = async () => {
    try {
      if (!token) {
        setAdatok(null);
        return;
      }
      const response = await axios.get("http://localhost:8080/api/users/getCurrentUser", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response?.data) {
        setAdatok(response.data);
      } else {
        setAdatok(null);
      }
    } catch (error) {
      console.error("Felhasználó lekérése sikertelen:", error);
      setAdatok(null);
    }
  };

  fetchCurrentUser();
}, [token]);

  if (!adatok) {
    return (
      <div className="hatter">
        <p className="udvozles">Betöltés...</p>
      </div>
    );
  }

  return (
    <div className="hatter">
      <button id="kijelentkezesBtn" onClick={kijelentkezes}>
        Kijelentkezés
      </button>

      <div className="nav-sor">
        <a href="/orarend">
          <span>📅</span>Órarend
        </a>
        <a href="/jegyek">
          <span>📊</span>Jegyek, értékelések
        </a>
        <a href="/uzenetek">
          <span>📩</span>Üzenetek
        </a>
        <a href="/adatok">
          <span>👤</span>Adatok
        </a>
      </div>

      <p className="udvozles">Személyes adatok</p>

      <table className="tablazat">
        <tbody>
          <tr>
            <td>Teljes név</td>
            <td>{adatok.fullName}</td>
          </tr>
          <tr>
            <td>Hallgatói azonosító</td>
            <td>{adatok.id}</td>
          </tr>
          <tr>
            <td>Születés ideje</td>
            <td>{adatok.birthDate}</td>
          </tr>
          <tr>
            <td>E-mail cím</td>
            <td>{adatok.email}</td>
          </tr>
          <tr>
            <td>Osztály</td>
            <td>{adatok.departmentName}</td>
          </tr>
        </tbody>
      </table>

      <footer className="footer-text">© 2025 TanEdu | Hallgatói rendszer</footer>
    </div>
  );
}
// ...existing code...