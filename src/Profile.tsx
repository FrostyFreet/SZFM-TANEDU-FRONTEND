// ...existing code...
import { useEffect, useState } from "react";
import "./index.css";

type Profile = {
  nev: string;
  azonosito: string;
  anyjaNeve: string;
  szuletesiHely: string;
  szuletesiIdo: string;
  telefon: string;
  email: string;
  kepzes: string;
  kezdes: string;
  felev: number;
  varhatoVegzes: string;
};

export default function Adatok() {
  const [adatok, setAdatok] = useState<Profile | null>(null);

  const kijelentkezes = () => {
    console.log("Kijelentkezés...");
    // token törlés vagy navigate("/login")
  };

  useEffect(() => {
    // Példaadatok, később API-ról jöhetnek
    const data: Profile = {
      nev: "Kiss Ákos",
      azonosito: "HA123456",
      anyjaNeve: "Nagy Mária",
      szuletesiHely: "Budapest",
      szuletesiIdo: "2003.05.17",
      telefon: "+36 30 123 4567",
      email: "kiss.akos@example.com",
      kepzes: "Programtervező informatikus BSc",
      kezdes: "2023.09.01",
      felev: 4,
      varhatoVegzes: "2026.06.30",
    };
    setAdatok(data);
  }, []);

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
            <td>{adatok.nev}</td>
          </tr>
          <tr>
            <td>Hallgatói azonosító</td>
            <td>{adatok.azonosito}</td>
          </tr>
          <tr>
            <td>Anyja neve</td>
            <td>{adatok.anyjaNeve}</td>
          </tr>
          <tr>
            <td>Születés helye</td>
            <td>{adatok.szuletesiHely}</td>
          </tr>
          <tr>
            <td>Születés ideje</td>
            <td>{adatok.szuletesiIdo}</td>
          </tr>
          <tr>
            <td>Telefon</td>
            <td>{adatok.telefon}</td>
          </tr>
          <tr>
            <td>E-mail cím</td>
            <td>{adatok.email}</td>
          </tr>
          <tr>
            <td>Képzés neve</td>
            <td>{adatok.kepzes}</td>
          </tr>
          <tr>
            <td>Kezdés időpontja</td>
            <td>{adatok.kezdes}</td>
          </tr>
          <tr>
            <td>Elkezdett félévek</td>
            <td>{adatok.felev}</td>
          </tr>
          <tr>
            <td>Várható végzés</td>
            <td>{adatok.varhatoVegzes}</td>
          </tr>
        </tbody>
      </table>

      <footer className="footer-text">© 2025 TanEdu | Hallgatói rendszer</footer>
    </div>
  );
}
// ...existing code...