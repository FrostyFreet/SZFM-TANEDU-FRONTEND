// ...existing code...
import { useState, useEffect } from "react";
import "./index.css";
import { useNavigate } from "react-router";
import axios from "axios";

type Grade = {
  targy: string;
  jegy: number;
  datum: string;
  megjegyzes: string;
};

export default function Grades() {
  const [jegyek, setJegyek] = useState<Grade[]>([]);
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
    const data: Grade[] = [
      { targy: "Matematika", jegy: 5, datum: "2025.02.14", megjegyzes: "Kiváló dolgozat" },
      { targy: "Programozás", jegy: 4, datum: "2025.03.03", megjegyzes: "Stabil teljesítmény" },
      { targy: "Történelem", jegy: 3, datum: "2025.04.12", megjegyzes: "Javulás tapasztalható" },
    ];
    setJegyek(data);
  }, []);

  const atlag =
    jegyek.length > 0
      ? (
          jegyek.reduce((sum: number, j: Grade) => sum + j.jegy, 0) / jegyek.length
        ).toFixed(2)
      : "Nincs adat";

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

      <p className="udvozles">Jegyek, értékelések</p>

      <div className="tablazat-container">
        <table className="jegyek-tablazat">
          <thead>
            <tr>
              <th>Tantárgy</th>
              <th>Jegy</th>
              <th>Dátum</th>
              <th>Megjegyzés</th>
            </tr>
          </thead>
          <tbody>
            {jegyek.length === 0 ? (
              <tr>
                <td colSpan={4}>Nincsenek elérhető jegyek</td>
              </tr>
            ) : (
              jegyek.map((j, index) => (
                <tr key={index}>
                  <td>{j.targy}</td>
                  <td>{j.jegy}</td>
                  <td>{j.datum}</td>
                  <td>{j.megjegyzes}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {jegyek.length > 0 && (
          <p style={{ marginTop: "15px", fontWeight: "bold" }}>Átlag: {atlag}</p>
        )}
      </div>

      <footer className="footer-text">© 2025 TanEdu | Hallgatói rendszer</footer>
    </div>
  );
}
// ...existing code...