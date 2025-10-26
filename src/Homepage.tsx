import "./index.css";

export default function Homepage() {
  return (
    <div>
      <div className="fejlec">
        <p className="udvozles">Üdvözlünk!</p>
        <h1>© 2025 TanEdu | Hallgatói rendszer</h1>
      </div>

      <div className="hatter">
        <div className="opciok">
          <a href="/orarend">
            <div className="emoji">📅</div>
            Órarend
          </a>
        </div>

        <div className="opciok">
          <a href="/jegyek">
            <div className="emoji">📊</div>
            Jegyek, értékelések
          </a>
        </div>

        <div className="opciok">
          <a href="/uzenetek">
            <div className="emoji">📩</div>
            Üzenetek
          </a>
        </div>

        <div className="opciok">
          <a href="/adatok">
            <div className="emoji">👤</div>
            Adatok
          </a>
        </div>
      </div>
    </div>
  );
}
