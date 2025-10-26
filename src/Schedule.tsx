// ...existing code...
import { useState } from "react";
import "./index.css";

type Lesson = {
  targy: string;
  tema: string;
  tanar: string;
  terem: string;
};

type ScheduleRow = {
  idopont: string;
  hetfo: Lesson | null;
  kedd: Lesson | null;
  szerda: Lesson | null;
  csutortok: Lesson | null;
  pentek: Lesson | null;
};

export default function Schedule() {
  const [showModal, setShowModal] = useState(false);
  const [selectedOra, setSelectedOra] = useState<Lesson | null>(null);

  const kijelentkezes = () => {
    console.log("Kijelentkezés...");
    // Ide jöhet pl. token törlés, navigate("/login")
  };

  // Mintaadat órákhoz
  const orak: ScheduleRow[] = [
    {
      idopont: "8:00 - 10:00",
      hetfo: { targy: "Matematika", tema: "Integrálszámítás", tanar: "Kovács Béla", terem: "A101" },
      kedd: null,
      szerda: { targy: "Programozás", tema: "Java bevezetés", tanar: "Szabó Anna", terem: "B203" },
      csutortok: null,
      pentek: null,
    },
    {
      idopont: "10:00 - 12:00",
      hetfo: null,
      kedd: { targy: "Történelem", tema: "Középkor", tanar: "Varga István", terem: "C302" },
      szerda: null,
      csutortok: null,
      pentek: null,
    },
  ];

  const handleCellClick = (ora: Lesson | null) => {
    if (!ora) return;
    setSelectedOra(ora);
    setShowModal(true);
  };

  return (
    // ...existing JSX unchanged...
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

      <p className="udvozles">Órarend</p>

      <div className="tablazat-container">
        <table className="tablazat">
          <thead>
            <tr>
              <th>Időpont</th>
              <th>Hétfő</th>
              <th>Kedd</th>
              <th>Szerda</th>
              <th>Csütörtök</th>
              <th>Péntek</th>
            </tr>
          </thead>
          <tbody>
            {orak.map((sor, index) => (
              <tr key={index}>
                <td>{sor.idopont}</td>
                <td onClick={() => handleCellClick(sor.hetfo)}>
                  {sor.hetfo?.targy || ""}
                </td>
                <td onClick={() => handleCellClick(sor.kedd)}>
                  {sor.kedd?.targy || ""}
                </td>
                <td onClick={() => handleCellClick(sor.szerda)}>
                  {sor.szerda?.targy || ""}
                </td>
                <td onClick={() => handleCellClick(sor.csutortok)}>
                  {sor.csutortok?.targy || ""}
                </td>
                <td onClick={() => handleCellClick(sor.pentek)}>
                  {sor.pentek?.targy || ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && selectedOra && (
        <div className="modal">
          <div className="modal-tartalom">
            <span className="close" onClick={() => setShowModal(false)}>
              &times;
            </span>
            <h2 id="oraTargy" style={{ color: "blue" }}>
              {selectedOra.targy}
            </h2>
            <p>
              <span className="data">Óra témája:</span>{" "}
              <span id="oraCim">{selectedOra.tema}</span>
            </p>
            <p>
              <span className="data">Oktató:</span>{" "}
              <span id="oraTanar">{selectedOra.tanar}</span>
            </p>
            <p>
              <span className="data">Terem:</span>{" "}
              <span id="oraTerem">{selectedOra.terem}</span>
            </p>
          </div>
        </div>
      )}

      <footer className="footer-text">© 2025 TanEdu | Hallgatói rendszer</footer>
    </div>
  );
}
