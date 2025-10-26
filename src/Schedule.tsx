// ...existing code...
import { useEffect, useState } from "react";
import "./index.css";
import axios from "axios";
import { useNavigate } from "react-router";

type CourseApi = {
  id: number;
  name: string;
  day: string;
  duration: string;
  teacherName: string;
  departmentName: string;
};

type CourseCell = CourseApi | null;

type ScheduleRow = {
  duration: string;
  hetfo: CourseCell;
  kedd: CourseCell;
  szerda: CourseCell;
  csutortok: CourseCell;
  pentek: CourseCell;
};

type DayKey = Exclude<keyof ScheduleRow, "duration">;

export default function Schedule() {
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseApi | null>(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const kijelentkezes = async () => {
    try {
      await axios.post(
        "http://localhost:8080/api/auth/logout",
        {},
        {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        }
      );
    } catch (err) {
      console.warn("Logout request failed:", err);
    } finally {
      localStorage.removeItem("token");
      navigate("/");
    }
  };

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        if (!token) {
          setRows([]);
          return;
        }
        const resp = await axios.get<CourseApi[]>(
          "http://localhost:8080/api/course/getCourseByDepartmentName",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const courses = Array.isArray(resp.data) ? resp.data : [];

        // build unique durations preserving first appearance order
        const durations: string[] = [];
        for (const c of courses) {
          if (!durations.includes(c.duration)) durations.push(c.duration);
        }

        const mapDayToKey = (day: string): DayKey => {
          const d = day.trim().toLowerCase();
          if (d.startsWith("hét") || d === "hetfo" || d === "hétfő") return "hetfo";
          if (d.startsWith("ked")) return "kedd";
          if (d.startsWith("sze")) return "szerda";
          if (d.startsWith("csü") || d.startsWith("csu") || d.startsWith("csüt")) return "csutortok";
          if (d.startsWith("pén") || d.startsWith("pen")) return "pentek";
          return "kedd";
        };

        const builtRows: ScheduleRow[] = durations.map((duration) => {
          const base: ScheduleRow = {
            duration,
            hetfo: null,
            kedd: null,
            szerda: null,
            csutortok: null,
            pentek: null,
          };
          for (const c of courses) {
            if (c.duration !== duration) continue;
            const key = mapDayToKey(c.day);
            base[key] = c;
          }
          return base;
        });

        setRows(builtRows);
      } catch (error) {
        console.error("Schedule fetch failed:", error);
        setRows([]);
      }
    };

    fetchSchedule();
  }, [token]);

  const handleCellClick = (course: CourseApi | null) => {
    if (!course) return;
    setSelectedCourse(course);
    setShowModal(true);
  };

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
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6}>Nincs elérhető órarend</td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.duration}</td>
                  <td onClick={() => handleCellClick(r.hetfo)}>{r.hetfo?.name || ""}</td>
                  <td onClick={() => handleCellClick(r.kedd)}>{r.kedd?.name || ""}</td>
                  <td onClick={() => handleCellClick(r.szerda)}>{r.szerda?.name || ""}</td>
                  <td onClick={() => handleCellClick(r.csutortok)}>{r.csutortok?.name || ""}</td>
                  <td onClick={() => handleCellClick(r.pentek)}>{r.pentek?.name || ""}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && selectedCourse && (
        <div className="modal">
          <div className="modal-tartalom">
            <span className="close" onClick={() => setShowModal(false)}>
              &times;
            </span>
            <h2 id="oraTargy" style={{ color: "blue" }}>
              {selectedCourse.name}
            </h2>
            <p>
              <span className="data">Nap:</span> <span>{selectedCourse.day}</span>
            </p>
            <p>
              <span className="data">Időtartam:</span> <span>{selectedCourse.duration}</span>
            </p>
            <p>
              <span className="data">Oktató:</span> <span>{selectedCourse.teacherName}</span>
            </p>
            <p>
              <span className="data">Osztály / csoport:</span> <span>{selectedCourse.departmentName}</span>
            </p>
          </div>
        </div>
      )}

      <footer className="footer-text">© 2025 TanEdu | Hallgatói rendszer</footer>
    </div>
  );
}
