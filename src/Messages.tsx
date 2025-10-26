import { useState } from "react";
import "./index.css";

export default function Uzenetek() {
  const [showNewMsgModal, setShowNewMsgModal] = useState(false);
  const [showViewMsgModal, setShowViewMsgModal] = useState(false);

  const [formData, setFormData] = useState({
    cimzett: "",
    targy: "",
    uzenet: "",
  });

  const handleInput = (e:any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSend = (e:any) => {
    e.preventDefault();
    console.log("Küldött üzenet:", formData);
    setShowNewMsgModal(false);
    setFormData({ cimzett: "", targy: "", uzenet: "" });
  };

  const kijelentkezes = () => {
    console.log("Kijelentkezés...");
    // ide jönne pl. token törlés, navigate("/login")
  };

  return (
    <div className="hatter">
      <button onClick={kijelentkezes} id="kijelentkezesBtn">
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

      <div className="fokusz-terulet">
        <p className="udvozles">Üzenetek</p>

        <div className="fokusz-tartalom">
          <div className="oldalsav">
            <button
              id="openMessageBtn"
              type="button"
              onClick={() => setShowNewMsgModal(true)}
            >
              Üzenet küldése
            </button>
            <a href="#beerkezett">Beérkező üzenetek</a>
            <a href="#elkuldott">Elküldött üzenetek</a>
          </div>

          <div className="uzenet-tartalom">
            <div className="uzenet-lista">
              <table></table>
            </div>
            <div className="uzenet-vezerelemek">
              <label htmlFor="uzenet-darab">Üzenetek száma:</label>
              <select id="uzenet-darab">
                <option value="20">20</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Új üzenet modal */}
      {showNewMsgModal && (
        <div className="modal">
          <div className="modal-tartalom">
            <span
              className="close"
              onClick={() => setShowNewMsgModal(false)}
              role="button"
            >
              &times;
            </span>
            <h2>Új üzenet küldése</h2>
            <form onSubmit={handleSend}>
              <label htmlFor="cimzett">Címzett:</label>
              <input
                type="text"
                id="cimzett"
                name="cimzett"
                value={formData.cimzett}
                onChange={handleInput}
                required
              />

              <label htmlFor="targy">Tárgy:</label>
              <input
                type="text"
                id="targy"
                name="targy"
                value={formData.targy}
                onChange={handleInput}
                required
              />

              <label htmlFor="uzenet">Üzenet:</label>
              <textarea
                id="uzenet"
                name="uzenet"
                rows={parseInt("5")}
                value={formData.uzenet}
                onChange={handleInput}
                required
              />
              <button type="submit">Küldés</button>
            </form>
          </div>
        </div>
      )}

      {/* Megtekintés modal */}
      {showViewMsgModal && (
        <div className="modal">
          <div className="modal-tartalom">
            <span
              className="close"
              onClick={() => setShowViewMsgModal(false)}
              role="button"
            >
              &times;
            </span>
            <h2 style={{ textAlign: "center", color: "blue" }}>
              Üzenet részletei
            </h2>
            <p>
              <span className="data">Feladó:</span>{" "}
              <span id="megtekintFelado">Példa Feladó</span>
            </p>
            <p>
              <span className="data">Címzett:</span>{" "}
              <span id="megtekintCimzett">Példa Címzett</span>
            </p>
            <p>
              <span className="data">Tárgy:</span>{" "}
              <span id="megtekintTargy">Példa tárgy</span>
            </p>
            <p>
              <span className="data">Dátum:</span>{" "}
              <span id="megtekintDatum">2025.10.26</span>
            </p>
            <p>
              <span className="data">Üzenet:</span>
            </p>
            <p id="megtekintUzenet" style={{ whiteSpace: "pre-wrap" }}>
              Ez egy példaszöveg az üzenet tartalmához.
            </p>
          </div>
        </div>
      )}

      <footer className="footer-text">
        © 2025 TanEdu | Hallgatói rendszer
      </footer>
    </div>
  );
}
